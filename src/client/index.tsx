import "./styles.css";

import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import createGlobe from "cobe";
import usePartySocket from "partysocket/react";

// The type of messages we'll be receiving from the server
import type { OutgoingMessage } from "../shared";
import type { LegacyRef } from "react";

// Chat component
import { Chat } from "./components/Chat";

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

// Convert lat/lng to phi/theta angles for the globe
function locationToAngles(lat: number, lng: number): [number, number] {
	return [Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180];
}

function App() {
	// A reference to the canvas element where we'll render the globe
	const canvasRef = useRef<HTMLCanvasElement>();
	// The number of markers we're currently displaying
	const [counter, setCounter] = useState(0);
	// The user's own coordinates (kept for globe focus)
	const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
	// A map of marker IDs to their positions
	const positions = useRef<
		Map<
			string,
			{
				location: [number, number];
				size: number;
			}
		>
	>(new Map());
	// Connect to the PartyServer server
	const socket = usePartySocket({
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
				positions.current.set(message.position.id, {
					location: [message.position.lat, message.position.lng],
					size: message.position.id === socket.id ? 0.1 : 0.05,
				});
				if (message.position.id === socket.id) {
					setMyCoords({ lat: message.position.lat, lng: message.position.lng });
				}
				setCounter((c) => c + 1);
			} else {
				positions.current.delete(message.id);
				setCounter((c) => c - 1);
			}
		},
	});

	// Refs for globe rotation and drag state
	const focusRef = useRef<[number, number]>([0, 0]);
	const pointerInteracting = useRef<number | null>(null);
	const pointerInteractionMovement = useRef(0);

	// Update focus point when user coordinates are received
	useEffect(() => {
		if (myCoords) {
			focusRef.current = locationToAngles(myCoords.lat, myCoords.lng);
		}
	}, [myCoords]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		let currentPhi = 0;
		let currentTheta = 0;
		const doublePi = Math.PI * 2;

		const globe = createGlobe(canvas, {
			devicePixelRatio: 2,
			width: 300 * 2,
			height: 300 * 2,
			phi: 0,
			theta: 0,
			dark: 1,
			diffuse: 0.8,
			mapSamples: 60000,
			mapBrightness: 6,
			baseColor: [0.3, 0.3, 0.3],
			markerColor: [0.8, 0.1, 0.1],
			glowColor: [0.2, 0.2, 0.2],
			markers: [],
			opacity: 0.7,
			onRender: (state) => {
				state.markers = [...positions.current.values()];
				state.phi = currentPhi;
				state.theta = currentTheta;

				if (pointerInteracting.current === null) {
					const [focusPhi, focusTheta] = focusRef.current;
					const distPositive = (focusPhi - currentPhi + doublePi) % doublePi;
					const distNegative = (currentPhi - focusPhi + doublePi) % doublePi;

					if (distPositive < distNegative) {
						currentPhi += distPositive * 0.08;
					} else {
						currentPhi -= distNegative * 0.08;
					}
					currentTheta = currentTheta * 0.92 + focusTheta * 0.08;

					currentPhi += pointerInteractionMovement.current;
					pointerInteractionMovement.current *= 0.95;
				}
			},
		});

		const onPointerDown = (e: PointerEvent) => {
			pointerInteracting.current = e.clientX;
			canvas.style.cursor = "grabbing";
		};

		const onPointerUp = () => {
			pointerInteracting.current = null;
			canvas.style.cursor = "grab";
		};

		const onPointerMove = (e: PointerEvent) => {
			if (pointerInteracting.current !== null) {
				const delta = e.clientX - pointerInteracting.current;
				pointerInteractionMovement.current = delta / 100;
				pointerInteracting.current = e.clientX;
				currentPhi += delta / 100;
			}
		};

		canvas.style.cursor = "grab";
		canvas.addEventListener("pointerdown", onPointerDown);
		canvas.addEventListener("pointerup", onPointerUp);
		canvas.addEventListener("pointerout", onPointerUp);
		canvas.addEventListener("pointermove", onPointerMove);

		return () => {
			globe.destroy();
			if (canvas) {
				canvas.removeEventListener("pointerdown", onPointerDown);
				canvas.removeEventListener("pointerup", onPointerUp);
				canvas.removeEventListener("pointerout", onPointerUp);
				canvas.removeEventListener("pointermove", onPointerMove);
			}
		};
	}, []);

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
			{/* Fixed globe in background */}
			<div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-30">
				<canvas
					ref={canvasRef as LegacyRef<HTMLCanvasElement>}
					className="pointer-events-auto"
					style={{ width: 300, height: 300, aspectRatio: 1 }}
				/>
			</div>

			{/* Users count - top right */}
			<div className="fixed top-4 right-4 flex items-center gap-2 bg-zinc-900/80 backdrop-blur-sm px-3 py-2 rounded-full z-10">
				<UsersIcon className="text-red-500" />
				<span className="text-sm font-medium text-zinc-300">{counter}</span>
			</div>

			{/* Chat component */}
			<Chat />
		</div>
	);
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(<App />);
