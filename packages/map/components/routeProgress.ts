import type { RoutePoint } from "./routeGeometry";

type SplitRoute = {
	passed: RoutePoint[];
	remaining: RoutePoint[];
	located: boolean;
};
const EARTH_RADIUS_METRES = 6371000;

/** Project live GPS onto the ordered route. Ambiguous crossings must not mark a future leg as passed. */
export function splitRouteAtTrain(
	points: RoutePoint[],
	position?: RoutePoint,
): SplitRoute {
	const unknown = { passed: [], remaining: points, located: false };
	if (
		points.length < 2 ||
		!position ||
		!position.every(Number.isFinite) ||
		Math.abs(position[0]) > 90 ||
		Math.abs(position[1]) > 180 ||
		(position[0] === 0 && position[1] === 0)
	)
		return unknown;
	const radians = Math.PI / 180;
	const yScale = EARTH_RADIUS_METRES * radians;
	const xScale = yScale * Math.cos(position[0] * radians);
	const candidates: {
		index: number;
		point: RoutePoint;
		distance: number;
		progress: number;
	}[] = [];
	let travelled = 0;
	for (let index = 0; index < points.length - 1; index++) {
		const start = points[index];
		const end = points[index + 1];
		if (!start.every(Number.isFinite) || !end.every(Number.isFinite))
			return unknown;
		const x = (start[1] - position[1]) * xScale;
		const y = (start[0] - position[0]) * yScale;
		const dx = (end[1] - start[1]) * xScale;
		const dy = (end[0] - start[0]) * yScale;
		const length = Math.hypot(dx, dy);
		if (length === 0) continue;
		const fraction = Math.max(
			0,
			Math.min(1, -(x * dx + y * dy) / (length * length)),
		);
		candidates.push({
			index,
			point: [
				start[0] + (end[0] - start[0]) * fraction,
				start[1] + (end[1] - start[1]) * fraction,
			],
			distance: Math.hypot(x + fraction * dx, y + fraction * dy),
			progress: travelled + fraction * length,
		});
		travelled += length;
	}
	const nearest = candidates.reduce<(typeof candidates)[number] | undefined>(
		(best, candidate) =>
			!best || candidate.distance < best.distance ? candidate : best,
		undefined,
	);
	// Accommodate small OSM/GPS offsets, but do not guess a route far from the train.
	if (!nearest || nearest.distance > 500) return unknown;
	if (
		candidates.some(
			(candidate) =>
				candidate.distance <= nearest.distance + 30 &&
				Math.abs(candidate.progress - nearest.progress) > 500,
		)
	)
		return unknown;
	const passed = [...points.slice(0, nearest.index + 1), nearest.point];
	const remaining = [nearest.point, ...points.slice(nearest.index + 1)];
	// Avoid zero-length polylines at departure/destination.
	return {
		passed: nearest.progress <= 0.01 ? [] : passed,
		remaining: travelled - nearest.progress <= 0.01 ? [] : remaining,
		located: true,
	};
}
