# TODO / Backlog

Items noted for later — not yet implemented.

## Simplified Chinese language toggle

- Add a language switch (English / 简体中文) so the dashboard can be viewed in Simplified Chinese.
- Scope to figure out when picked up: which strings need translation (headline, KPI labels,
  automatic analysis copy, chart labels, table headers, footer) vs. what can stay as-is
  (numbers, dates, city/property-type names from the data source).
- Likely approach: a small strings/dictionary object keyed by language, a `lang` piece of
  state (persisted like the theme toggle, and synced to the URL like the other filters), and
  a toggle button in the header next to the dark-mode switch.
- Requested by Leo on 2026-08-03; explicitly deferred — do not implement until asked.
