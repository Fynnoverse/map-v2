import {
	Control as LeafletControl,
	DomEvent,
	type ControlPosition,
} from "leaflet";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-leaflet";

/** Leaflet owns the container; React owns its contents through a portal. */
export default function MapControl({
	position,
	children,
}: {
	position: ControlPosition;
	children: ReactNode;
}) {
	const map = useMap();
	const [container] = useState(() => document.createElement("div"));
	useEffect(() => {
		const control = new LeafletControl({ position });
		control.onAdd = () => container;
		DomEvent.disableClickPropagation(container);
		DomEvent.disableScrollPropagation(container);
		control.addTo(map);
		return () => {
			control.remove();
			DomEvent.off(container);
		};
	}, [map, position, container]);
	return createPortal(children, container);
}
