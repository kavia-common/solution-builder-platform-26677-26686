# Solution Builder Wizard (Offline-first)

This CRA frontend implements a 5-step wizard:

1. Input (upload)
2. Analysis (mock client-side analysis)
3. Gaps (heuristic gap detection)
4. Approvals (explicit approval gate)
5. Outputs (markdown generation + downloads + printable preview + demo dashboard)

## Offline-first persistence
All wizard state is stored in `localStorage` under the `sbp:wizard:v1:*` namespace.

## Exports
- Structured Solution Document: Markdown download
- Presentation Outline: Markdown + Text download
- Print to PDF: use browser print

No backend calls are made.
