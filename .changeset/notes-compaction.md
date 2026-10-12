---
"@howaboua/pi-notes-compaction": patch
---

We've been informed that Astra and Sol currently retain their prompt caches for around an hour. If you use notes-managed idle rollover, consider increasing it from 25 to 55 minutes. Cache retention can vary. YMMV. We'll keep monitoring. Please share your cache-retention and long-context quota observations in [the feedback thread](https://github.com/IgorWarzocha/howaboua-pi-stuff/issues/508).

Added configurable task-boundary reminders and a clearer settings layout.

- Added optional reminders at preset or custom token counts when context capacity exceeds 272k, showing the remaining percentage.
- Status text and keyboard hints now wrap to fit narrow terminals.
- Notes help now lists required arguments. Writes accept `content` when `text` is omitted.
- Fixed fresh worker startup with Notes enabled.
