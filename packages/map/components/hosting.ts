export const EDR_API_URL = (
	process.env.NEXT_PUBLIC_EDR_API_URL ?? "https://edr.fynnovation.com"
).replace(/\/+$/, "");
export const ROUTING_URL = (
	process.env.NEXT_PUBLIC_ROUTING_URL ?? "/routing"
).replace(/\/+$/, "");
