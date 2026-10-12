---
"@howaboua/pi-codex-conversion": patch
---

Added live context-window settings and configurable task-boundary reminders.

- Added per-model context presets, custom sizes and reset for OpenAI Codex.
- Added optional task-boundary reminders at preset or custom token counts when context capacity exceeds 272k, showing the remaining percentage.
- Added Codex routing hints and Shepherdr parent-child metadata, preserved on resume and independent of shared notes.
- Expanded opt-in diagnostics with routing, worker relationships, request timings and output throughput, including prewarm and native compaction. Fixed logging for renamed Codex providers.
- Notes help now lists required arguments. Writes accept `content` when `text` is omitted.
