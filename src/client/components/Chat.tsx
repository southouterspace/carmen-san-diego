import React, { useState, useEffect, useRef } from "react";
import usePartySocket from "partysocket/react";
import type {
	ChatMessage,
	ChatOutgoingMessage,
	ChatIncomingMessage,
} from "../../shared";
import "./Chat.css";

export function Chat() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [username, setUsername] = useState<string | null>(null);
	const [connectionStatus, setConnectionStatus] = useState<
		"connecting" | "connected" | "error"
	>("connecting");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const socket = usePartySocket({
		room: "global",
		party: "chat",
		onOpen() {
			setConnectionStatus("connected");
		},
		onClose() {
			setConnectionStatus("connecting");
		},
		onError() {
			setConnectionStatus("error");
		},
		onMessage(evt) {
			const message = JSON.parse(evt.data as string) as ChatOutgoingMessage;

			switch (message.type) {
				case "chat-history":
					setMessages(message.messages);
					break;

				case "chat-message":
					setMessages((prev) => [...prev, message.message]);
					break;

				case "user-assigned":
					setUsername(message.username);
					break;

				case "user-joined":
					console.log(`${message.username} joined the chat`);
					break;

				case "user-left":
					console.log(`${message.username} left the chat`);
					break;

				case "error":
					console.error("Chat error:", message.error);
					break;
			}
		},
	});

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = inputValue.trim();

		if (!trimmed || trimmed.length > 500) {
			return;
		}

		if (connectionStatus === "connected") {
			socket.send(
				JSON.stringify({
					type: "send-message",
					content: trimmed,
				} satisfies ChatIncomingMessage),
			);
			setInputValue("");
		}
	};

	return (
		<div className="chat-container">
			<div className="chat-header">
				<h2>Detective Chat</h2>
				{username && <span className="chat-username">{username}</span>}
				<span className={`chat-status chat-status-${connectionStatus}`}>
					{connectionStatus === "connected"
						? "Online"
						: connectionStatus === "connecting"
							? "Connecting..."
							: "Offline"}
				</span>
			</div>

			<div className="chat-messages">
				{messages.length === 0 ? (
					<div className="chat-empty">
						No messages yet. Start the investigation!
					</div>
				) : (
					messages.map((msg) => (
						<div
							key={msg.id}
							className={`chat-message ${msg.userId === socket.id ? "chat-message-own" : ""}`}
						>
							<span className="chat-message-username">{msg.username}</span>
							<span className="chat-message-content">{msg.content}</span>
							<span className="chat-message-time">
								{new Date(msg.timestamp).toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</span>
						</div>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			<form className="chat-input-form" onSubmit={handleSubmit}>
				<input
					type="text"
					className="chat-input"
					placeholder={
						username ? `Send a message as ${username}...` : "Send a message..."
					}
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					maxLength={500}
					disabled={connectionStatus !== "connected"}
				/>
				<button
					type="submit"
					className="chat-submit"
					disabled={!inputValue.trim() || connectionStatus !== "connected"}
				>
					Send
				</button>
			</form>
		</div>
	);
}
