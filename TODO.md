# To do

Last updated 2026-09-29. Live app: https://thinkfirststudios.github.io/tube-planner/

## 1. Finish the phone checklist

On your phone, close and reopen the app first so it has the latest version.

- [x] New tests: Magnesium (622), Phosphorus (718), Triglycerides (896) are in the Test library under SST.
- [x] No "gold" on the patient visit and Confirm tubes screens.
- [x] No "gold" on the **Pack list** screen either.
- [x] Margaret Ellison is back to 2 SST (the Pack list shows 2 SST per visit), so no reset needed.
- [x] **Every-other-week order:** set a patient's order (for example Robert Tanaka) to CBC, CMP, Magnesium and Phosphorus. It should show 1 SST + 1 Lavender, Nurse confirmed.
- [x] **Monthly order:** add Triglycerides to that same order. It should still show 1 SST + 1 Lavender, Nurse confirmed.
- [x] **Pack list:** totals match the demo orders (2 light blue, 12 SST, 7 lavender + 3 spares = 24). The unrecognised-code warning now names the code and says only that code isn't counted.
- [ ] Note anything odd and send a screenshot.

## 2. Questions only you can answer

- [x] **CBC + CMP: 1 SST or 2?** Settled from the two Quest collection pages (2026-10-07): CBC + CMP = 1 SST + 1 Lavender. CMP + CBC + CRP + CK + Sed rate = 2 SST (incl. "SS/1 Master Serum") + 1 Lavender, with the sed rate sharing the CBC lavender. Both saved as lab confirmed; `dedicatedTube` dropped from 809.
  - Still open: exactly when Quest adds the Master Serum tube. The estimator still adds one to any order with a serum test, which is one SST too many on small orders. Dee's test draw (section 6) should help.
- [ ] **The "wrong time" you mentioned:** the date is fixed, but the time problem is still open. Which screen, what does it show, and what did you expect?

## 3. Next build: standing orders with schedules (planned 2026-10-15, not started)

**Why:** Dee's TPN order has tests on three schedules. The app only knows what's on today's order, so Dee has to remember that the Triglyceride is monthly and that May and November add 11 more tests.

**Key constraint:** the app is a demo, so Dee can't enter the real patient. Schedules therefore live on a **standing order**: a named set of tests with no patient information, such as "TPN labs". Dee uses it in Look up. A demo patient can also be linked to one.

### What it does

- **Standing order** = a name plus groups of tests, each group with a frequency. Dee's "TPN labs" would be:
  - Every 2 weeks: CBC, CMP, Magnesium, Phosphorus
  - Monthly: Triglycerides
  - May and November: Vitamins A, B12, E, K, D2/D3, EFA panel, Chromium, Copper, Manganese, Selenium, Zinc
- **Frequencies** (enough for every order seen so far):
  - Every visit
  - Every N weeks, counted from a start date (the first draw)
  - Monthly: due at the first draw of each calendar month
  - Chosen months: due at the first draw in those months (e.g. May and November)
- **Look up gets a "Standing orders" picker.** Pick "TPN labs" and a draw date (defaults to today). The app works out which tests are due that day and shows the tubes, with a line like "Due today: every-2-week labs + monthly Triglycerides. Not due: May/November labs (next: Nov 2026)." Any test can still be added or removed for that one draw.
- **Create and edit standing orders** from Look up: name it, add tests the usual way, set each group's frequency. Saved on the device like everything else.
- **Demo patients:** a patient can be linked to a standing order, so Today and the Pack list add the due tests automatically. One fictional patient gets a TPN-style standing order in the demo data, so the client sees it working.
- **"Mark as drawn"** on a lookup records the date for that standing order, so "monthly" and "May/November" know what's already been done this month.

### How it's built

- Pure logic in `src/lib/schedule.ts`: `dueTests(standingOrder, date, history)`, with unit tests for each frequency, month boundaries, and a missed draw (e.g. no visit in early November means the first visit later in November still picks them up).
- Data: `standingOrders` in the saved app state, with a seed example. A patient gets an optional `standingOrderId`, so the existing `orderedCodes` keeps working unchanged. This answers the earlier audit question about where `schedule` lives.
- Tubes come from the existing lookup, so the confirmed lists (1 SST + 1 Lavender etc.) keep working. A due-date combination with no saved count shows as Estimated, as now.
- Check in a real browser at phone and tablet size, as with the tour and Look up.

### Questions before building

