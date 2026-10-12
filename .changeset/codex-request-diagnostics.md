---
"@howaboua/pi-codex-conversion": patch
---

Codex diagnostics now include request routing and relationship metadata, local attempt timings and backend timing metrics alongside cache and transport logs.

- Added timing logs for response, prewarm and native compaction requests, with provider-usage output throughput and explicit missing metrics.
- Fixed diagnostics activation for renamed Codex providers.
