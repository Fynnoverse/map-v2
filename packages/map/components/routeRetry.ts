/** Schedule at most three retries; cancellation prevents requests after a train change. */
export function routeRetry(signal: AbortSignal, run: () => void) {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let attempt = 0;
	const delays = [5000, 15000, 30000];
	signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
	return () => {
		if (signal.aborted || timer !== undefined || attempt >= delays.length)
			return;
		timer = setTimeout(() => {
			timer = undefined;
			if (!signal.aborted) run();
		}, delays[attempt++]);
	};
}
