import type { ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { getSettingsListTheme } from "@earendil-works/pi-coding-agent";
import { Container, SettingsList, Spacer, Text, type Component } from "@earendil-works/pi-tui";
import { openAICodexProviderModels } from "../../providers/openai-codex/model-catalog.ts";
import { TextSettingSubmenu } from "./config-items-shared.ts";
import { readContextWindowOverride, writeContextWindowOverride } from "./context-window-store.ts";

const format = (tokens: number) => `${tokens.toLocaleString("en-US")} tokens`;

class PickerPanel extends Container {
	list?: SettingsList;
	handleInput(data: string): void { this.list?.handleInput(data); }
}

export function contextWindowPicker(ctx: ExtensionContext, theme: Theme, close: () => void): Component {
	const catalog = openAICodexProviderModels();
	const models = ctx.modelRegistry.getAll().filter(({ provider }) => provider === "openai-codex")
		.map((model) => ctx.model?.provider === model.provider && ctx.model.id === model.id ? ctx.model : model);
	const panel = new PickerPanel();
	panel.addChild(new Text(theme.bold("Context windows (openai-codex)"), 0, 0));
	panel.addChild(new Spacer(1));
	panel.addChild(new Text(theme.fg("dim", "Proxy or renamed provider? Edit your own Pi models.json. These settings apply only to openai-codex, globally."), 0, 0));
	panel.addChild(new Spacer(1));
	const list = new SettingsList(models.map((model) => ({
		id: model.id, label: model.name, currentValue: format(model.contextWindow),
		description: model.id,
		submenu: (_value: string, back: () => void) => {
			const defaultSize = catalog.find(({ id }) => id === model.id)?.contextWindow;
			const modelPanel = new PickerPanel();
			const summary = new Text("", 0, 0);
			const updateSummary = () => {
				let saved: number | undefined;
				let readError: string | undefined;
				try { saved = readContextWindowOverride(model.id); }
				catch (error) { readError = error instanceof Error ? error.message : "Could not read models.json"; }
				summary.setText(theme.bold(model.name) + `\nEffective now: ${format(model.contextWindow)}\n` +
					(defaultSize ? `Provider default: ${format(defaultSize)}\n` : "Provider default: custom model definition\n") +
					(readError ? `${readError}\n` : saved ? `Saved override: ${format(saved)} · restart Pi to apply\n` : "No saved context-window override\n") +
					`Output limit: ${format(model.maxTokens)} (unchanged). Pi reserves space separately for compaction.\n` +
					"This is local capacity metadata, not backend entitlement. Saving does not truncate this conversation.");
			};
			updateSummary();
			const save = (tokens: number | undefined) => {
				try {
					if (ctx.modelRegistry.getError()) throw new Error("Pi reports an invalid model configuration. Fix models.json before saving.");
					writeContextWindowOverride(model.id, tokens);
					updateSummary();
					ctx.ui.notify("Context window saved to Pi models.json. Restart Pi to apply; current conversation is unchanged.", "info");
					return true;
				} catch (error) { ctx.ui.notify(error instanceof Error ? error.message : "Could not save context window", "error"); return false; }
			};
			const presets = defaultSize ? [...new Set([Math.floor(defaultSize / 2), defaultSize])].filter((size) => size > 0) : [];
			modelPanel.addChild(summary);
			modelPanel.addChild(new Spacer(1));
			modelPanel.list = new SettingsList([
				{ id: "reset", label: "Reset context-window override", currentValue: "Remove", description: "Remove only modelOverrides.contextWindow. Restores your custom model definition or provider default; all other data remain.", values: ["Remove"] },
				...presets.map((tokens) => ({ id: String(tokens), label: `Use ${format(tokens)}`, currentValue: "", description: tokens === defaultSize ? "Provider catalog default; actual backend limits may differ." : "Smaller local capacity; output limit is unchanged.", values: [""] })),
				{ id: "custom", label: "Custom token count", currentValue: "", submenu: (_current, finish) => {
					const input = new TextSettingSubmenu("Custom context window", "Positive whole tokens. Larger values do not unlock backend capacity. Restart Pi required.", String(model.contextWindow), (value) => {
						if (!/^[0-9]+$/.test(value.trim()) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) {
							ctx.ui.notify("Enter a positive whole token count.", "error"); return;
						}
						if (save(Number(value))) finish();
					}, () => finish(), theme);
					input.focused = true;
					return input;
				} },
			], 6, getSettingsListTheme(), (id) => {
				save(id === "reset" ? undefined : Number(id));
				modelPanel.list?.updateValue(id, id === "reset" ? "Remove" : "");
			}, back);
			modelPanel.addChild(modelPanel.list);
			return modelPanel;
		},
	})), 8, getSettingsListTheme(), () => {}, close);
	panel.list = list;
	panel.addChild(list);
	return panel;
}
