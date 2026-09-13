import type { Control } from "leaflet";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** React owns this separate container; Leaflet may rebuild its own layer list. */
export default function LayerOptions({
	control,
	children,
}: {
	control: Control.Layers | null;
	children: ReactNode;
}) {
	const [container] = useState(() => {
		const node = document.createElement("div");
		node.className = "selected-train-options";
		return node;
	});
	useEffect(() => {
		const parent = control?.getContainer();
		if (!parent) return;
		parent.appendChild(container);
		return () => container.remove();
	}, [control, container]);
	return createPortal(children, container);
}
