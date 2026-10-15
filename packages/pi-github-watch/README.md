# GitHub Watch

Opt-in GitHub issue and pull request comment watches that wake the same Pi session. Notifications contain a thread URL and comment count, never comment bodies. The agent is told to read the full thread with `gh`.

## Install

```sh
pi install npm:@howaboua/pi-github-watch
```

Requires Pi 1.2 or later and an authenticated `gh` CLI. Works with structured tools, Pi native Code mode and Codex Conversion Code mode.

## Watch a thread

Ask the agent to watch a worthwhile thread, such as an issue awaiting an answer or a PR awaiting bot reviews. Nothing is watched automatically.

The `github_watch` tool accepts a GitHub URL, `owner/repo#123`, or a bare number resolved through `gh repo view` in the current working directory. Call it without arguments for help. Its actions are `watch`, `status` and `cancel`.

Issues are checked every minute. PRs take an initial metadata snapshot immediately, wait seven minutes before the first check, then check every minute. PR watches include conversation comments, submitted reviews and inline review comments. Existing comments and edits do not trigger notifications.

Watches continue after a notification. They survive ordinary compaction but end on cancellation, session switch, reload or process shutdown. They are not restored when reopening a session. Failed checks pause the affected watch and show an error. Start the watch again after checking authentication and thread access.

Notifications arrive chronologically through the existing Codex Conversion delivery integration when available, otherwise as native Pi user messages. They queue behind an active response and start a turn when idle. No system prompt changes are used.
