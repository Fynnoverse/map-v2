export type RoutePoint = [number, number];
export type RouteStation = {
	Name: string;
	Prefix?: string;
	id?: string;
	Latititude: number;
	Longitude: number;
};
export const normalizeStationName = (value: string) =>
	value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/ł/g, "l")
		.replace(/[^a-z0-9]/g, "");

export function timetableRoute(
	data: unknown,
	stations: RouteStation[],
): { points: RoutePoint[]; matched: number; total: number } {
	if (!Array.isArray(data)) throw new Error("Invalid timetable");
	const index = new Map<string, RoutePoint>();
	for (const station of stations) {
		if (
			!Number.isFinite(station.Latititude) ||
			!Number.isFinite(station.Longitude)
		)
			continue;
		for (const name of [station.Name, station.Prefix, station.id]) {
			if (name)
				index.set(normalizeStationName(name), [
					station.Latititude,
					station.Longitude,
				]);
		}
	}
	const result: RoutePoint[] = [];
	let matched = 0;
	const rows = data.filter(
		(
			row,
		): row is {
			nameOfPoint?: string;
			pointId?: string | number;
			indexOfPoint?: number;
		} => typeof row === "object" && row !== null,
	);
	for (const row of rows.sort(
		(a, b) => (a.indexOfPoint ?? 0) - (b.indexOfPoint ?? 0),
	)) {
		const point =
			(row.pointId != null
				? index.get(normalizeStationName(String(row.pointId)))
				: undefined) ??
			(typeof row.nameOfPoint === "string"
				? index.get(normalizeStationName(row.nameOfPoint))
				: undefined);
		if (point) matched++;
		const last = result.at(-1);
		if (point && (!last || point[0] !== last[0] || point[1] !== last[1]))
			result.push(point);
	}
	return { points: result, matched, total: data.length };
}

export function routingPoints(data: unknown): RoutePoint[] {
	const response = data as {
		code?: string;
		routes?: { geometry?: { coordinates?: unknown } }[];
	} | null;
	const coordinates = response?.routes?.[0]?.geometry?.coordinates;
	if (
		response?.code !== "Ok" ||
		!Array.isArray(coordinates) ||
		coordinates.length < 2
	) {
		throw new Error("No railway route available");
	}
	return coordinates.map((point: unknown) => {
		if (
			!Array.isArray(point) ||
			point.length !== 2 ||
			!point.every(Number.isFinite)
		) {
			throw new Error("Invalid route geometry");
		}
		return [point[1], point[0]] as RoutePoint;
	});
}

export function timetableWaypoints(
	data: unknown,
	stations: RouteStation[],
): RoutePoint[] {
	return timetableRoute(data, stations).points;
}
