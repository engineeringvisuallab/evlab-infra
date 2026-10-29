# Tests
Automated (optional, needs Node): `node tests/unit-test.mjs` covers project, undo/redo, save/load and invalid files.
Manual browser checklist (Milestone 2):
1. Add block → appears, selected, listed in explorer.
2. Drag it → moves with 1 m snap. Toggle Snap → moves freely.
3. Edit fields; enter width -5 → red error, value reverts.
4. Undo/Redo (buttons, Ctrl+Z, Ctrl+Y) for add, move, edit, delete.
5. Save → file downloads; New; Open that file → project returns.
6. Open a random .json file → clear error, nothing changes.
7. Reload page → autosave restores. Check DevTools console for errors.
