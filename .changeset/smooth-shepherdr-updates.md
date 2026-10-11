---
"@howaboua/pi-shepherdr": patch
"@howaboua/pi-ask": patch
---

Shepherdr now updates running agents without losing their pending results and retains supervised workers and follow-up instructions after context rollover.

- Messages and assignments now reach blocked workers.
- Extension-authored messages and reply templates now travel across local and remote agents. Pending messages remain visible until their producer closes them, and replies go directly to that extension.
- `reply` replaces the Ask-specific `answer` action. Supervisors can answer worker questions using their forwarded choices and reply template, completing the existing Ask panel. Human handoffs still require the user's confirmation. Update and reload Ask and Shepherdr together on controllers and workers.
- Spawn labels no longer have a word-count restriction.
