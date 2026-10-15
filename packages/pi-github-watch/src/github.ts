import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export interface Thread {
	repo: string;
	number: number;
	kind: "issue" | "pr";
	url: string;
}

export function githubClient(
	pi: ExtensionAPI,
	cwd: string,
	signal?: AbortSignal,
) {
	const gh = async (args: string[]) => {
		const result = await pi.exec("gh", args, {
			cwd,
			...(signal ? { signal } : {}),
			timeout: 30_000,
		});
		if (result.code !== 0)
			throw new Error(
				"GitHub request failed. Check gh auth status and thread access, then watch again.",
			);
		return result.stdout.trim();
	};
	return {
		async resolve(input: string): Promise<Thread> {
			const value = input.trim();
			const url =
				/^https:\/\/github\.com\/([^/]+\/[^/]+)\/(issues|pull)\/(\d+)(?:[/?#].*)?$/.exec(
					value,
				);
			const qualified = /^([\w.-]+\/[\w.-]+)#(\d+)$/.exec(value);
			const numberText =
				url?.[3] ??
				qualified?.[2] ??
				(/^#?\d+$/.test(value) ? value.replace(/^#/, "") : undefined);
			if (!numberText)
				throw new Error(
					"Use a GitHub thread URL, owner/repo#123, or a number against this repository's GitHub origin.",
				);
			const number = Number(numberText);
			if (!Number.isSafeInteger(number) || number < 1)
				throw new Error("Thread number must be a positive safe integer.");
			const repo =
				url?.[1] ??
				qualified?.[1] ??
				(await gh([
					"repo",
					"view",
					"--json",
					"nameWithOwner",
					"--jq",
					".nameWithOwner",
				]));
			if (!/^[\w.-]+\/[\w.-]+$/.test(repo))
				throw new Error(
					"No GitHub origin found. Supply owner/repo#123 instead.",
				);
			const kindText = await gh([
				"api",
				`repos/${repo}/issues/${number}`,
				"--jq",
				'if has("pull_request") then "pr" else "issue" end',
			]);
			if (kindText !== "pr" && kindText !== "issue")
				throw new Error(
					"GitHub returned an invalid thread type. Retry the watch.",
				);
			return {
				repo,
				number,
				kind: kindText,
				url: `https://github.com/${repo}/${kindText === "pr" ? "pull" : "issues"}/${number}`,
			};
		},
		async snapshot(thread: Thread): Promise<Set<string>> {
			const base = `repos/${thread.repo}`;
			const endpoints = [`${base}/issues/${thread.number}/comments`];
			if (thread.kind === "pr")
				endpoints.push(
					`${base}/pulls/${thread.number}/reviews`,
					`${base}/pulls/${thread.number}/comments`,
				);
			const ids = new Set<string>();
			for (const endpoint of endpoints) {
				const output = await gh([
					"api",
					`${endpoint}?per_page=100`,
					"--paginate",
					"--jq",
					'.[] | select(.state != "PENDING") | .id',
				]);
				for (const id of output.split(/\s+/).filter(Boolean)) {
					if (!/^\d+$/.test(id))
						throw new Error(
							"GitHub returned invalid comment metadata. Retry the watch.",
						);
					ids.add(`${endpoint}:${id}`);
				}
			}
			return ids;
		},
	};
}
