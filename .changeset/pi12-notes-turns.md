---
"@howaboua/pi-notes-compaction": patch
---

Requires Pi 1.2.0 or newer.

- Added per-model activation through `/notes` and an editable whitelist.
- Added **New window requests: off | pi-limits | unrestricted**. `new_context` requires a successful note write immediately beforehand.
- Shared local notes now remain readable after their owner closes or Shepherdr is removed.
- Fixed window identity and recovery guidance disappearing after compaction.
- Continuations now apply Pi's full prompt and tool preparation.
