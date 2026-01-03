import React, { useEffect, useRef } from "react";

type OnlineUser = {
	id: string;
	username: string;
};

// Avatar component (same as in Chat)
function Avatar({ username, size = "sm" }: { username: string; size?: "sm" | "md" }) {
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

	const sizeClasses = size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";

	return (
		<div
			className={`flex-shrink-0 rounded-full ${colorClass} ${sizeClasses} flex items-center justify-center text-white font-semibold`}
		>
			{initials || "?"}
		</div>
	);
}

type OnlineUsersPopoverProps = {
	users: OnlineUser[];
	isOpen: boolean;
	onClose: () => void;
};

export function OnlineUsersPopover({ users, isOpen, onClose }: OnlineUsersPopoverProps) {
	const popoverRef = useRef<HTMLDivElement>(null);

	// Close popover when clicking outside
	useEffect(() => {
		if (!isOpen) return;

		function handleClickOutside(event: MouseEvent) {
			if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
				onClose();
			}
		}

		// Add listener with a slight delay to prevent immediate closing
		const timeoutId = setTimeout(() => {
			document.addEventListener("mousedown", handleClickOutside);
		}, 0);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen, onClose]);

	// Close on escape key
	useEffect(() => {
		if (!isOpen) return;

		function handleEscape(event: KeyboardEvent) {
			if (event.key === "Escape") {
				onClose();
			}
		}

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			ref={popoverRef}
			className="absolute top-full right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50"
		>
			<div className="px-4 py-3 border-b border-zinc-800">
				<h3 className="text-sm font-semibold text-zinc-100">
					Online Detectives
				</h3>
				<p className="text-xs text-zinc-500 mt-0.5">
					{users.length} {users.length === 1 ? "user" : "users"} online
				</p>
			</div>
			<div className="max-h-64 overflow-y-auto">
				{users.length === 0 ? (
					<div className="px-4 py-6 text-center text-zinc-500 text-sm">
						No users online
					</div>
				) : (
					<ul className="py-2">
						{users.map((user) => (
							<li
								key={user.id}
								className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/50 transition-colors"
							>
								<Avatar username={user.username} />
								<span className="text-sm text-zinc-300 truncate">
									{user.username}
								</span>
								<span className="ml-auto flex-shrink-0 w-2 h-2 bg-green-500 rounded-full" />
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
