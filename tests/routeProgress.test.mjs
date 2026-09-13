import assert from "node:assert/strict";
import test from "node:test";

import { splitRouteAtTrain } from "../packages/map/components/routeProgress.ts";
const route = [
	[50, 19],
	[50, 19.01],
	[50, 19.02],
];
test("splits the route at the live position between vertices", () => {
	const split = splitRouteAtTrain(route, [50, 19.005]);
	assert.equal(split.located, true);
	assert.deepEqual(split.passed, [
		[50, 19],
		[50, 19.005],
	]);
	assert.deepEqual(split.remaining, [
		[50, 19.005],
		[50, 19.01],
		[50, 19.02],
	]);
	assert.equal(route.length, 3);
});
test("uses timetable route direction, including westbound journeys", () => {
	const split = splitRouteAtTrain([...route].reverse(), [50, 19.005]);
	assert.equal(split.passed[0][1], 19.02);
	assert.equal(split.remaining.at(-1)[1], 19);
});
test("start and destination have no zero-length passed or remaining line", () => {
	assert.equal(splitRouteAtTrain(route, route[0]).passed.length, 0);
	assert.equal(splitRouteAtTrain(route, route.at(-1)).remaining.length, 0);
});
test("updates progress as the train moves without changing the route", () => {
	assert.equal(splitRouteAtTrain(route, [50, 19.015]).passed.length, 3);
	assert.equal(splitRouteAtTrain(route, [50, 19.005]).passed.length, 2);
});
test("keeps the full route when GPS is absent, invalid, or too far away", () => {
	for (const position of [undefined, [NaN, 19], [0, 0], [51, 20]]) {
		const split = splitRouteAtTrain(route, position);
		assert.equal(split.located, false);
		assert.deepEqual(split.passed, []);
		assert.deepEqual(split.remaining, route);
	}
});
test("overlapping outbound and return paths are not guessed", () => {
	assert.equal(
		splitRouteAtTrain(
			[
				[50, 19],
				[50, 19.02],
				[50, 19],
			],
			[50, 19.01],
		).located,
		false,
	);
});
test("zero-length duplicate vertices do not break projection", () => {
	assert.equal(
		splitRouteAtTrain(
			[
				[50, 19],
				[50, 19],
				[50, 19.02],
			],
			[50, 19.01],
		).located,
		true,
	);
});
