---
"@howaboua/pi-shepherdr": patch
---

Requires Pi 1.2.0 or newer. Idle agent tasks and completion reports now start fully prepared extension turns without synthetic user prompts. Slash commands and prompt templates retain normal user-input handling.

Fixed intermittent local and cross-machine spawn failures by waiting for session startup to finish before accepting shared-context bindings or peer tasks.

Fixed false shared-context ownership errors when starting, forking or reopening sessions.
