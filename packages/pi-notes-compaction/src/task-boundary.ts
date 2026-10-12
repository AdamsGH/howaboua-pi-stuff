import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	type ExtensionContext,
	getAgentDir,
} from "@earendil-works/pi-coding-agent";

export const TASK_BOUNDARY_REMINDER =
	"<context_window_reminder>\nThis window is approaching the recommended token budget. If the current task is nearly finished and the next task is clearly separate, finish this task, save a checkpoint, and start a new window. Otherwise, continue here.\n</context_window_reminder>";

/** Effective provider defaults are not an opt-in. Match an explicit Pi model setting to the active model. */
export function hasExtendedContextOverride(ctx: ExtensionContext): boolean {
	const model = ctx.model;
	if (!model || model.contextWindow <= 400_000 || ctx.modelRegistry.getError())
		return false;
	let source: string;
	try {
		source = readFileSync(join(getAgentDir(), "models.json"), "utf8");
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
		throw new Error(
			"Could not read context settings. Check access to Pi models.json.",
		);
	}
	let document;
	try {
		// Pi accepts JSON comments. Preserve quoted strings while removing comments.
		document = JSON.parse(
			source
				.replace(/^\uFEFF/, "")
				.replace(/"(?:\\.|[^"\\])*"|\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g, (token) =>
					token.startsWith("/") ? " " : token,
				),
		);
	} catch {
		throw new Error(
			"Could not read context settings. Fix Pi models.json, then reload Pi.",
		);
	}
	const provider = document?.providers?.[model.provider];
	const override = provider?.modelOverrides?.[model.id]?.contextWindow;
	const definition = Array.isArray(provider?.models)
		? provider.models.find(
				(entry: { id?: string } | null) => entry?.id === model.id,
			)
		: undefined;
	const configured = override ?? definition?.contextWindow;
	return (
		typeof configured === "number" &&
		configured > 400_000 &&
		configured === model.contextWindow
	);
}
