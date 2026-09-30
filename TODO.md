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

- [ ] **CBC + CMP: 1 SST or 2?** The saved entry, taken from an older Quest collection page, says 2, where the second is the "Master Serum" tube. But your Magnesium and Phosphorus orders use just 1 SST.
  - This also decides the estimate for any order with a serum test. For example, Margaret Ellison shows 2 SST only because of the master serum rule.
  - If the answer is 1, the saved entry changes and the master serum rule may be turned off.
  - **New evidence (2026-09-29):** Req 0004583 (CMP + CBC) = 1 SST + 1 Lavender. Req 0004588 lists only CMP + CBC too, but shows 2 SST (incl. "SS/1 Master Serum") + 1 Lavender, and its order screen also had CRP 4420, CK 374 and Sed rate 809. Likely: the Master Serum SST holds the extra serum tests, and the sed rate shares the CBC lavender.
  - **Waiting on:** is that order screen the order Req 0004588 was printed for? If yes: CBC + CMP → 1 SST + 1 Lavender; add 374-809-4420-6399-10231 → 2 SST + 1 Lavender (lab); drop `dedicatedTube` on 809. Evelyn Marsh has exactly that 5-test order.
  - **Next time you're at the lab computer:** for one order, photograph both the order screen (Profiles/Tests) and its printed Specimen Collection Page, with the **Req #** visible on both. Or ask Dee (text drafted 2026-09-29).
- [ ] **The "wrong time" you mentioned:** the date is fixed, but the time problem is still open. Which screen, what does it show, and what did you expect?

## 3. Say "go" on the next build (or change the suggestions)

Planned, not started:

- **Change log.** A record of every change (tube lists, order edits, completed visits, spare tubes, resets), with what changed and when. Every entry has a "who" field that shows "This device" for now, and becomes the person's name once accounts exist.
- **Undo.**
  - An "Undo" bar for about 8 seconds after anything destructive.
  - Ctrl+Z on a keyboard.
  - "Restore" in the change log for mistakes noticed later.
- **Leftovers from the audit.**
  - Replace one-off sizes with the design tokens.
  - Add an empty `aliases` list to each test.
  - Add an optional `schedule` next to each patient's order.
  - Add unit tests for the master serum and dedicated-tube rules.

Suggestions waiting for your OK:

1. Keep the change log when Reset demo data is used, and record the reset as an entry. A separate "Clear log" button would give a truly fresh start.
2. Log the completed visit only, not each tube tapped as drawn.
3. Build the audit leftovers in the same round as the log and undo, so there's one round of testing.

Audit question: put `schedule` on the patient next to `orderedCodes` (my suggestion), or restructure into a separate `order` object? And add one example schedule to the demo data, such as P002's PT/INR weekly on Mondays, or none?

## 4. Client

- [ ] Send the client the rundown email. There's a draft in `notes/client-email-draft.md`, which is on this computer only and not on GitHub.

## 5. Guided tour with tester feedback (built 2026-09-29, not pushed yet)

"Take the tour" on the Today screen: 7 short steps, then a quick survey. For testers who agree, each tour adds one row to a Google Sheet. The details are in the README under "Guided tour".

- [ ] Say **push** to put it live. Until the next step is done, the tour works but collects nothing.
- [ ] Set up the results sheet: create the Google Sheet, paste in `feedback/apps-script.gs`, deploy it as a web app, and add the URL as the `FEEDBACK_URL` repository variable on GitHub. The steps are in the README.
- [ ] Take the tour on your phone once it's live, and check that your row shows up in the sheet.
- [ ] Decide who to send it to, and write a short message inviting them.
