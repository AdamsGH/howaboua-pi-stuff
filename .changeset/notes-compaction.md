---
"@howaboua/pi-notes-compaction": patch
---

Added configurable task-boundary reminders and a clearer settings layout.

- Added optional reminders at preset or custom token counts when context capacity exceeds 272k, showing the remaining percentage.
- Status text and keyboard hints now wrap to fit narrow terminals.
- Notes help now lists required arguments. Writes accept `content` when `text` is omitted.
- Fixed fresh worker startup with Notes enabled.
