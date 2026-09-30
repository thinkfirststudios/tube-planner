# Tube Planner (demo)

A mobile-first web app for mobile phlebotomists and home health nurses. Given the tests on a patient's lab order, it shows which tubes to bring and fill, in order of draw, and totals tubes across the day so the nurse can pack before leaving.

**Demo only. All patient data is fictional. Not for clinical use.**

## Run it

```bash
npm install
npm run dev        # development server
npm test           # unit tests (Vitest)
npm run build      # type-check and production build
npm run preview    # serve the production build, including the service worker
```

Offline support and installing to the home screen only work in the production build (`npm run build && npm run preview`). The development server doesn't register the service worker.

To try it on a phone, run `npm run preview` and open the network address it prints, from a device on the same Wi-Fi network. Browsers only allow installing a PWA over HTTPS or from localhost, so on a real phone you'll need to deploy it to an HTTPS host (any static host works) to install it.

## How tube lookup works

The lab's own system already calculates tubes. It prints them on the Specimen Collection Page. So the app is **confirmed first**:

1. Each order is reduced to a **signature**: its unique test codes, sorted ascending and joined by `-`. CMP + CBC is `6399-10231`.
2. If a confirmed tube list exists for that signature, it's the answer, marked **Lab confirmed** or **Nurse confirmed**. The estimator never runs.
3. Otherwise the app **estimates** from the rules in `src/data/specimen-key.json`, and the result is always marked **Estimated**:
   - Unknown test codes produce a warning and are left out. The app never guesses a tube for them.
   - Tests are grouped by specimen type. Tubes per type = `ceil(regular tests / maxTestsPerTube)`, plus one per `dedicatedTube` test.
   - With `masterSerumTube` on, any order with a serum test gets one extra SST.
   - Tubes are sorted by `drawOrder`.

Saving with **Confirm tubes** on a visit records the lab's count for that signature, so every later order with the same tests resolves to it right away. Tube count depends on the tests, not the patient, so this reuse is safe.

The logic lives in `src/lib/` and has no React in it, so it can be tested on its own. Every lab rule lives in `src/data/`, so corrections never need a code change. To add a tube type, add an entry to `codes` in `specimen-key.json`.

## Data caveats

- `src/data/tests.json` was transcribed from a Quest requisition photo. **Verify it against the lab's test directory before real use.**
- `src/data/specimen-key.json` holds **placeholder** values (tests per tube, draw order, master serum rule). The app shows an "Unverified" flag while `verified` is `false`. Set it to `true` only after checking every value against the lab's specimen key.
- `dedicatedTube` on test 809 (Sed rate) is a placeholder.
- The key's `color` hex values are for reference only. The UI draws caps from the design tokens in `src/index.css`, using each type's `cap` field.
- Open questions the estimator leaves room for:
  - Whether nurses usually have the lab's collection page before a draw, or only for electronically submitted orders.
  - Whether minimum volumes ever force an extra tube beyond these rules.

## Where data is stored

- Seed data is bundled from `src/data/*.json` and never changed at runtime.
- Everything the nurse does is saved in the browser's `localStorage` on the device, on top of the seed data. That covers:
  - confirmed tube lists
  - deleted confirmed lists
  - order edits
  - visit progress
  - completed draws
  - spare-tube settings
- Nothing leaves the device, except tour results from people who agree to share them (see below). There is no backend of its own, no auth and no analytics.
- **Patients → Reset demo data** clears it.

## Guided tour

**Take the tour** on the Today screen walks through the app in 7 short steps: open a visit, check off a tube, edit an order, and open the Pack list. A panel above the bottom menu shows each step and outlines what to tap. Task steps finish on their own once the person has done them, and every step can be skipped. **End tour** stops early.

- The tour runs on fresh demo data. The person's own data is saved when it starts and put back when it ends, even after a reload mid-tour.
- Steps live in `src/lib/tour.ts`. A step highlights elements by their `data-tour` attribute.

### Tour results

When a results URL is configured, the tour first asks "Help improve this app?". Nothing is sent unless the person says yes. For people who agree, each tour sends **one row** to a Google Sheet:

- when it started, whether it was finished, and the step where the person stopped
- each step's outcome and time, e.g. `done 12s` or `skipped 40s`
- the end survey: ease (1–5), what was confusing, whether they'd use it, and an optional name or role
- phone or tablet, and the app version

It never sends patient data, and the demo patients are fictional anyway. If the phone is offline, results wait on the device and send on the next launch or reconnect.

Without a results URL, the tour still works and collects nothing.

**Set up the results sheet (one time):**

1. Create a Google Sheet, for example "Tube Planner tour results".
2. In the sheet, open **Extensions → Apps Script**. Replace the code with `feedback/apps-script.gs`, then save.
3. **Deploy → New deployment**. Type: **Web app**. Execute as: **Me**. Who has access: **Anyone**. Approve the permissions and copy the web app URL, which ends in `/exec`.
4. On GitHub, open the repo's **Settings → Secrets and variables → Actions → Variables**. Add a repository variable named `FEEDBACK_URL` with that URL.
5. Push to `main`, or re-run the deploy workflow. The next build includes the URL.

For a local build, put `VITE_FEEDBACK_URL=<url>` in `.env.local`.

The URL ends up in the public app, so anyone could send rows to the sheet. The script only accepts rows with a `session` field, caps text length and blocks spreadsheet formulas. That's enough for a demo, but a production version would need a real backend with authentication.

## Production requirements (HIPAA)

This demo stores only fictional data, on the device, without protection. **A production version holding real patient data needs:**

- **HIPAA-compliant hosting and storage**, with a Business Associate Agreement (BAA) from every vendor that touches patient data. Data must be encrypted in transit and at rest, including anything cached on the device for offline use.
- **Access control**: individual user accounts, strong authentication, role-based permissions, automatic session timeout, and the ability to remotely revoke a lost device.
- **Audit logging**: a tamper-evident record of who viewed or changed which patient's data, and when.
- A review of offline storage. Unencrypted `localStorage` is not acceptable for protected health information (PHI).
- Verified lab data: a test directory and specimen key checked against the lab's own documents, with `verified` set only after that check.

## Project layout

```
src/
  data/        seed JSON: tests, specimen key, confirmed orders, patients (all lab rules live here)
  lib/         pure logic: signature, estimate, resolveTubes, packList, draw history, storage, tour, feedback
  components/  Tube illustration, TubeCard, TubeRow, ConfidencePill, bars, banner, Tour (panel, start and survey sheets)
  screens/     Today, Pack list, Patient visit, Confirm tubes, Edit order, Saved orders, Patients, Test library
  sw.ts        service worker (precaches the whole app for offline use)
feedback/      Google Apps Script that writes tour results to a Google Sheet
tests/         Vitest unit tests
scripts/       make-icons.mjs regenerates the PWA icons (npm run icons)
```
