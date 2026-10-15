import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type {
	CodexDeveloperCustomMessage,
	CodexDeveloperMessageOptions,
} from "@howaboua/pi-codex-conversion/developer-messages";

interface DeliveryRequest {
	protocol: 1;
	content: string;
	message: CodexDeveloperCustomMessage;
	options: CodexDeveloperMessageOptions;
	outcome?:
		| { ok: true }
		| { ok: false; reason: "unavailable" | "delivery"; error: string };
}

export function deliver(pi: ExtensionAPI, content: string) {
	const request: DeliveryRequest = {
		protocol: 1,
		content,
		message: { customType: "github-watch", content, display: true },
		options: { deliverAs: "followUp", triggerTurn: true },
	};
	pi.events.emit(
		"@howaboua/pi-codex-conversion.developer-custom-message/v1",
		request,
	);
	if (request.outcome?.ok) return;
	if (request.outcome?.reason === "delivery")
		throw new Error(request.outcome.error);
	// Native user messages stay chronological and traverse before_agent_start on idle wake.
	pi.sendUserMessage(content, { deliverAs: "followUp" });
}
