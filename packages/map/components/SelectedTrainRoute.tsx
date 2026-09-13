import { useLocalStorage } from "@mantine/hooks";
import type { Station } from "@simrail/types";
import type { Control as LeafletControl } from "leaflet";
import { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";

import { EDR_API_URL, ROUTING_URL } from "@/components/hosting";
import LayerOptions from "@/components/LayerOptions";

import { useSelectedTrain } from "../contexts/SelectedTrainContext";
import {
	routingPoints,
	timetableRoute,
	type RoutePoint,
	type RouteStation,
} from "./routeGeometry";
import { routeRetry } from "./routeRetry";
import localStations from "./stations.json";
import remoteStations from "./stationsRemote.json";

type Result = {
	matched?: number;
	total?: number;
	key: string;
	points: RoutePoint[];
	status: "loading" | "railway" | "unavailable";
};

const SelectedTrainRoute = ({
	serverId,
	stations,
	controls,
	followTrain,
	onFollowTrainChange,
}: {
	serverId: string;
	stations: Station[];
	controls: LeafletControl.Layers | null;
	followTrain: boolean;
	onFollowTrainChange: (value: boolean) => void;
}) => {
	const { selectedTrain } = useSelectedTrain();
	const [visible, setVisible] = useLocalStorage({
		key: "showSelectedTrainRoute",
		defaultValue: true,
	});
	const [attempt, setAttempt] = useState(0);
	const [result, setResult] = useState<Result>({
		key: "",
		points: [],
		status: "loading",
	});
	const trainNumber = selectedTrain?.TrainNoLocal;
	// Stable across live station updates; retry only when names or coordinates change.
	const stationData = JSON.stringify(
		stations.map(({ Name, Prefix, id, Latititude, Longitude }) => ({
			Name,
			Prefix,
			id,
			Latititude,
			Longitude,
		})),
	);
	const key = `${serverId}:${trainNumber ?? ""}:${attempt}:${visible}:${stationData}`;
	const current: Omit<Result, "key"> =
		result.key === key ? result : { points: [], status: "loading" };

	useEffect(() => {
		if (!trainNumber || !visible) return;
		const controller = new AbortController();
		let coverage: { matched?: number; total?: number } = {};
		const publish = (points: RoutePoint[], status: Result["status"]) => {
			if (!controller.signal.aborted)
				setResult({ key, points, status, ...coverage });
		};
		const loadJson = async (url: string): Promise<unknown> => {
			const response = await fetch(url, {
				signal: AbortSignal.any([
					controller.signal,
					AbortSignal.timeout(15000),
				]),
			});
			if (!response.ok) throw new Error(`Request failed: ${response.status}`);
			return response.json() as Promise<unknown>;
		};
		const load = async () => {
			try {
				const timetable = await loadJson(
					`${EDR_API_URL}/train/${encodeURIComponent(serverId)}/${encodeURIComponent(trainNumber)}`,
				);
				const route = timetableRoute(timetable, [
					...localStations,
					...remoteStations,
					...(JSON.parse(stationData) as RouteStation[]),
				]);
				coverage = { matched: route.matched, total: route.total };
				if (route.points.length < 2) {
					publish([], "unavailable");
					return;
				}
				const coordinates = route.points
					.map(([lat, lon]) => `${lon},${lat}`)
					.join(";");
				const data = await loadJson(
					`${ROUTING_URL}/route/v1/train/${coordinates}?overview=full&geometries=geojson`,
				);
				publish(routingPoints(data), "railway");
			} catch {
				publish([], "unavailable");
				// Bounded recovery; selecting another train or hiding the route cancels it.
				scheduleRetry();
			}
		};
		const scheduleRetry = routeRetry(controller.signal, () => {
			void load();
		});
		void load();
		return () => {
			controller.abort();
		};
	}, [key, serverId, trainNumber, visible, stationData]);
	const message = !trainNumber
		? "Select a train"
		: !visible
			? "Route hidden"
			: current.status === "loading"
				? "Loading route…"
				: current.status === "unavailable"
					? "Route unavailable — check routing and timetable data"
					: "Railway route via known timetable points";
	return (
		<>
			<LayerOptions control={controls}>
				<hr />
				<label style={{ display: "flex", gap: 8, cursor: "pointer" }}>
					<input
						type="checkbox"
						checked={visible}
						onChange={(event) => setVisible(event.target.checked)}
					/>
					Show selected train route
				</label>
				<label style={{ display: "flex", gap: 8, cursor: "pointer" }}>
					<input
						type="checkbox"
						checked={followTrain}
						onChange={(event) => onFollowTrainChange(event.target.checked)}
					/>
					Follow selected train
				</label>
				{visible &&
					current.total !== undefined &&
					current.matched !== undefined &&
					current.matched < current.total && (
						<div role="status">
							{current.matched} of {current.total} timetable points located —
							route may be incomplete
						</div>
					)}
				<div role="status" style={{ marginTop: 6 }}>
					{message}
				</div>
				{visible && current.status === "unavailable" && (
					<button
						type="button"
						onClick={() => setAttempt((value) => value + 1)}
					>
						Retry route
					</button>
				)}
			</LayerOptions>
			{trainNumber && visible && current.points.length >= 2 && (
				<>
					<Polyline
						positions={current.points}
						pathOptions={{
							color: "#101217",
							opacity: 0.7,
							weight: 7,
						}}
						interactive={false}
					/>
					<Polyline
						positions={current.points}
						pathOptions={{
							color: "#ffad32",
							opacity: 0.95,
							weight: 4,
						}}
						interactive={false}
					/>
				</>
			)}
		</>
	);
};
export default SelectedTrainRoute;
