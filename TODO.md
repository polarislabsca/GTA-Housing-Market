# TODO / Backlog

Items noted for later — not yet implemented.

## Feedback button (Tally) — needs a form ID

A floating "Feedback" button is already wired up (`.feedback-fab` in bottom-right, see
`app/page.tsx` and `app/globals.css`) and opens a Tally popup via `Tally.openPopup(...)`.
It's inert until a real form ID is set.

**To activate:**
1. In your Tally account, create a new form for this site (separate from the Tea Master
   app's form) — e.g. a couple of fields like "Your feedback" and optional "Email".
2. Copy the Form ID from the form's URL: `tally.so/r/[FORM_ID]`.
3. In `app/page.tsx`, replace `const TALLY_FORM_ID = "REPLACE_WITH_TALLY_FORM_ID";` with the
   real ID.
4. Rebuild and deploy. The button will start opening the real form.

## Simplified Chinese language toggle

- Add a language switch (English / 简体中文) so the dashboard can be viewed in Simplified Chinese.
- Scope to figure out when picked up: which strings need translation (headline, KPI labels,
  automatic analysis copy, chart labels, table headers, footer) vs. what can stay as-is
  (numbers, dates, city/property-type names from the data source).
- Likely approach: a small strings/dictionary object keyed by language, a `lang` piece of
  state (persisted like the theme toggle, and synced to the URL like the other filters), and
  a toggle button in the header next to the dark-mode switch.
- Requested by Leo on 2026-08-03; explicitly deferred — do not implement until asked.
