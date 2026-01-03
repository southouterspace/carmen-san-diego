import "./styles.css";

import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import createGlobe from "cobe";
import usePartySocket from "partysocket/react";

// The type of messages we'll be receiving from the server
import type { OutgoingMessage } from "../shared";
import type { LegacyRef } from "react";

function App() {
	// A reference to the canvas element where we'll render the globe
	const canvasRef = useRef<HTMLCanvasElement>();
	// The number of markers we're currently displaying
	const [counter, setCounter] = useState(0);
	// The user's own coordinates
	const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
	// A map of marker IDs to their positions
	// Note that we use a ref because the globe's `onRender` callback
	// is called on every animation frame, and we don't want to re-render
	// the component on every frame.
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
			const message = JSON.parse(evt.data as string) as OutgoingMessage;
			if (message.type === "add-marker") {
				// Add the marker to our map
				positions.current.set(message.position.id, {
					location: [message.position.lat, message.position.lng],
					size: message.position.id === socket.id ? 0.1 : 0.05,
				});
				// Save own coordinates
				if (message.position.id === socket.id) {
					setMyCoords({ lat: message.position.lat, lng: message.position.lng });
				}
				// Update the counter
				setCounter((c) => c + 1);
			} else {
				// Remove the marker from our map
				positions.current.delete(message.id);
				// Update the counter
				setCounter((c) => c - 1);
			}
		},
	});

	// Convert lat/lng to phi/theta angles for the globe
	const locationToAngles = (lat: number, lng: number): [number, number] => {
		return [Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180];
	};

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
		const canvas = canvasRef.current as HTMLCanvasElement;
		let currentPhi = 0;
		let currentTheta = 0;
		const doublePi = Math.PI * 2;

		const globe = createGlobe(canvas, {
			devicePixelRatio: 2,
			width: 400 * 2,
			height: 400 * 2,
			phi: 0,
			theta: 0,
			dark: 1,
			diffuse: 0.8,
			mapSamples: 16000,
			mapBrightness: 6,
			baseColor: [0.3, 0.3, 0.3],
			markerColor: [0.8, 0.1, 0.1],
			glowColor: [0.2, 0.2, 0.2],
			markers: [],
			opacity: 0.7,
			onRender: (state) => {
				// Called on every animation frame.
				state.markers = [...positions.current.values()];

				state.phi = currentPhi;
				state.theta = currentTheta;

				// Smooth rotation to focus point (when not dragging)
				if (pointerInteracting.current === null) {
					const [focusPhi, focusTheta] = focusRef.current;
					const distPositive = (focusPhi - currentPhi + doublePi) % doublePi;
					const distNegative = (currentPhi - focusPhi + doublePi) % doublePi;

					// Rotate in the shortest direction
					if (distPositive < distNegative) {
						currentPhi += distPositive * 0.08;
					} else {
						currentPhi -= distNegative * 0.08;
					}
					currentTheta = currentTheta * 0.92 + focusTheta * 0.08;

					// Apply drag momentum
					currentPhi += pointerInteractionMovement.current;
					pointerInteractionMovement.current *= 0.95;
				}
			},
		});

		// Drag handlers
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
			canvas.removeEventListener("pointerdown", onPointerDown);
			canvas.removeEventListener("pointerup", onPointerUp);
			canvas.removeEventListener("pointerout", onPointerUp);
			canvas.removeEventListener("pointermove", onPointerMove);
		};
	}, []);

	return (
		<div className="App">
			<h1>Where in the world is Carmen San Diego?</h1>
			{counter !== 0 ? (
				<p>
					<b>{counter}</b> {counter === 1 ? "person" : "people"} connected.
				</p>
			) : (
				<p>&nbsp;</p>
			)}

			{/* The canvas where we'll render the globe */}
			<canvas
				ref={canvasRef as LegacyRef<HTMLCanvasElement>}
				style={{ width: 400, height: 400, maxWidth: "100%", aspectRatio: 1 }}
			/>

			{myCoords && (
				<p>
					Your location: {myCoords.lat.toFixed(4)}, {myCoords.lng.toFixed(4)}
				</p>
			)}
		</div>
	);
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(<App />);
