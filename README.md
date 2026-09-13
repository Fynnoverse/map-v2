# SimRail Map

## Overview

Welcome to the **SimRail Map** project! 🌟

## Features

- 🗺️ Interactive Map: Zoom in/out, pan, and explore different areas.
- 📍 Location Details: Information on stations and trains.
- 🛤️ Route Information: Visual representation of rail routes (track speed, signalling).
- 🔍 Search Functionality: Easily find specific trains or train conductors.

## Contributing

### How to ?

- 🍴 Fork the repository.
- 🌿 Create a new branch: git checkout -b feature-branch.
- 💾 Commit your changes: git commit -am 'Add new feature'.
- 🚀 Push to the branch: git push origin feature-branch.
- 📨 Create a new Pull Request.

### Installation

1. Clone the Repository:

```bash
git clone https://github.com/simrail/map-v2.git
cd map-v2
```

2. Install Dependencies:

```bash
pnpm install
```

3. Run the Application:

```bash
pnpm run dev
```

4. Check linting, TypeScript diagnostics, and formatting:

```bash
pnpm check
```

Use `pnpm fix` to apply safe Oxlint fixes and format supported files with Oxfmt.

### Projects

This projects is a monorepo containing two projects:

- `packages/home`: The main portal page hosted at [www.simrail.app](https://www.simrail.app) that redirects users to either EDR or the map.
- `packages/map`: The interactive map project hosted at [map.simrail.app](https://map.simrail.app).

## Docker deployment with EDR

This Dockerfile builds `packages/map` as a static export and serves it with
Nginx on port 80. Use the sibling `EDR/compose.yaml` and its
`docs/docker-map.md` guide for the complete stack. The Docker build sets the
browser API paths to `/api` and `/routing`; the shared gateway forwards these
to EDR and OSRM. Running this image alone requires an equivalent reverse proxy.

## Selected train route

Selecting a train highlights its OSRM railway route in orange. The **Show selected
train route** checkbox remembers your preference. Routing failures display a
status message and no substitute straight-line route. Failed requests retry after
5, 15 and 30 seconds; **Retry route** starts another attempt. Hiding the route or
selecting another train cancels pending requests and retries.

Incomplete station matching shows how many timetable points were located.
Even a successful route may differ from the actual SimRail path when points are
missing or the OSM network differs from the game.

`NEXT_PUBLIC_ROUTING_URL` defaults to `/routing`. The host reverse proxy must
forward this path to railway OSRM and `/api` to EDR. Routing responses must
contain OSRM JSON with `code: "Ok"` and GeoJSON coordinates.

The map and server selection page do not load AdSense or the upstream Google Tag
Manager container. Leaflet controls use React portals so selection changes do
not move DOM nodes that React still manages in another parent.

Run regression tests with Node.js 24:

```sh
node --test tests/*.test.mjs
```