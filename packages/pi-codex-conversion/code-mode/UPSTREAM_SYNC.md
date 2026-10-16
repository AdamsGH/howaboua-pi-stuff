# Code mode source boundary

Normal installs download OpenAI's official `rust-v0.163.0` standalone host, with platform asset SHA256 pins in `src/tools/code-mode/host-assets.ts`. Its stdio protocol is used directly; no local build or backport is injected into that artifact. Cached and bundled hosts are release-qualified, so an older cache or unversioned maintainer build cannot shadow this release.

`vendor/code-mode-src/` tracks OpenAI Codex `rust-v0.145.0` at commit `25af12f7e61572b0bc18ddb1008be543b91519b0`.

Synced upstream source:

- `codex-rs/code-mode-host/src`
- `codex-rs/code-mode-protocol/src`
- `codex-rs/code-mode/src`
- `codex-rs/protocol/src/tool_name.rs`
- upstream `LICENSE` and `NOTICE`

Upstream test modules are omitted. Pi-owned TypeScript, TOML discovery, command execution, package manifests, installer scripts, and minimal Cargo packaging stay outside upstream source trees. Keep conversion-specific activation and nested tool adapters in `src/adapter/`.

Focused runtime backports (the overall source pin remains `rust-v0.145.0`):

- `c2617273706f142ea1cc7196a2d423893b0767e4` (#52685): preserve V8 cancellation during JSON conversion and error throwing.
- `165299214855c2e48facf9bb3bc3c0fc277ee639` (#52748): make `exit()` terminate the entire cell successfully, guard callbacks after reentrant exit, and capture stored writes after exception formatting.

These changes come from upstream `codex-rs/code-mode-runtime/src/runtime/`, mapped onto the older `crates/code-mode/src/runtime/` layout without upstream's unrelated shared-value or timer implementation changes. Upstream regression tests are not vendored.

`bun run build:code-mode-host` builds this separate maintainer source baseline into `code-mode/bin/<platform>-<arch>/`. To run it, set the existing `tools.customRustBinariesDir` to that directory, then `/reload`. Overrides remain filename-based: a directory containing only other helpers does not override Code Mode. A selected host that fails to start never falls back to the downloaded host. Otherwise, the official release remains authoritative.

The Pi bridge requires the standalone stdio host and never falls back to in-process V8. Unqualified `exec` waits 30 seconds initially; explicit pragmas, custom-tool overrides, and adaptive `wait` backoff remain authoritative. Upstream audio output is neither advertised nor accepted because Pi tool results support text and images.
