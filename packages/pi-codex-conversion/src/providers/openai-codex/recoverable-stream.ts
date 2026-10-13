import { createAssistantMessageEventStream, type AssistantMessage, type AssistantMessageEvent } from "@earendil-works/pi-ai";

function withoutToolCalls(message: AssistantMessage): AssistantMessage {
	return { ...message, content: message.content.filter(block => block.type !== "toolCall") };
}

// Pi retains tool panes by call ID and has no event to withdraw a failed draft.
// Publish calls only when the whole response succeeds; retries retain no event queue.
export class RecoverableCodexStream {
	readonly output = createAssistantMessageEventStream();

	push(event: AssistantMessageEvent): void {
		switch (event.type) {
			case "toolcall_start":
			case "toolcall_delta":
			case "toolcall_end":
				return;
			case "done":
				for (const [contentIndex, toolCall] of event.message.content.entries()) {
					if (toolCall.type !== "toolCall") continue;
					const partial = event.message;
					this.output.push({ type: "toolcall_start", contentIndex, partial });
					this.output.push({ type: "toolcall_delta", contentIndex, delta: JSON.stringify(toolCall.arguments), partial });
					this.output.push({ type: "toolcall_end", contentIndex, toolCall, partial });
				}
				this.output.push(event);
				this.output.end();
				return;
			case "error":
				this.output.push({ ...event, error: withoutToolCalls(event.error) });
				this.output.end();
				return;
			case "start":
				this.output.push({ ...event, partial: withoutToolCalls(event.partial) });
				return;
			default: {
				// Copy the content array even before the first call: the parser mutates
				// it in place, so queued text events must not expose later tool drafts.
				const contentIndex = event.partial.content.slice(0, event.contentIndex)
					.filter(block => block.type !== "toolCall").length;
				this.output.push({ ...event, contentIndex, partial: withoutToolCalls(event.partial) });
			}
		}
	}
}
