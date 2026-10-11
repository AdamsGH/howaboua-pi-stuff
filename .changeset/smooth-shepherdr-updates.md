---
"@howaboua/pi-shepherdr": patch
---

Replaced the Ask-specific `answer` action with `reply` for extension replies. Update and reload Ask and Shepherdr together on controllers and workers.

- Assignments now update running agents without losing pending results or replacing existing waiters. Messages and assignments also reach blocked workers.
- Extension messages and reply templates now travel between local and remote agents. Replies reach the owning extension without an extra model turn, including while a worker is busy or blocked.
- Pending extension messages remain visible until their producer closes them. Blocking messages arrive with the blocked result. Nonblocking messages notify separately once.
- Context rollover now retains supervised workers and their full follow-up instructions.
- Spawn labels no longer have a word-count restriction.
