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

Selecting a train highlights its route in orange. The **Show selected train
route** checkbox on the map remembers your preference. A solid line uses railway
routing geometry through known timetable points. If routing fails, a dashed line
connects the known timetable points directly; it is explicitly approximate and
can omit stops without matching coordinates. It does not represent the exact
track or the actual signal/dispatcher path. The status panel offers **Retry route**
when routing or timetable data is unavailable.

The timetable endpoint must return an EDR timetable array. The routing endpoint
configured by `NEXT_PUBLIC_ROUTING_URL` must return OSRM JSON with `code: "Ok"`
and GeoJSON geometry. With the Dockerfile's `/routing` setting, configure that
path in your reverse proxy to reach a working railway OSRM service. A 404 page
or an HTML response will activate the approximate display. Public URL settings
are embedded during the frontend build.

Route data regression tests (Node.js 24):

```sh
node --test tests/routeGeometry.test.mjs
```
