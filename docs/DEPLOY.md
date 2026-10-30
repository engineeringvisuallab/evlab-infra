# Publish EVLab Infra on GitHub Pages (free)
1. Create a **public** repository named `evlab-infra` on github.com.
2. **Add file → Upload files.** Drag in everything from INSIDE the unzipped folder. The upload must include `index.html`, `.nojekyll`, `css/`, `js/`, `vendor/`, `docs/`, `tests/`. Commit.
   - If `.nojekyll` does not show (hidden file on some systems), click **Add file → Create new file**, name it `.nojekyll`, leave it empty, commit.
3. **Settings → Pages → Build and deployment:** Source = *Deploy from a branch*, Branch = `main`, Folder = `/ (root)` → Save.
4. Wait 1–2 minutes. The address appears at the top of the Pages screen: `https://<username>.github.io/evlab-infra/`.
5. Open it and press **Ctrl+F5**. You should see the dark workspace, a grid and the toolbar.
## Check the live site
- Add block works, Save downloads a file, Import / Export panel opens, no red errors in the browser console (F12).
## Troubleshooting
- **404 page:** Pages not enabled yet, wrong branch/folder, or `index.html` is inside a subfolder. It must be at the repository root.
- **Blank dark page:** you opened `index.html` directly from your computer. Use the https address (or a local server).
- **Old version showing:** press Ctrl+F5, or open in a private window.
- **Link to your EVLab site:** add the address to https://engineeringvisuallab.github.io/evlab yourself. No code change is needed.
