import type { ChatMessage } from "../../shared";

export class ChatDatabase {
	constructor(private db: D1Database) {}

	async saveMessage(message: ChatMessage): Promise<void> {
		await this.db
			.prepare(
				"INSERT INTO chat_messages (id, user_id, username, content, timestamp) VALUES (?, ?, ?, ?, ?)",
			)
			.bind(
				message.id,
				message.userId,
				message.username,
				message.content,
				message.timestamp,
			)
			.run();
	}

	async getRecentMessages(limit: number = 50): Promise<ChatMessage[]> {
		const result = await this.db
			.prepare(
				"SELECT id, user_id as userId, username, content, timestamp FROM chat_messages ORDER BY timestamp DESC LIMIT ?",
			)
			.bind(limit)
			.all<ChatMessage>();

		// Reverse to get chronological order (oldest first)
		return (result.results || []).reverse();
	}
}
