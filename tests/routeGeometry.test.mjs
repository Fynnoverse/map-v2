import assert from "node:assert/strict";
import test from "node:test";

import {
	normalizeStationName,
	timetableWaypoints,
	routingPoints,
	timetableRoute,
} from "../packages/map/components/routeGeometry.ts";

const stations = [
	{ Name: "Łazy", id: "101", Latititude: 50.5, Longitude: 19.4 },
	{ Name: "Kraków Płaszów", id: "102", Latititude: 50.03, Longitude: 19.97 },
];
test("Polish names match ASCII timetable variants", () => {
	assert.equal(normalizeStationName("Łazy"), normalizeStationName("Lazy"));
	assert.equal(
		normalizeStationName("Kraków Płaszów"),
		normalizeStationName("Krakow Plaszow"),
	);
});
test("waypoints respect timetable order, station IDs and consecutive duplicates", () => {
	const rows = [
		{ nameOfPoint: "Krakow Plaszow", indexOfPoint: 3 },
		{ nameOfPoint: "Renamed stop", pointId: 101, indexOfPoint: 0 },
		{ nameOfPoint: "Unknown point", indexOfPoint: 1 },
		{ nameOfPoint: "Lazy", indexOfPoint: 2 },
	];
	assert.deepEqual(timetableWaypoints(rows, stations), [
		[50.5, 19.4],
		[50.03, 19.97],
	]);
	assert.equal(rows[0].indexOfPoint, 3);
});
test("a return journey retains nonconsecutive repeated stations", () => {
	assert.deepEqual(
		timetableWaypoints(
			[{ pointId: 101 }, { pointId: 102 }, { pointId: 101 }],
			stations,
		),
		[
			[50.5, 19.4],
			[50.03, 19.97],
			[50.5, 19.4],
		],
	);
});
test("invalid station coordinates and unknown stops do not become route points", () => {
	assert.deepEqual(
		timetableWaypoints(
			[{ nameOfPoint: "Invalid" }, null],
			[{ Name: "Invalid", Latititude: NaN, Longitude: 19 }],
		),
		[],
	);
	assert.throws(() =>
		timetableWaypoints({ message: "Backend unavailable" }, stations),
	);
});
test("OSRM longitude/latitude converts to Leaflet latitude/longitude", () => {
	assert.deepEqual(
		routingPoints({
			code: "Ok",
			routes: [
				{
					geometry: {
						coordinates: [
							[19, 50],
							[20, 51],
						],
					},
				},
			],
		}),
		[
			[50, 19],
			[51, 20],
		],
	);
});
test("routing errors and invalid geometry are rejected instead of drawn as railway routes", () => {
	for (const response of [
		null,
		"<html>Login</html>",
		{ code: "NoRoute" },
		{ code: "Ok", routes: [{ geometry: { coordinates: [[19, 50]] } }] },
		{
			code: "Ok",
			routes: [
				{
					geometry: {
						coordinates: [
							[19, 50],
							[null, 51],
						],
					},
				},
			],
		},
	]) {
		assert.throws(() => routingPoints(response));
	}
});

test("coverage counts timetable entries, not deduplicated geometry points", () => {
	const route = timetableRoute(
		[
			{ pointId: 101 },
			{ pointId: 101 },
			{ pointId: 102 },
			{ nameOfPoint: "Missing" },
		],
		stations,
	);
	assert.equal(route.matched, 3);
	assert.equal(route.total, 4);
	assert.equal(route.points.length, 2);
});
