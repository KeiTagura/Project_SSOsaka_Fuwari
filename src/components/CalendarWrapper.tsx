import React, { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import Calendar from "./Calendar";

const FC_GLOBAL_CSS =
	"https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.css"; // use the same FC version you installed

const BOOTSTRAP_CSS =
	"https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";
const BOOTSTRAP_ICONS =
	"https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css";

export default function CalendarWrapper() {
	const hostRef = useRef<HTMLDivElement | null>(null);
	const rootRef = useRef<Root | null>(null);

	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;

		// Create the shadow root (recreate on HMR)
		const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });

		// Helper to add a stylesheet link inside shadow
		const addCss = (href: string) => {
			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = href;
			shadow.appendChild(link);
			return link;
		};

		// Inject Bootstrap CSS + Icons scoped to shadow
		const links = [
			addCss(BOOTSTRAP_CSS),
			addCss(BOOTSTRAP_ICONS),
			addCss(FC_GLOBAL_CSS),
		];

		// Optional: a Bootstrap container shell for nice spacing
		const shell = document.createElement("div");
		shell.className = "container-fluid py-3";
		shadow.appendChild(shell);

		// React mount
		const mount = document.createElement("div");
		shell.appendChild(mount);

		const root = createRoot(mount);
		rootRef.current = root;
		root.render(<Calendar />);

		// Cleanup on unmount/HMR
		return () => {
			rootRef.current?.unmount();
			links.forEach((l) => l.remove());
			shell.remove();
		};
	}, []);

	// Host element (light DOM); all UI renders inside its shadow
	return <div ref={hostRef} style={{ display: "block", width: "100%" }} />;
}
