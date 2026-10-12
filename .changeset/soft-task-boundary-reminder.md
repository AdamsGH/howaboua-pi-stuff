---
"@howaboua/pi-codex-conversion": patch
"@howaboua/pi-notes-compaction": patch
---

Added independently configurable task-boundary reminders in PCC and Notes: off, 250k, 300k, 400k, 450k or custom used-token thresholds in JSON. Reminders apply only when active context capacity exceeds 272k, show the remaining context percentage and suggest finishing the current task before rolling over to the next task in a larger goal. They do not force rollover or change normal capacity reminders.
