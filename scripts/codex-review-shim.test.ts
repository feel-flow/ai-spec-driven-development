import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GITIGNORE = readFileSync(join(REPO_ROOT, ".gitignore"), "utf8");
const SHIM = readFileSync(join(REPO_ROOT, "scripts/codex-review.sh"), "utf8");

function gitCheckIgnore(path: string): boolean {
  try {
    execFileSync("git", ["check-ignore", "-q", path], { cwd: REPO_ROOT });
    return true;
  } catch (error) {
    const code = (error as { status?: number }).status;
    if (code === 1) return false;
    throw error;
  }
}

describe("codex-review.sh shim contracts (Issues #491 / #503)", () => {
  it("ignores the machine-specific sidecar and setup backups", () => {
    expect(GITIGNORE).toMatch(/scripts\/\.ff-dev-toolkit-root/);
    expect(GITIGNORE).toMatch(/scripts\/\*\.bak/);
    expect(gitCheckIgnore("scripts/.ff-dev-toolkit-root")).toBe(true);
    expect(gitCheckIgnore("scripts/codex-review.sh.bak")).toBe(true);
  });

  it("ignores leftover review output so it is not committed", () => {
    expect(GITIGNORE).toMatch(/^\.review-results\/$/m);
    expect(gitCheckIgnore(".review-results/integrated-report.md")).toBe(true);
  });

  it("resolves toolkit via plugin cache before the sidecar", () => {
    expect(SHIM).toMatch(/Codex plugin cache/);
    expect(SHIM).toMatch(/claude_cache=/);
    expect(SHIM).toMatch(/select_cache_toolkit/);
    const cacheIdx = SHIM.indexOf("select_cache_toolkit");
    const sidecarIdx = SHIM.indexOf('set_resolved_toolkit "$root" "$version" "sidecar"');
    expect(cacheIdx).toBeGreaterThan(0);
    expect(sidecarIdx).toBeGreaterThan(cacheIdx);
  });

  it("accepts --fresh so leftover .review-results/ does not block the next run", () => {
    expect(SHIM).toMatch(/--fresh/);
    expect(SHIM).toMatch(/ORCH_ARGS\+=\(--fresh\)/);
  });
});
