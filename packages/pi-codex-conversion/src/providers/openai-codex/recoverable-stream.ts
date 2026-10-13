import type { AssistantMessage, AssistantMessageEvent } from "@earendil-works/pi-ai";
import { AssistantMessageEventStream } from "@earendil-works/pi-ai/utils/event-stream";

function withoutToolCalls(message: AssistantMessage): AssistantMessage {
	return { ...message, content: message.content.filter(block => block.type !== "toolCall") };
}

// Pi retains tool panes by call ID and has no event to withdraw a failed draft.
// Publish calls only when the whole response succeeds; retries retain no event queue.
export class RecoverableCodexStream extends AssistantMessageEventStream {
	override push(event: AssistantMessageEvent): void {
		if (this.done) return;
		switch (event.type) {
			case "toolcall_start":
			case "toolcall_delta":
			case "toolcall_end":
				return;
			case "done":
				for (const [contentIndex, toolCall] of event.message.content.entries()) {
					if (toolCall.type !== "toolCall") continue;
					const partial = event.message;
					super.push({ type: "toolcall_start", contentIndex, partial });
					super.push({ type: "toolcall_delta", contentIndex, delta: JSON.stringify(toolCall.arguments), partial });
					super.push({ type: "toolcall_end", contentIndex, toolCall, partial });
				}
				super.push(event);
				return;
			case "error":
				super.push({ ...event, error: withoutToolCalls(event.error) });
				return;
			case "start":
				super.push({ ...event, partial: withoutToolCalls(event.partial) });
				return;
			default: {
				// Copy the content array even before the first call: the parser mutates
				// it in place, so queued text events must not expose later tool drafts.
				const contentIndex = event.partial.content.slice(0, event.contentIndex)
					.filter(block => block.type !== "toolCall").length;
				super.push({ ...event, contentIndex, partial: withoutToolCalls(event.partial) });
			}
		}
	}
}
