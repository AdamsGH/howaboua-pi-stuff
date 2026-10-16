import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { codeModeHostBinaryName, HOST_RELEASE } from "./host-assets.ts";
import { installCodeModeHost, type InstallCodeModeHostOptions } from "./install-host.ts";

interface CodeModeHostBinaryRuntime {
	platform: string;
	arch: string;
	packageRoot: string;
	agentDir: string;
	customRustBinariesDir: string;
	install(options: InstallCodeModeHostOptions): Promise<void>;
}

function packageRoot(): string {
	return dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
}

function resolveRuntime(overrides: Partial<CodeModeHostBinaryRuntime> = {}): CodeModeHostBinaryRuntime {
	return {
		platform: overrides.platform ?? process.platform,
		arch: overrides.arch ?? process.arch,
		packageRoot: overrides.packageRoot ?? packageRoot(),
		agentDir: overrides.agentDir ?? getAgentDir(),
		customRustBinariesDir: overrides.customRustBinariesDir ?? "",
		install: overrides.install ?? installCodeModeHost,
	};
}

export function codeModeHostBinaryPath(overrides: Partial<CodeModeHostBinaryRuntime> = {}): string {
	const runtime = resolveRuntime(overrides);
	const name = codeModeHostBinaryName(runtime.platform);
	if (runtime.customRustBinariesDir) {
		const custom = join(runtime.customRustBinariesDir, name);
		// Like the other native helpers, this directory overrides individual filenames.
		if (existsSync(custom)) return custom;
	}
	const bundled = join(
		runtime.packageRoot,
		"code-mode",
		"bin",
		HOST_RELEASE,
		`${runtime.platform}-${runtime.arch}`,
		name,
	);
	if (existsSync(bundled)) return bundled;
	// Unversioned local builds may track a different source baseline than the release.
	// Never let one silently shadow the pinned downloaded host.
	const cached = codeModeHostCachePath(name, runtime);
	if (existsSync(cached)) return cached;
	throw new Error(
		`No code-mode host binary for ${runtime.platform}-${runtime.arch}. Reinstall the package to download the supported runtime.`,
	);
}

export async function ensureCodeModeHostBinary(signal?: AbortSignal, overrides: Partial<CodeModeHostBinaryRuntime> = {}): Promise<string> {
	const runtime = resolveRuntime(overrides);
	try {
		return codeModeHostBinaryPath(runtime);
	} catch {
		const name = codeModeHostBinaryName(runtime.platform);
		await runtime.install({
			destination: codeModeHostCachePath(name, runtime),
			platform: runtime.platform,
			arch: runtime.arch,
			...(signal ? { signal } : {}),
		});
		return codeModeHostBinaryPath(runtime);
	}
}

function codeModeHostCachePath(name: string, runtime: CodeModeHostBinaryRuntime): string {
	return join(
		runtime.agentDir,
		"cache",
		"pi-codex-conversion",
		"code-mode",
		HOST_RELEASE,
		`${runtime.platform}-${runtime.arch}`,
		name,
	);
}
