# EVLab Infra
**Engineering Visual Lab (EVLab) · Engineering • Innovation • Learning**
A free, open-source, browser-based tool for preliminary infrastructure planning: roads, water pipelines, bridges, culverts and watercourses in 3D. It has no server, no API keys and no build step. Version 0.13.0.

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
- Terrain: import x, y, z points (CSV) as a TIN surface with elevation tint, terrain elevation under the cursor, set road elevations and node ground levels from terrain
- Roads: control points (drag gold handles, double-click to insert a point, or use the table), horizontal curves (circular arc radius at interior points), cross-section view with terrain ground line, 3D surface, edges, centerline, chainage markers, profile view
- Water network: junction/valve/pump/reservoir nodes, pipes with length from coordinates, attribute warnings
- Conceptual bridges, culverts and watercourses; crossing inventory with entered clearance requirements, assumptions and checklist
- 3D distance measurement; quantity report (CSV); printable HTML report; inventory CSV export/import; GeoJSON export/import; DXF (plan) and STL export
- Validation panel (missing/inconsistent data, orphan nodes, duplicate asset IDs, zero-length segments, steep-grade heuristic)
- LandXML 1.2 import/export (terrain TIN surfaces, line/curve alignments with profiles; see `docs/LANDXML.md`)
- Display units: metres or feet (inches for pipe diameter); data stays metric internally
- Show/hide panels (toolbar buttons, edge tabs, keys [ ] F) and drag-to-resize side panels, remembered per browser
- Optional geographic origin with cursor lon/lat readout

**Partial**
- GeoJSON/CSV import cover Point and LineString and a few attributes only. Roads are straight segments (no curves, superelevation or design standards).

**Planned / not implemented**
- Terrain from DEM rasters (GeoTIFF/ASC), breaklines, contours, cut/fill, aerial imagery, 3D Tiles, online map services (see `docs/GIS.md`), DWG, rotate handles in the viewport, hydraulic analysis

## Known limitations
- LandXML covers a subset only (no spirals, pipe networks, parcels or cross-sections). Faces of imported surfaces are rebuilt as a Delaunay TIN.
- Display units (project settings) affect the screen, reports and terrain CSV import. Inventory CSV, GeoJSON, DXF and STL are always metric. The grid cell is 1 m or 1 ft.
- Horizontal curves are simple circular arcs (no spirals, superelevation or design standards). A radius that is too large for the adjacent segments is reduced and flagged. Cross-sections use a flat cross-fall with no side slopes or earthwork volumes.
- Terrain is a TIN from up to 5000 points with linear interpolation. No breaklines, contours or cut/fill. Quality depends on your data; not survey-grade.
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
