---
"@howaboua/pi-ask": patch
---

Ask now accepts supervisor replies through Shepherdr's `reply` action. Update and reload Ask and Shepherdr together on controllers and workers.

- Supervisors receive questions, choices and a reply template. Valid replies complete the worker's existing wait or steer panel. Human handoffs still require the user's confirmation.
- Unknown or misnamed fields, such as `options` instead of `choices`, and malformed choices now return errors naming the invalid field and accepted shape instead of silently dropping input.
