import React, { useState, useEffect, useRef } from "react";
import usePartySocket from "partysocket/react";
import type {
	ChatMessage,
	ChatOutgoingMessage,
	ChatIncomingMessage,
} from "../../shared";

// Send icon
function SendIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="m5 12 14-7-7 14v-7H5Z" />
		</svg>
	);
}

// Avatar component
function Avatar({ username }: { username: string }) {
	const colors = [
		"bg-red-500",
		"bg-orange-500",
		"bg-amber-500",
		"bg-yellow-500",
		"bg-lime-500",
		"bg-green-500",
		"bg-emerald-500",
		"bg-teal-500",
		"bg-cyan-500",
		"bg-sky-500",
		"bg-blue-500",
		"bg-indigo-500",
		"bg-violet-500",
		"bg-purple-500",
		"bg-fuchsia-500",
		"bg-pink-500",
		"bg-rose-500",
	];

	// Generate consistent color from username
	const hash = username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
	const colorClass = colors[hash % colors.length];

	// Get initials (first letter of each word, max 2)
	const initials = username
		.split(/[\s_-]+/)
		.slice(0, 2)
		.map((word) => word[0]?.toUpperCase() || "")
		.join("");

	return (
		<div
			className={`flex-shrink-0 w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-white text-xs font-semibold`}
		>
			{initials || "?"}
		</div>
	);
}

export function Chat() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [username, setUsername] = useState<string | null>(null);
	const [connectionStatus, setConnectionStatus] = useState<
		"connecting" | "connected" | "error"
	>("connecting");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

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
			let message: ChatOutgoingMessage;
			try {
				message = JSON.parse(evt.data as string) as ChatOutgoingMessage;
			} catch (error) {
				console.error("Failed to parse chat message:", error);
				return;
			}

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
		const container = messagesContainerRef.current;
		if (container) {
			container.scrollTop = container.scrollHeight;
		}
	}, [messages]);

	// Auto-resize textarea
	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInputValue(e.target.value);
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
		}
	};

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
			// Reset textarea height
			if (textareaRef.current) {
				textareaRef.current.style.height = "auto";
			}
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	return (
		<>
			{/* Messages area - fixed height, scrollable, anchored to bottom */}
			<div
				ref={messagesContainerRef}
				className="fixed inset-x-0 bottom-20 top-0 overflow-y-auto z-10"
				style={{
					maskImage: "linear-gradient(to bottom, transparent 0%, black 15%)",
					WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%)",
				}}
			>
				<div className="min-h-full flex flex-col justify-end">
					<div className="max-w-2xl mx-auto w-full px-4 py-4 space-y-3">
				{messages.length === 0 ? (
					<div className="text-center text-zinc-500 py-8">
						No messages yet. Start the investigation!
					</div>
				) : (
					messages.map((msg) => {
						const isOwn = msg.userId === socket.id;

						if (isOwn) {
							return (
								<div key={msg.id} className="flex flex-col items-end">
									<p className="text-zinc-200 text-sm leading-relaxed break-words bg-red-950/40 rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]">
										{msg.content}
									</p>
									<span className="text-xs text-zinc-600 mt-1">
										{new Date(msg.timestamp).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</span>
								</div>
							);
						}

						return (
							<div key={msg.id} className="flex items-start gap-3">
								<Avatar username={msg.username} />
								<div className="flex-1 min-w-0">
									<div className="flex items-baseline gap-2 mb-1">
										<span className="text-sm font-medium text-zinc-400">
											{msg.username}
										</span>
										<span className="text-xs text-zinc-600">
											{new Date(msg.timestamp).toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
									</div>
									<p className="text-zinc-200 text-sm leading-relaxed break-words bg-zinc-800/50 rounded-2xl rounded-tl-sm px-4 py-2 inline-block">
										{msg.content}
									</p>
								</div>
							</div>
						);
					})
				)}
					<div ref={messagesEndRef} />
					</div>
				</div>
			</div>

			{/* Fixed input at bottom - shadcn input-group style */}
			<div className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-sm p-4">
				<form
					onSubmit={handleSubmit}
					className="max-w-2xl mx-auto"
				>
					<div className="relative bg-zinc-900 rounded-xl focus-within:ring-1 focus-within:ring-zinc-700">
						<textarea
							ref={textareaRef}
							className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-sm px-4 py-3 pr-12 resize-none focus:outline-none rounded-xl"
							placeholder={
								username
									? `Message as ${username}...`
									: "Send a message..."
							}
							value={inputValue}
							onChange={handleTextareaChange}
							onKeyDown={handleKeyDown}
							maxLength={500}
							disabled={connectionStatus !== "connected"}
							rows={1}
							aria-label="Chat message input"
						/>
						<button
							type="submit"
							className="absolute bottom-2 right-2 p-2 rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
							disabled={!inputValue.trim() || connectionStatus !== "connected"}
							aria-label="Send message"
						>
							<SendIcon />
						</button>
					</div>
				</form>
			</div>
		</>
	);
}
