# Tests
- Logic: `node tests/unit-test.mjs` (project, undo/redo, save/load, invalid files, roads, pipes, crossings, CSV, GeoJSON, DXF, report, coordinates, validation).
- Browser: `python3 tests/e2e-smoke.py` (needs Playwright). Runs from `/evlab-infra/` subdirectory and fails on console errors.
## Manual checklist (about 5 minutes)
1. Add block, drag it (1 m snap), edit width to -5 (error) then 20, Undo, Redo, Delete, Undo.
2. Draw a road, a pipe and a watercourse across it. Add a bridge near the crossing. Open Crossings and Validate.
3. Save, click New, Open the saved file. Open a random .json file: you should see a clear error.
4. Import / Export: download each file and open it (CSV in Excel, DXF in a CAD viewer, STL in a 3D viewer).
5. Measure two points. Set a geographic origin and check the lon/lat readout.
6. Reload the page: autosave should restore your work.
