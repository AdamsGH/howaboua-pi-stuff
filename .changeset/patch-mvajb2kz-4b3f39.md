---
"@howaboua/pi-codex-conversion": patch
---

For sessions saved by an older version, run `/reload` once after updating and complete a turn before restarting.

Local Code runtime builds now require `tools.customRustBinariesDir` to point to the build directory.

- Fixed integration tools disappearing after resuming Code or Notebook sessions.
- Fixed no-argument calls such as `tools.agents()` failing in Code mode.
- Fixed Code mode `exit()` allowing later callbacks and side effects to run.
- Fixed cancelled Code cells continuing during startup, waits or output conversion.
- Code mode now downloads the Codex 0.163 runtime.
- Added specific WebSocket continuation failure reasons and mismatched item types to opt-in diagnostics.
- Commands now drain late output for up to one second after exit instead of waiting indefinitely for child processes.
