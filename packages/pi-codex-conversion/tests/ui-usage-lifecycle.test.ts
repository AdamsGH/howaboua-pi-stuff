import test from "node:test";
import assert from "node:assert/strict";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { DEFAULT_CODEX_CONVERSION_CONFIG } from "../src/adapter/activation/config.ts";
import type { CodexExtensionRuntime } from "../src/extension/runtime.ts";
import { registerCodexUi } from "../src/extension/ui.ts";

test("usage refresh drops shutdown results before reading retired context and resumes with fresh context", async (t) => {
	const handlers = new Map<string, Array<() => void>>();
	const pi = {
		on(event: string, handler: () => void) {
			handlers.set(event, [...(handlers.get(event) ?? []), handler]);
		},
		registerShortcut() {},
		registerMessageRenderer() {},
		registerEntryRenderer() {},
	} as unknown as ExtensionAPI;
	const config = structuredClone(DEFAULT_CODEX_CONVERSION_CONFIG);
	config.executionMode = "normal";
	config.ui.statusLine = true;
	const runtime = {
		state: { config, executionMode: "normal" },
		backgroundWidget: {},
		sessions: { onSessionChange() {} },
	} as unknown as CodexExtensionRuntime;
	const ui = registerCodexUi(pi, runtime);
	const model = { api: "openai-codex-responses", provider: "openai-codex", id: "gpt-6-astra", baseUrl: "https://chatgpt.com/backend-api" };
	const token = `test.${Buffer.from(JSON.stringify({ "https://api.openai.com/auth": { chatgpt_account_id: "ui-lifecycle-test" } })).toString("base64url")}.test`;
	let renders = 0;
	const context = {
		model,
		hasUI: true,
		modelRegistry: { getApiKeyAndHeaders: async () => ({ ok: true, apiKey: token }) },
		ui: { setStatus: () => { renders += 1; }, theme: { fg: (_color: string, value: string) => value } },
	} as unknown as ExtensionContext;
	let retired = false;
	const oldContext = new Proxy(context, {
		get(target, key, receiver) {
			assert.equal(retired, false, `retired ctx.${String(key)} read`);
			return Reflect.get(target, key, receiver);
		},
	});
	const response = Promise.withResolvers<Response>();
	const requested = Promise.withResolvers<void>();
	t.mock.method(globalThis, "fetch", () => {
		requested.resolve();
		return response.promise;
	});
	const pending = ui.refreshUsageStatus(oldContext);
	await requested.promise;
	for (const handler of handlers.get("session_shutdown") ?? []) handler();
	retired = true;
	response.resolve(new Response(JSON.stringify({ rate_limit: { primary_window: { used_percent: 25, limit_window_seconds: 18_000 } } })));
	await pending;
	assert.equal(renders, 0);
	assert.equal(runtime.state.usageStatus, undefined);
	await ui.refreshUsageStatus(context);
	assert.equal(renders, 1);
	assert.deepEqual(runtime.state.usageStatus, { fiveHourUsageLeft: 75, weeklyUsageLeft: undefined });
});
