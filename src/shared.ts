// Messages that we'll send to the client

// Representing a person's position
export type Position = {
	lat: number;
	lng: number;
	id: string;
};

export type OutgoingMessage =
	| {
			type: "add-marker";
			position: Position;
	  }
	| {
			type: "remove-marker";
			id: string;
	  };

// Chat message types
export type ChatMessage = {
	id: string;
	userId: string;
	username: string;
	content: string;
	timestamp: number;
};

export type ChatOutgoingMessage =
	| { type: "chat-history"; messages: ChatMessage[] }
	| { type: "chat-message"; message: ChatMessage }
	| { type: "user-joined"; username: string }
	| { type: "user-left"; username: string }
	| { type: "user-assigned"; username: string }
	| { type: "error"; error: string };

export type ChatIncomingMessage = { type: "send-message"; content: string };
