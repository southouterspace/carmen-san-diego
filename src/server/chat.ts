import { Server, type WSMessage } from "partyserver";
import type { Connection, ConnectionContext } from "partyserver";
import type {
	ChatMessage,
	ChatOutgoingMessage,
	ChatIncomingMessage,
} from "../shared";
import { ChatDatabase } from "./services/database";
import { generateDetectiveName } from "./utils/nameGenerator";

type ChatConnectionState = {
	username: string;
};

// Extend Env to include D1 binding
interface ChatEnv extends Env {
	DB?: D1Database;
}

export class Chat extends Server<ChatEnv> {
	private db: ChatDatabase | null = null;

	async onStart(): Promise<void> {
		// Initialize database service if D1 binding exists
		const env = this.env;
		if (env?.DB) {
			this.db = new ChatDatabase(env.DB);
		}
	}

	async onConnect(
		conn: Connection<ChatConnectionState>,
		ctx: ConnectionContext,
	): Promise<void> {
		// Generate random detective name
		const username = generateDetectiveName();
		conn.setState({ username });

		// Send the assigned username to the client
		conn.send(
			JSON.stringify({
				type: "user-assigned",
				username,
			} satisfies ChatOutgoingMessage),
		);

		try {
			// Load and send chat history (last 50 messages)
			if (this.db) {
				const history = await this.db.getRecentMessages(50);
				conn.send(
					JSON.stringify({
						type: "chat-history",
						messages: history,
					} satisfies ChatOutgoingMessage),
				);
			}

			// Notify others that user joined
			this.broadcast(
				JSON.stringify({
					type: "user-joined",
					username,
				} satisfies ChatOutgoingMessage),
				[conn.id],
			);
		} catch (error) {
			console.error("Error on chat connect:", error);
			conn.send(
				JSON.stringify({
					type: "error",
					error: "Failed to load chat history",
				} satisfies ChatOutgoingMessage),
			);
		}
	}

	async onMessage(
		conn: Connection<ChatConnectionState>,
		messageStr: WSMessage,
	): Promise<void> {
		try {
			const incomingMessage = JSON.parse(
				messageStr as string,
			) as ChatIncomingMessage;

			if (incomingMessage.type === "send-message") {
				const username = conn.state?.username || "Unknown Detective";
				const content = incomingMessage.content?.trim() || "";

				// Validate message
				if (!content || content.length > 500) {
					conn.send(
						JSON.stringify({
							type: "error",
							error: "Message must be between 1 and 500 characters",
						} satisfies ChatOutgoingMessage),
					);
					return;
				}

				const chatMessage: ChatMessage = {
					id: crypto.randomUUID(),
					userId: conn.id,
					username,
					content,
					timestamp: Date.now(),
				};

				// Save to database
				if (this.db) {
					await this.db.saveMessage(chatMessage);
				}

				// Broadcast to all connections
				this.broadcast(
					JSON.stringify({
						type: "chat-message",
						message: chatMessage,
					} satisfies ChatOutgoingMessage),
				);
			}
		} catch (error) {
			console.error("Error processing chat message:", error);
			conn.send(
				JSON.stringify({
					type: "error",
					error: "Failed to send message",
				} satisfies ChatOutgoingMessage),
			);
		}
	}

	onClose(connection: Connection<ChatConnectionState>): void {
		const username = connection.state?.username;
		if (username) {
			this.broadcast(
				JSON.stringify({
					type: "user-left",
					username,
				} satisfies ChatOutgoingMessage),
				[connection.id],
			);
		}
	}

	onError(connection: Connection<ChatConnectionState>): void {
		this.onClose(connection);
	}
}
