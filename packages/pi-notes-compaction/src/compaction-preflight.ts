import {
	buildSessionProjection,
	estimateTokens,
	findCutPoint,
	type SessionEntry,
} from "@earendil-works/pi-coding-agent";

export const NOTHING_TO_COMPACT =
	"No older history can be compacted while retaining the recent context. The current window and notes remain. Continue working. Retry new_context after more history accumulates.";

export function mayCompactHistory(
	entries: SessionEntry[],
	keepRecentTokens: number,
): boolean {
	const projection = buildSessionProjection(entries);
	const projected = projection.entries.flatMap((entry) =>
		entry.messages
			.filter(
				(message) =>
					message.role !== "system" && message.role !== "compactionSummary",
			)
			.map((message) => ({
				...entry.sourceEntry,
				type: "message" as const,
				message,
			})),
	);
	if (
		findCutPoint(projected, 0, projected.length, keepRecentTokens)
			.firstKeptEntryIndex > 0
	)
		return true;
	// Native recovery can move the kept boundary beyond an omitted attempt.
	// Let native preparation decide that over-budget case.
	return (
		projected.length > 0 &&
		projected.reduce((sum, entry) => sum + estimateTokens(entry.message), 0) >=
			keepRecentTokens &&
		projection.entries.some(
			(entry) =>
				entry.sourceEntry.type === "message" &&
				entry.sourceEntry.message.role === "assistant" &&
				entry.messages.length === 0,
		)
	);
}
