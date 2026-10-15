---
"@howaboua/pi-codex-conversion": major
---

Requires Pi 1.3.0 or newer. Removed `tryStartCodexPreparedIdleKickoff`, `tryStartCodexPreparedIdlePrompt` and `updateCodexPreparedIdleKickoff`. Extension authors must use Pi's message APIs instead.

- Extension-triggered turns now apply Pi's full prompt and tool preparation.
- Added **New window requests: off | pi-limits | unrestricted**. `new_context` requires a successful note write immediately beforehand.
- Fixed window identity and recovery guidance disappearing after compaction.
- PCC now restores its continuity settings when Notes is inactive for the selected model.
- Code and Notebook now wait for referenced MCP tools to load.
- `ALL_TOOLS` now respects native deferred-tool activation without hiding callable MCP tools.
- Fixed concurrent `exec`, `wait` and `notebook` calls colliding.
- Fixed quiet shell commands hanging instead of returning a resumable session.
- Fixed Notebook output being lost or assigned to the wrong cell.
- Fixed Remote tool results blocking continuation after automatic compaction.
- Malformed tool arguments now fail validation before execution.
- Interrupted responses no longer retain unfinished tool calls.
- Switching models no longer turns earlier reasoning into answer text.
- Added request fingerprints and WebSocket lifecycle events to opt-in diagnostics.
