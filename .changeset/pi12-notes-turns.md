---
"@howaboua/pi-notes-compaction": patch
---

Requires Pi 1.2.0 or newer. Context-window continuations now use fully prepared extension turns without synthetic user prompts. Idle extension requests preserve fresh-notes rollover.

Added **Active: All models | Whitelist** to `/notes`, with an editable provider-independent model whitelist preseeded with GPT6 model IDs. Model switches apply activation immediately.

Context-window identity and recovery guidance now survive compaction, including using history when no checkpoint is available. Guidance, tool descriptions and reminders explain persistent notes, self-contained checkpoints and how to resume for every model.

Added **New window requests: off | pi-limits | unrestricted**, independent of Normal compaction. `new_context` now requires a successful note write immediately before the request. Pi-limited requests continue in the same window when Pi has nothing to compact. Idle input also continues without rollover in that case.
