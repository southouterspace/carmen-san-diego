import "./styles.css";

import React, { useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import usePartySocket from "partysocket/react";

// The type of messages we'll be receiving from the server
import type { OutgoingMessage } from "../shared";

// Chat component
import { Chat } from "./components/Chat";

// Online users popover
import { OnlineUsersPopover } from "./components/OnlineUsersPopover";

// Type for tracking online users
type OnlineUser = {
	id: string;
	username: string;
};

// Users icon component
function UsersIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</svg>
	);
}

function App() {
	const [users, setUsers] = useState<OnlineUser[]>([]);
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	// Connect to the PartyServer server for user count
	usePartySocket({
		room: "default",
		party: "globe",
		onMessage(evt) {
			let message: OutgoingMessage;
			try {
				message = JSON.parse(evt.data as string) as OutgoingMessage;
			} catch (error) {
				console.error("Failed to parse message:", error);
				return;
			}
			if (message.type === "add-marker") {
				setUsers((prev) => {
					// Avoid duplicates
					if (prev.some((u) => u.id === message.position.id)) {
						return prev;
					}
					return [...prev, { id: message.position.id, username: message.position.username }];
				});
			} else {
				setUsers((prev) => prev.filter((u) => u.id !== message.id));
			}
		},
	});

	const togglePopover = useCallback(() => {
		setIsPopoverOpen((prev) => !prev);
	}, []);

	const closePopover = useCallback(() => {
		setIsPopoverOpen(false);
	}, []);

	return (
		<div className="fixed inset-0 bg-zinc-950 text-zinc-100 overflow-hidden">
			{/* Users count - top right */}
			<div className="absolute top-4 right-4 z-10">
				<button
					onClick={togglePopover}
					className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-sm px-3 py-2 rounded-full hover:bg-zinc-800/80 transition-colors cursor-pointer"
					aria-label="Show online users"
					aria-expanded={isPopoverOpen}
				>
					<UsersIcon className="text-red-500" />
					<span className="text-sm font-medium text-zinc-300">{users.length}</span>
				</button>
				<OnlineUsersPopover
					users={users}
					isOpen={isPopoverOpen}
					onClose={closePopover}
				/>
			</div>

			{/* Chat component */}
			<Chat />
		</div>
	);
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(<App />);
