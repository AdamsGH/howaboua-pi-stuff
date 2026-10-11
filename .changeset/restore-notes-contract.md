---
"@howaboua/pi-notes-compaction": patch
---

Restore PCC-compatible note queries and predictable manual context rollover.

- Restore negative line ranges, default limits, ordering, metadata and complete read/search content. Show concrete call syntax in help and identify invalid arguments before execution.
- Honour the Normal compaction setting for `/compact` with PCC. With it off, reuse fresh saved notes or request a checkpoint, then open a new window without starting a continuation turn.
