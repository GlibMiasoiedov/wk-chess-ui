---
description: Build, Deploy to Staging (FTP), and Sync to GitHub
---

This workflow ensures code is built for production, uploaded to the WordPress server, and committed to the GitHub repository.

1. **Build the Project**
   Run the Vite build command to generate new assets in `dist`.
   ```powershell
   cd ui
   npm run build
   ```

// turbo
2. **Deploy to Staging (FTP)**
   Upload the built assets (`.js`, `.css`, `.svg`) and the manifest to the server using `curl`.
   *Note: This overwrites files on the remote server.*
   ```powershell
   cd ..
   # IMPORTANT: Update filenames to match what is in dist/assets!
   # Example:
   # curl --ftp-create-dirs -T dist/assets/wk-ui.DM9UZI77.js ftp://45.84.204.95/wp-content/plugins/wk-chess-ui/dist/assets/wk-ui.DM9UZI77.js --user u436888800.whiteknight.academy:Warszawa2026!
   # curl --ftp-create-dirs -T dist/assets/wk-ui.B2ETU7Ox.css ftp://45.84.204.95/wp-content/plugins/wk-chess-ui/dist/assets/wk-ui.B2ETU7Ox.css --user u436888800.whiteknight.academy:Warszawa2026!
   # curl --ftp-create-dirs -T dist/.vite/manifest.json ftp://45.84.204.95/wp-content/plugins/wk-chess-ui/dist/.vite/ --user u436888800.whiteknight.academy:Warszawa2026!
   ```

3. **Sync to GitHub**
   Commit all changes and push to the remote repository.
   ```powershell
   git add .
   git commit -m "Update: Applied react-chessboard integration fixes"
   git push origin main
   ```
