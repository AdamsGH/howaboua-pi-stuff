import { StringEnum } from "@earendil-works/pi-ai";
import {
	defineTool,
	type ExtensionAPI,
	type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { deliver } from "./src/delivery.js";
import { githubClient, type Thread } from "./src/github.js";

interface Watch {
	thread: Thread;
	seen: Set<string>;
	controller: AbortController;
	timer?: ReturnType<typeof setTimeout>;
	state: "watching" | "paused";
	nextCheck: number;
}
const MINUTE = 60_000;
const HELP =
	"watch: {action: 'watch', thread: URL | owner/repo#123 | number}. status: {action: 'status'}. cancel: {action: 'cancel', thread: reference}, or omit thread to cancel all without GitHub access. Watches continue after notifications until cancellation, session switch, reload or shutdown. Issues check each minute; PRs first check after 7 minutes, then each minute. New issue comments, PR reviews and inline comments wake this session with metadata only. Failed checks pause the watch; watch again to retry.";

export default async function (pi: ExtensionAPI) {
	const watches = new Map<string, Watch>();
	let generation = 0;
	const clear = () => {
		generation++;
		for (const watch of watches.values()) {
			clearTimeout(watch.timer);
			watch.controller.abort();
		}
		watches.clear();
	};
	pi.on("session_start", clear);
	pi.on("session_shutdown", clear);

	function schedule(watch: Watch, ctx: ExtensionContext, delay: number) {
		watch.nextCheck = Date.now() + delay;
		watch.timer = setTimeout(async () => {
			try {
				const seen = await githubClient(
					pi,
					ctx.cwd,
					watch.controller.signal,
				).snapshot(watch.thread);
				if (watch.controller.signal.aborted) return;
				const count = [...seen].filter((id) => !watch.seen.has(id)).length;
				if (count)
					deliver(
						pi,
						`GitHub watch: ${count} new comment/review item(s) at ${watch.thread.url}. Read the FULL thread with gh ${watch.thread.kind === "pr" ? "pr" : "issue"} view ${watch.thread.number} --repo ${watch.thread.repo} --comments, not just the latest comment.${watch.thread.kind === "pr" ? ` Also read inline review threads with gh api --paginate repos/${watch.thread.repo}/pulls/${watch.thread.number}/comments.` : ""}`,
					);
				watch.seen = seen;
				schedule(watch, ctx, MINUTE);
			} catch {
				if (watch.controller.signal.aborted) return;
				watch.state = "paused";
				try {
					deliver(
						pi,
						`GitHub watch paused: ${watch.thread.url}. Checking or notification delivery failed. Check gh auth status and thread access; call github_watch watch again to resume.`,
					);
				} catch {
					/* UI remains available when turn delivery fails. */
				}
				ctx.ui.notify(
					`GitHub watch paused: ${watch.thread.url}. Check gh auth status and thread access, then watch again.`,
					"error",
				);
			}
		}, delay);
		watch.timer.unref();
	}
	const tool = defineTool({
		name: "github_watch",
		label: "GitHub watch",
		description:
			"Watch worthwhile GitHub issue/PR threads for new comments in this session, not every thread automatically. Call without arguments for help",
		parameters: Type.Object(
			{
				action: Type.Optional(
					StringEnum(["help", "watch", "status", "cancel"]),
				),
				thread: Type.Optional(Type.String()),
			},
			{ additionalProperties: false },
		),
		async execute(_id, args, signal, _update, ctx) {
			const result = (text: string) => ({
				content: [{ type: "text" as const, text }],
				details: {},
			});
			const action = args.action ?? "help";
			if (action === "help") return result(HELP);
			if (action === "status")
				return result(
					watches.size
						? [...watches.values()]
								.map(
									(w) =>
										`${w.thread.url} ${w.state}${w.state === "watching" ? `; next check ${new Date(w.nextCheck).toISOString()}` : "; watch again to resume"}`,
								)
								.join("\n")
						: "No active watches.",
				);
			if (action === "cancel" && !args.thread?.trim()) {
				clear();
				return result("All watches cancelled.");
			}
			if (!args.thread?.trim())
				throw new Error("Supply thread: a URL, owner/repo#123, or a number.");
			const epoch = generation;
			const client = githubClient(pi, ctx.cwd, signal);
			const thread = await client.resolve(args.thread);
			if (generation !== epoch)
				throw new Error(
					"Session changed. Start the watch in the current session.",
				);
			const previous = watches.get(thread.url);
			if (action === "cancel") {
				if (previous) {
					clearTimeout(previous.timer);
					previous.controller.abort();
					watches.delete(thread.url);
				}
				return result(
					`${thread.url}: ${previous ? "cancelled" : "not watched"}`,
				);
			}
			if (previous?.state === "watching")
				return result(`${thread.url}: already watching`);
			const seen = await client.snapshot(thread);
			if (generation !== epoch || signal?.aborted)
				throw new Error(
					"Watch setup interrupted. Retry in the current session.",
				);
			if (watches.get(thread.url)?.state === "watching")
				return result(`${thread.url}: already watching`);
			previous?.controller.abort();
			const watch: Watch = {
				thread,
				seen: previous?.seen ?? seen,
				controller: new AbortController(),
				state: "watching",
				nextCheck: 0,
			};
			watches.set(thread.url, watch);
			schedule(watch, ctx, thread.kind === "pr" ? 7 * MINUTE : MINUTE);
			return result(
				`${thread.url}: watching; first check ${new Date(watch.nextCheck).toISOString()}`,
			);
		},
	});
	pi.registerTool(tool);
	try {
		const { adaptToolForCodeMode, registerCodeModeExtensionTools } =
			await import("@howaboua/pi-codex-conversion/code-mode");
		const registration = registerCodeModeExtensionTools(pi, () => [
			adaptToolForCodeMode(tool, {
				usage: "await tools.github_watch() // help",
				deferLoading: true,
			}),
		]);
		pi.on("session_shutdown", () => registration.unregister());
	} catch (error) {
		if (
			!(error instanceof Error) ||
			!("code" in error) ||
			!["ERR_MODULE_NOT_FOUND", "MODULE_NOT_FOUND"].includes(
				String(error.code),
			) ||
			!error.message.includes("@howaboua/pi-codex-conversion")
		)
			throw error;
	}
}
