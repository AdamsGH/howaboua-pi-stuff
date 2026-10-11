---
"@howaboua/pi-notes-compaction": patch
---

Fixed note queries and manual context rollover with Codex Conversion.

- Restored negative line ranges, default limits, result ordering, metadata and complete read and search content. Help now shows concrete call syntax, and invalid arguments are reported before execution.
- `/compact` now honours the Normal compaction setting. With it off, Notes Compaction reuses fresh saved notes or requests a checkpoint, then opens a new context window without starting a continuation turn.
