---
"@howaboua/pi-codex-conversion": major
---

Requires Pi 1.2.0 or newer. Removed the `tryStartCodexPreparedIdleKickoff`, `tryStartCodexPreparedIdlePrompt` and `updateCodexPreparedIdleKickoff` exports. Extensions should start turns through Pi's message APIs.

- Extension-triggered turns now use Pi's full preparation without synthetic user prompts, including context-window continuations and voice requests.
- Code and Notebook now wait for MCP servers named in an exec cell before capturing its tools. `ALL_TOOLS` waits for all enabled servers.
- Code and Notebook now list native deferred extension tools in `ALL_TOOLS` only while active in Pi. They remain callable by name while inactive. Callable MCP tools remain discoverable, and visibility changes leave standing tool instructions unchanged.
- Fixed concurrent exec, wait and notebook calls colliding with the active Notebook kernel. Outer calls now run sequentially; tool calls within a cell can still run in parallel.
- PCC now resumes its own continuity settings when Notes Compaction is inactive for the selected model, without bringing retired conversation back into context.
- Fixed silent shell commands blocking Code and Notebook indefinitely. Commands now yield resumable sessions while preserving output-aware waits and polling backoff; completed output remains available after the native process expires.
- Fixed Notebook cells losing queued output or attributing it to the next cell, including when execution fails.
- Fixed Remote tool results preventing an ongoing run from continuing after automatic compaction.
- Added metadata-only request fingerprints and WebSocket lifecycle events to cache diagnostic logs, including idle disconnects and client-initiated resets.
- Context-window identity and recovery guidance now survive compaction, including using history when no checkpoint is available. Guidance, tool descriptions and reminders explain persistent notes, self-contained checkpoints and how to resume for every model.
- Added **New window requests: off | pi-limits | unrestricted**, independent of the compaction method. `new_context` now requires a successful note write immediately before the request. Pi-limited requests continue in the same window when Pi has nothing to compact.
