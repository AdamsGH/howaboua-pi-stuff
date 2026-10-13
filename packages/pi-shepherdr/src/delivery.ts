import { randomUUID } from "node:crypto";
import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import type {
	CodexDeveloperCustomMessage,
	CodexDeveloperMessageOptions,
	trySendCodexDeveloperCustomMessage,
} from "@howaboua/pi-codex-conversion/developer-messages";

const senders = new WeakMap<
	ExtensionAPI,
	typeof trySendCodexDeveloperCustomMessage
>();
const contexts = new WeakMap<ExtensionAPI, ExtensionContext>();
const PENDING_MESSAGE = "herdr-pending-message";
interface PendingMessage {
	sessionId: string;
	message: CodexDeveloperCustomMessage & {
		details: { herdrAdmissionId: string };
	};
	queued?: boolean;
}
const PACKAGE = "@howaboua/pi-codex-conversion";
const MODULE = `${PACKAGE}/developer-messages`;

export async function registerDeveloperDelivery(
	pi: ExtensionAPI,
): Promise<void> {
	try {
		const api = await import(
			"@howaboua/pi-codex-conversion/developer-messages"
		);
		if (typeof api.trySendCodexDeveloperCustomMessage === "function")
			senders.set(pi, api.trySendCodexDeveloperCustomMessage);
	} catch (error) {
		if (!isUnavailable(error)) throw error;
	}
	pi.on("session_start", (event, ctx) => {
		contexts.set(pi, ctx);
		const entries = ctx.sessionManager.getEntries();
		const pending = entries.flatMap((entry) =>
			entry.type === "custom" && entry.customType === PENDING_MESSAGE
				? [readPendingMessage(entry.data)]
				: [],
		);
		const queued = new Set(
			pending
				.filter((data) => data.queued)
				.map((data) => data.message.details.herdrAdmissionId),
		);
		const delivered = new Set(
			entries.flatMap((entry) =>
				entry.type === "custom_message" &&
				entry.details &&
				typeof entry.details === "object" &&
				"herdrAdmissionId" in entry.details
					? [entry.details.herdrAdmissionId]
					: [],
			),
		);
		for (const data of pending) {
			const id = data.message.details.herdrAdmissionId;
			if (
				data.sessionId !== ctx.sessionManager.getSessionId() ||
				delivered.has(id) ||
				(event.reason === "reload" && queued.has(id))
			)
				continue;
			pi.sendMessage(data.message, {
				deliverAs: "nextTurn",
				triggerTurn: false,
			});
			delivered.add(id);
			if (!data.queued)
				pi.appendEntry(PENDING_MESSAGE, { ...data, queued: true });
			ctx.ui.notify(
				"Pending coordination restored. Send a message to continue.",
				"warning",
			);
		}
	});
	pi.on("session_shutdown", () => {
		contexts.delete(pi);
	});
	pi.on("input", (event, ctx) => {
		// Input hooks run before Pi reserves a user kickoff; only real steering is promoted.
		if (
			ctx.isIdle() ||
			event.streamingBehavior === undefined ||
			event.images?.length ||
			!/^<herdr_sender [^\n]+ \/>\n/.test(event.text)
		)
			return;
		if (
			senders.get(pi)?.(
				pi,
				{
					customType: "herdr-agent-message",
					content: event.text,
					display: true,
				},
				{ deliverAs: event.streamingBehavior },
			)
		) {
			return { action: "handled" };
		}
		return;
	});
}

function readPendingMessage(value: unknown): PendingMessage {
	if (
		value &&
		typeof value === "object" &&
		"sessionId" in value &&
		typeof value.sessionId === "string" &&
		"message" in value &&
		value.message &&
		typeof value.message === "object"
	) {
		const message = value.message as PendingMessage["message"];
		if (
			typeof message.customType === "string" &&
			typeof message.content === "string" &&
			typeof message.display === "boolean" &&
			message.details &&
			typeof message.details === "object" &&
			typeof message.details.herdrAdmissionId === "string"
		)
			return {
				sessionId: value.sessionId,
				message,
				queued: "queued" in value && value.queued === true,
			};
	}
	throw new Error(
		"Stored pending coordination is invalid. Reload a valid session before continuing.",
	);
}

export function sendPolicyMessage(
	pi: ExtensionAPI,
	message: CodexDeveloperCustomMessage,
	options: CodexDeveloperMessageOptions,
): void {
	if (senders.get(pi)?.(pi, message, options)) return;
	const ctx = contexts.get(pi);
	if (options.triggerTurn && ctx) {
		const request: {
			protocol: 1;
			ctx: ExtensionContext;
			preparation?: Promise<void>;
		} = { protocol: 1, ctx };
		pi.events.emit("pi-notes-compaction:custom-turn-admission:v1", request);
		if (request.preparation) {
			const sessionId = ctx.sessionManager.getSessionId();
			const pending = {
				...message,
				details: { ...message.details, herdrAdmissionId: randomUUID() },
			};
			pi.appendEntry(PENDING_MESSAGE, { sessionId, message: pending });
			void request.preparation
				.then(() => {
					if (
						contexts.get(pi) !== ctx ||
						ctx.sessionManager.getSessionId() !== sessionId
					)
						throw new Error("Session changed before message delivery");
					pi.sendMessage(pending, options);
				})
				.catch((error) => {
					if (contexts.get(pi) !== ctx) return;
					ctx.ui.notify(
						`Coordination remains pending: ${String(error)}. Retry rollover or reload the session.`,
						"error",
					);
				});
			return;
		}
	}
	pi.sendMessage(message, options);
}

function isUnavailable(error: unknown): boolean {
	if (
		!error ||
		typeof error !== "object" ||
		!("code" in error) ||
		!("message" in error) ||
		typeof error.message !== "string"
	)
		return false;
	if (
		error.code === "ERR_MODULE_NOT_FOUND" ||
		error.code === "MODULE_NOT_FOUND"
	) {
		const missing = error.message.match(
			/Cannot find (?:package|module) ['"]([^'"]+)['"]/,
		)?.[1];
		const normalized = missing?.replaceAll("\\", "/").replace(/\.js$/, "");
		return (
			missing === PACKAGE ||
			normalized === MODULE ||
			normalized?.endsWith(`/${MODULE}`) === true
		);
	}
	return (
		(error.code === "ERR_PACKAGE_PATH_NOT_EXPORTED" ||
			error.code === "ERR_UNSUPPORTED_DIR_IMPORT") &&
		(error.message.includes(MODULE) ||
			(error.message.includes("Package subpath './developer-messages'") &&
				error.message.includes(PACKAGE)))
	);
}
