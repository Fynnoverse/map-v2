import assert from "node:assert/strict";
import test from "node:test";

import { routeRetry } from "../packages/map/components/routeRetry.ts";

test("retries use backoff and stop after three attempts", (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });
	const controller = new AbortController();
	let calls = 0;
	const schedule = routeRetry(controller.signal, () => {
		calls++;
		schedule();
	});
	schedule();
	schedule();
	t.mock.timers.tick(4999);
	assert.equal(calls, 0);
	t.mock.timers.tick(1);
	assert.equal(calls, 1);
	t.mock.timers.tick(15000);
	assert.equal(calls, 2);
	t.mock.timers.tick(30000);
	assert.equal(calls, 3);
	t.mock.timers.tick(60000);
	assert.equal(calls, 3);
});
test("changing train or hiding route cancels scheduled retries", (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });
	const controller = new AbortController();
	let calls = 0;
	const schedule = routeRetry(controller.signal, () => calls++);
	schedule();
	controller.abort();
	schedule();
	t.mock.timers.tick(60000);
	assert.equal(calls, 0);
});
