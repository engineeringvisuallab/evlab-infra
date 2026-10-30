# EVLab Infra
**Engineering Visual Lab (EVLab) · Engineering • Innovation • Learning**
A free, open-source, browser-based tool for preliminary infrastructure planning: roads, water pipelines, bridges, culverts and watercourses in 3D. It has no server, no API keys and no build step. Version 0.8.0.

> **Engineering disclaimer:** EVLab Infra produces preliminary visualization and geometric quantities only. It is not a substitute for verified engineering design. Conceptual bridges and culverts are not construction-ready or structurally certified, and no hydraulic, structural or geotechnical analysis is performed.

## Try it on your computer
Browsers will not run ES modules from a double-clicked file. Use a tiny local server:
1. Unzip the folder.
2. Open a terminal in the folder and run `python3 -m http.server 8000`.
3. Open http://localhost:8000.

## Publish free on GitHub Pages (no terminal)
1. Sign in at github.com and create a **public** repository named `evlab-infra`.
2. Click **uploading an existing file** and drag in everything from **inside** the unzipped folder (keep the folder structure and the `.nojekyll` file). Click **Commit changes**.
3. Go to **Settings → Pages**, choose branch `main`, folder `/ (root)`, and **Save**.
4. After 1–2 minutes your site is at `https://<your-username>.github.io/evlab-infra/`. Press **Ctrl+F5** after each update.

All file paths are relative, so the app works from a subdirectory such as `/evlab-infra/`. Three.js 0.160.0 is included in `vendor/`, so the app works offline and needs no CDN.

## How to use it
Toolbar: **Select** (click, drag to move) · **Draw road / pipe / watercourse** (click points, Enter or double-click to finish, Esc to cancel) · **Add block / bridge / culvert** · **Measure** · **Crossings** · **Validate** · **Import / Export**. Click an object to edit it in the Properties panel. Click empty space to edit project settings. Use **Explorer / Properties / Status bar / Toolbar** buttons (or **Full view**, key **F**) to show or hide panels; the choice is remembered. **Save** downloads a `.evlab.json` file. Autosave keeps a copy in this browser only; it is **not a cloud backup**.

## Features
**Implemented**
- 3D viewport: orbit/pan/zoom, Z-up, grid, axes, lighting and shadows, perspective/orthographic, fit and reset, layer visibility
- Select, move, edit with validation, delete, grid snap, undo/redo, JSON save/open, autosave with warning
- Roads: control points (drag gold handles in 3D or use the table), 3D surface, edges, centerline, chainage markers, profile view
- Water network: junction/valve/pump/reservoir nodes, pipes with length from coordinates, attribute warnings
- Conceptual bridges, culverts and watercourses; crossing inventory with entered clearance requirements, assumptions and checklist
- 3D distance measurement; quantity report (CSV); printable HTML report; inventory CSV export/import; GeoJSON export/import; DXF (plan) and STL export
- Validation panel (missing/inconsistent data, orphan nodes, duplicate asset IDs, zero-length segments, steep-grade heuristic)
- Show/hide panels with remembered layout
- Optional geographic origin with cursor lon/lat readout

**Partial**
- GeoJSON/CSV import cover Point and LineString and a few attributes only. Roads are straight segments (no curves, superelevation or design standards).

**Planned / not implemented**
- Terrain models, aerial imagery, 3D Tiles, online map services (see `docs/GIS.md`), DWG, configurable units (feet), rotate handles in the viewport, hydraulic analysis

## Known limitations
- Roads are preliminary geometry with simple edge offsets. Chainage is measured along the plan view. Default road width/thickness, pipe diameter and bridge/culvert sizes are placeholders to edit.
- Pipes are geometry only. Crossings are plan-view intersections with entered levels: potential interactions, never confirmed clashes.
- Geographic mode is a tangent-plane approximation for small areas. It is not a projected CRS and not survey-grade. Do not use map screenshots as terrain.
- DXF is plan-view ASCII (R12 style) with Z = 0. DWG is not supported. STL is unitless, written in metres, Z up.
- Typing in the control-point table redraws the panel, so Tab may lose focus. Browser storage can be cleared by the browser or by you.

## Testing
- `node tests/unit-test.mjs` runs logic tests (no install needed).
- `python3 tests/e2e-smoke.py` runs a real-browser test (needs Python and Playwright). It serves the app from a subdirectory and fails on any console error.
- Manual checklist: `tests/README.md`.

## Licenses
EVLab Infra is MIT licensed (`LICENSE`). Three.js is MIT (`vendor/three/LICENSE`). No external services or API keys are used. See `docs/LICENSES.md`.
