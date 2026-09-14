import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { gitFixtureEnv } from "./git-fixture-env";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CODEX_SHIM = join(REPO_ROOT, "scripts/codex-review.sh");
const GITIGNORE = readFileSync(join(REPO_ROOT, ".gitignore"), "utf8");
const BASE_PATH = "/usr/bin:/bin";

function gitCheckIgnore(path: string): boolean {
  try {
    execFileSync("git", ["check-ignore", "-q", path], {
      cwd: REPO_ROOT,
      env: gitFixtureEnv(),
    });
    return true;
  } catch (error) {
    const code = (error as { status?: number }).status;
    if (code === 1) return false;
    throw error;
  }
}

function writeFakeToolkit(root: string, version: string): void {
  mkdirSync(join(root, "scripts", "templates"), { recursive: true });
  mkdirSync(join(root, ".claude-plugin"), { recursive: true });
  writeFileSync(
    join(root, ".claude-plugin", "plugin.json"),
    `{\n  "name": "ff-dev-toolkit",\n  "version": "${version}"\n}\n`,
  );
  writeFileSync(join(root, "scripts", "agent-config.yaml"), `toolkit_version: "${version}"\n`);
  copyFileSync(CODEX_SHIM, join(root, "scripts", "templates", "codex-review.sh"));
  writeFileSync(
    join(root, "scripts", "multi-agent.sh"),
    ["#!/bin/sh", "# fixture marker: --task review explore implement", "exit 0", ""].join("\n"),
  );
  chmodSync(join(root, "scripts", "multi-agent.sh"), 0o755);
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

  it("picks plugin cache over a stale sidecar when FF_DEV_TOOLKIT_ROOT is unset", () => {
    const home = mkdtempSync(join(tmpdir(), "codex-shim-home-"));
    const shimDir = mkdtempSync(join(tmpdir(), "codex-shim-copy-"));
    const sidecarRoot = mkdtempSync(join(tmpdir(), "codex-shim-sidecar-"));
    const cacheRoot = join(home, ".codex", "plugins", "cache", "mp", "ff-dev-toolkit", "9.9.9");
    try {
      writeFakeToolkit(cacheRoot, "9.9.9");
      writeFakeToolkit(sidecarRoot, "1.0.0");
      const shimCopy = join(shimDir, "codex-review.sh");
      copyFileSync(CODEX_SHIM, shimCopy);
      chmodSync(shimCopy, 0o755);
      writeFileSync(join(shimDir, ".ff-dev-toolkit-root"), `${sidecarRoot}\n`);

      const result = spawnSync("bash", [shimCopy, "--print-toolkit-root=kv"], {
        encoding: "utf8",
        env: {
          HOME: home,
          TMPDIR: process.env.TMPDIR,
          PATH: BASE_PATH,
          CODEX_HOME: join(home, ".codex"),
          CLAUDE_CONFIG_DIR: join(home, ".claude"),
        },
      });
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toMatch(/^source=codex-cache$/m);
      expect(result.stdout).toContain(`version=9.9.9`);
      expect(result.stdout).not.toMatch(/source=sidecar/);
    } finally {
      rmSync(home, { recursive: true, force: true });
      rmSync(shimDir, { recursive: true, force: true });
      rmSync(sidecarRoot, { recursive: true, force: true });
    }
  });
});
