# EVLab Infra (Milestone 2)
Engineering Visual Lab — Engineering • Innovation • Learning
Free, open-source, browser-based infrastructure planning tool. No build step, no API keys.

> **Disclaimer:** Preliminary visualization only. It is not a substitute for verified engineering design.

## Run locally
ES modules do not load from `file://`. From this folder run `python3 -m http.server 8000`, then open http://localhost:8000.

## Deploy to GitHub Pages
1. Create repo `evlab-infra`, push all files (keep `.nojekyll`).
2. Settings → Pages → Deploy from branch → `main` / root.
3. Open `https://<user>.github.io/evlab-infra/`. All paths are relative, so the subdirectory works.

## Status
| Implemented | Planned |
|---|---|
| M1: layout, Three.js viewport, camera modes, layers | Bridges, culverts (M4) |
| M2: select/move/edit/delete, snap, undo/redo, JSON save/open, autosave | Measurement, quantity report, CSV/GeoJSON/DXF/STL export, asset inventory (M5) |
| M3: draw roads (control points, 3D surface, edges, centerline, chainage markers, profile view, point editing) | Conflict (clash) detection, GIS, wider tests (M6) |
| M3: water nodes (junction, valve, pump, reservoir) and pipes with length from coordinates, attribute warnings | Publish (M7) |

## Known limitations
- Roads are preliminary geometry: straight segments, simple edge offsets (no curves, superelevation or design standards). Chainage is measured along the plan view.
- Pipes are geometry only. No hydraulic analysis. Default diameter (200 mm) and road width/thickness are placeholders to edit.
- Dragging control points in the viewport is not available yet; edit them in the Properties table.
- Typing in a points table re-draws the panel, so Tab may lose focus.
- Three.js 0.160.0 loads from jsDelivr CDN (pinned); first load needs internet.
- The only object type is a generic reference block for testing. It is not an engineering element.
- Autosave uses this browser only. It is not a cloud backup, so use Save.
- Only JSON project files are supported so far. Files with unsupported object types are rejected with an error, not partly loaded.
- Cursor coordinates are on the Z=0 plane only. CSS split into `main.css` + `layout.css`; `camera-controller.js` added beside `scene-manager.js`.