- [ ] **Ask Dee:** is "every other week" counted from a fixed start date, or from the last draw (so a late draw shifts the next one)? And is "monthly Triglyceride" simply the first draw of each month?
- [ ] **You:** include the "Mark as drawn" history in this build (my suggestion, since monthly and May/November depend on it), or leave it to the nurse to tick the extras?

### Also planned (from before, still waiting for "go")

- **Change log.** A record of every change (tube lists, order edits, completed visits, spare tubes, resets), with what changed and when. Every entry has a "who" field that shows "This device" for now, and becomes the person's name once accounts exist.
- **Undo.**
  - An "Undo" bar for about 8 seconds after anything destructive.
  - Ctrl+Z on a keyboard.
  - "Restore" in the change log for mistakes noticed later.
- **Leftovers from the audit.**
  - Replace one-off sizes with the design tokens.
  - ~~Add an `aliases` list to each test.~~ Done 2026-10-07.
  - ~~Add an optional `schedule` next to each patient's order.~~ Replaced by standing orders above.
  - Add unit tests for the master serum and dedicated-tube rules.

Suggestions waiting for your OK:

1. Keep the change log when Reset demo data is used, and record the reset as an entry. A separate "Clear log" button would give a truly fresh start.
2. Log the completed visit only, not each tube tapped as drawn.
3. Build the audit leftovers in the same round as the log and undo, so there's one round of testing.


## 4. Client

- [ ] Send the client the rundown email. There's a draft in `notes/client-email-draft.md`, which is on this computer only and not on GitHub.

## 5. Guided tour with tester feedback (built 2026-09-29, live since 2026-09-30)

"Take the tour" on the Today screen: 7 short steps, then a quick survey. For testers who agree, each tour adds one row to a Google Sheet. The details are in the README under "Guided tour".

- [x] Pushed and live. Until the results sheet is set up, the tour works but collects nothing.
- [ ] Set up the results sheet: create the Google Sheet, paste in `feedback/apps-script.gs`, deploy it as a web app, and add the URL as the `FEEDBACK_URL` repository variable on GitHub. The steps are in the README.
- [ ] Take the tour on your phone once it's live, and check that your row shows up in the sheet.
- [ ] Decide who to send it to, and write a short message inviting them.

## 6. Dee's test (2026-10-07)

Dee asked to try it with a real set of tests: CBCD, CMP, ESR, CRP, CK. Built and pushed for this:

- **Look up tubes** tab: type the tests, get each tube, count and color in order of draw. No patient needed.
- Search understands abbreviations (CBCD, ESR, CPK, Mag, TG and more). They're the `aliases` in `src/data/tests.json`.
- Dee's five tests give **2 SST + 1 Lavender, Lab confirmed**.

- [ ] Check it on your phone: Look up tab → type CBCD, CMP, ESR, CRP, CK → 2 SST + 1 Lavender.
- [ ] Reply to Dee's email with how to try it.
- [ ] Ask Dee to send the Quest collection page from that draw, to confirm the count.

## 7. Dee's November draw (2026-10-12)

The TPN order's nutrition labs (Vitamins A, B12, E, K, D2/D3, EFA panel) and trace elements (Chromium, Copper, Manganese, Selenium, Zinc) are every 6 months, in May and November. In November they're drawn with the every-other-week labs (CBC, CMP, Mag, Phos) and the monthly Triglycerides.

Added from Quest's national test directory (MASTER compendium; local labs can differ): codes 921, 927, 931, 36585, 92888, 11254, 3484, 363, 626, 5507, 945, with handling notes. New tube types: Red top, no gel (R) and Royal blue K2EDTA (RBE).

Estimate for all 16 tests: **10 tubes**. 2 red top (A, E, EFA), 3 SST (incl. master serum), 3 royal blue (Manganese on its own), 2 lavender (Vitamin K on its own). Marked Estimated.

Known gaps in the estimate:
- The chromium discard royal blue tube isn't counted; it's in the handling note.
- Tests per tube is a placeholder. Quest's real limit is serum volume, so the SST and red top counts could be one off either way.
- Not confirmed: whether one royal blue can be split across copper, zinc, selenium and chromium, or whether the EFA panel could use plasma from the Vitamin K lavender.

- [x] Pushed and live (2026-10-14).
- [ ] Reply to Dee: how to look it up, and ask for the Quest collection page from the November draw.
- [ ] When that page arrives, save it as lab confirmed (Look up → Enter the lab's count).
