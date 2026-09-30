# Tube Planner: notes for Claude

A demo PWA for mobile phlebotomists. It shows which blood tubes to draw for each home visit, and totals them for the day. All patient data is fictional. The README covers the logic and data caveats.

**Start every session by reading `TODO.md`.** It holds the current to-do list, open questions and planned work. The user moves between two Windows PCs. This folder syncs through OneDrive, and Claude's memory does not, so keep project state in `TODO.md`, not only in memory.

## Status (2026-09-29)

- Live site: https://thinkfirststudios.github.io/tube-planner/ Repo: https://github.com/thinkfirststudios/tube-planner (public).
- Pushing to `main` redeploys automatically through `.github/workflows/deploy.yml` (tests, build, Pages), in about 1 minute. **Push only when the user says to.** After a deploy, the user needs to close and reopen the app, or refresh twice, to load the new version.
- The next build (change log, undo, audit leftovers) is **planned but waiting for the user's "go"**. See TODO.md.
- Guided tour ("Take the tour") is built. Tour results go to a Google Sheet through `feedback/apps-script.gs`, only when the tester agrees and the `FEEDBACK_URL` repository variable is set. See README "Guided tour".

## Decisions already made

- Confirmed first: a saved tube list for the order's signature wins, and the estimator is only the fallback, always labeled "Estimated".
- Lab rules live in `src/data/*.json`. Tube logic in `src/lib/` is pure TypeScript with no React, and Vitest covers it.
- "Nurse confirmed" comes from the "Save these counts as nurse confirmed" checkbox when completing an estimated visit, or from "My own count" on Confirm tubes.
- The UI shows tube names ("Serum Separator (SST)"), never cap-colour words like "Gold cap". The cap colour stays in the tube drawing.
- The Today schedule uses the device's current date. There is no fixed demo date.
- Copy uses no pronouns for patients ("since the last visit", not "her last visit").
- Tablet (768px and wider): the visit list sits on the left and the patient on the right.
- Hash routing. The Pages build sets `BASE_PATH=/tube-planner/`.

## Working here (Windows)

- If Node isn't on the Bash PATH, prefix commands with `export PATH="/c/Program Files/nodejs:$PATH"`. If `node` is missing entirely on a PC, install it with `winget install OpenJS.NodeJS.LTS`, but ask first.
- In Git Bash, set `MSYS_NO_PATHCONV=1` when passing `BASE_PATH=/tube-planner/`. Otherwise Git Bash rewrites it into a Windows path.
- OneDrive can break the first test run right after `npm install` ("Cannot find native binding"). Re-run it; there's no need to reinstall.
- Commands: `npm test`, `npm run build`, `npm run preview` (includes the service worker, so it works offline), `npm run dev`.
- Visual checks: `playwright-core` with the local Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`) against `npm run preview` on port 4173.
- Git identity for this repo is set locally (Alex, alex@thinkfirststudios.com). End commit messages with the Co-Authored-By line.
- `notes/` is gitignored: private notes such as the client email draft. It syncs by OneDrive only, never GitHub.
