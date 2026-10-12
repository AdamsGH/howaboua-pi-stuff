---
"@howaboua/pi-codex-conversion": patch
---

We've been informed that Astra and Sol currently retain their prompt caches for around an hour. If you use notes-managed idle rollover, consider increasing it from 25 to 55 minutes. Cache retention can vary. YMMV. We'll keep monitoring. Please share your cache-retention and long-context quota observations in [the feedback thread](https://github.com/IgorWarzocha/howaboua-pi-stuff/issues/508).

We recommend the openai-codex provider, whether supplied by Pi or PCC. The newer Sign in with ChatGPT route under openai supports normal chat but has significant restrictions affecting other features. See [the compatibility findings](https://github.com/IgorWarzocha/howaboua-pi-stuff/issues/484).

OpenAI has increased GPT-6.1 Sol's default context window from 272k to 500k in Codex and Work. We recommend selecting Codex under Harness identifier header in PCC settings. This sends codex_cli_rs, and we've aligned provider requests more closely with Codex. We have not verified whether these requests receive the same long-context pricing or subscription treatment.

Added live context-window settings and configurable task-boundary reminders.

- Idle rollover now offers Off, 5, 15, 25 and 55 minutes. Existing enabled settings retain 25 minutes.
- Cache keepalive now recognises Astra, Sol, Terra and Luna across versions. Opt-in Astra/Sol/Terra request intervals offer 25 or 55 minutes per project. Luna offers 2.5 or 4.5 minute intervals within its existing global duration limit. Existing enabled settings retain their intervals. Requests use quota and do not guarantee cache retention.
- Added per-model context presets, custom sizes and reset for OpenAI Codex, with effective-size verification after reload.
- Added optional task-boundary reminders at preset or custom token counts when context capacity exceeds 272k, showing the remaining percentage.
- Added Codex routing hints and Shepherdr parent-child metadata, preserved on resume and independent of shared notes.
- Expanded opt-in diagnostics with routing, worker relationships, request timings and output throughput, including sent prewarm requests and native compaction. Fixed logging for renamed Codex providers.
- Notes help now lists required arguments. Writes accept `content` when `text` is omitted.
