import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const QUALITY_LOCAL = join(REPO_ROOT, "scripts", "quality-local.sh");
const RECORD_HELPER = join(REPO_ROOT, "scripts", "record-quality-gate.sh");
const BASE_PATH = "/usr/bin:/bin";

function gitEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && !key.startsWith("GIT_")) env[key] = value;
  }
  env.GIT_CONFIG_GLOBAL = "/dev/null";
  env.GIT_CONFIG_SYSTEM = "/dev/null";
  env.PATH = BASE_PATH;
  delete env.FF_DEV_TOOLKIT_ROOT;
  delete env.FF_GATE_RECORD_FILE;
  return env;
}

function resolveToolkit(): string | null {
  const printed = spawnSync(
    "bash",
    [join(REPO_ROOT, "scripts", "codex-review.sh"), "--print-toolkit-root"],
    { cwd: REPO_ROOT, encoding: "utf8", env: gitEnv() },
  );
  const printedRoot = printed.stdout.trim().split("\n").filter(Boolean).pop();
  const candidates = [
    process.env.FF_DEV_TOOLKIT_ROOT,
    printedRoot,
    join(homedir(), ".grok", "installed-plugins", "ff-dev-toolkit-d413ca32"),
  ];
  for (const root of candidates) {
    if (
      root &&
      existsSync(join(root, "scripts", "record-gate-head.sh")) &&
      existsSync(join(root, "scripts", "check-merge-freshness.sh"))
    ) {
      return root;
    }
  }
  return null;
}

const TOOLKIT_ROOT = resolveToolkit();

function writeFixtureToolkit(dir: string): string {
  const scripts = join(dir, "scripts");
  mkdirSync(scripts, { recursive: true });
  writeFileSync(
    join(scripts, "record-gate-head.sh"),
    [
      "#!/usr/bin/env bash",
      "set -euo pipefail",
      'STATUS=pass; EXPECT=""; GATE=""',
      'while [ $# -gt 0 ]; do',
      '  case "$1" in',
      '    --status) STATUS="$2"; shift 2 ;;',
      '    --expect-head) EXPECT="$2"; shift 2 ;;',
      '    --gate) GATE="$2"; shift 2 ;;',
      "    --mode) shift 2 ;;",
      "    *) shift ;;",
      "  esac",
      "done",
      'COMMIT="$(git rev-parse HEAD)"',
      'BRANCH="$(git rev-parse --abbrev-ref HEAD)"',
      'DIRTY=no; [ -z "$(git status --porcelain)" ] || DIRTY=yes',
      'TARGET="${FF_GATE_RECORD_FILE:-$(git rev-parse --absolute-git-dir)/ff-dev-toolkit/gate-record}"',
      'mkdir -p "$(dirname "$TARGET")"',
      "{",
      '  echo RECORD_VERSION=1',
      '  echo STATUS="$STATUS"',
      '  echo COMMIT="$COMMIT"',
      '  echo BRANCH="$BRANCH"',
      '  echo DIRTY="$DIRTY"',
      '  echo GATE="$GATE"',
      '  echo MODE=full',
      '  echo SUITES=',
      '  echo RESULT=',
      '  echo RECORDED_AT=1970-01-01T00:00:00Z',
      "} > \"$TARGET\"",
      "",
    ].join("\n"),
  );
  chmodSync(join(scripts, "record-gate-head.sh"), 0o755);
  return dir;
}

function initRepo(dir: string): string {
  const git = (...args: string[]) => {
    const r = spawnSync("git", args, { cwd: dir, encoding: "utf8", env: gitEnv() });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  };
  git("init", "-b", "develop");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  writeFileSync(join(dir, "README"), "ok\n");
  git("add", ".");
  git("commit", "-m", "init");
  const head = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: dir,
    encoding: "utf8",
    env: gitEnv(),
  });
  if (head.status !== 0) throw new Error(head.stderr);
  return head.stdout.trim();
}

function recordMap(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0) out[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return out;
}

describe("quality:local gate record (Issue #515)", () => {
  it("package.json は scripts/quality-local.sh を呼ぶ", () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as {
      scripts?: { "quality:local"?: string };
    };
    expect(pkg.scripts?.["quality:local"]).toBe("bash scripts/quality-local.sh");
  });

  it("clean な木で pass を書く", () => {
    const dir = mkdtempSync(join(tmpdir(), "ql-pass-"));
    const toolkit = mkdtempSync(join(tmpdir(), "ql-tk-"));
    try {
      writeFixtureToolkit(toolkit);
      const head = initRepo(dir);
      const r = spawnSync("bash", [RECORD_HELPER, "--status", "pass", "--expect-head", head], {
        cwd: dir,
        encoding: "utf8",
        env: { ...gitEnv(), FF_DEV_TOOLKIT_ROOT: toolkit },
      });
      expect(r.status, r.stderr).toBe(0);
      const rec = recordMap(join(dir, ".git", "ff-dev-toolkit", "gate-record"));
      expect(rec.STATUS).toBe("pass");
      expect(rec.COMMIT).toBe(head);
      expect(rec.BRANCH).toBe("develop");
      expect(rec.DIRTY).toBe("no");
      expect(rec.GATE).toBe("quality:local");
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(toolkit, { recursive: true, force: true });
    }
  });

  it("fail は前回の pass を上書きする", () => {
    const dir = mkdtempSync(join(tmpdir(), "ql-fail-"));
    const toolkit = mkdtempSync(join(tmpdir(), "ql-tk-"));
    try {
      writeFixtureToolkit(toolkit);
      const head = initRepo(dir);
      const env = { ...gitEnv(), FF_DEV_TOOLKIT_ROOT: toolkit };
      spawnSync("bash", [RECORD_HELPER, "--status", "pass", "--expect-head", head], {
        cwd: dir,
        encoding: "utf8",
        env,
      });
      const fail = spawnSync("bash", [RECORD_HELPER, "--status", "fail", "--expect-head", head], {
        cwd: dir,
        encoding: "utf8",
        env,
      });
      expect(fail.status, fail.stderr).toBe(0);
      expect(recordMap(join(dir, ".git", "ff-dev-toolkit", "gate-record")).STATUS).toBe("fail");
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(toolkit, { recursive: true, force: true });
    }
  });

  it("FF_DEV_TOOLKIT_ROOT 未設定でも Codex cache の record-gate-head.sh で pass を書く", () => {
    const dir = mkdtempSync(join(tmpdir(), "ql-cache-"));
    const home = mkdtempSync(join(tmpdir(), "ql-home-"));
    try {
      const head = initRepo(dir);
      const recDir = join(home, ".codex", "plugins", "cache", "mp", "ff-dev-toolkit", "9.9.9");
      writeFixtureToolkit(recDir);
      const r = spawnSync("bash", [RECORD_HELPER, "--status", "pass", "--expect-head", head], {
        cwd: dir,
        encoding: "utf8",
        env: {
          ...gitEnv(),
          HOME: home,
          CODEX_HOME: join(home, ".codex"),
          CLAUDE_CONFIG_DIR: join(home, ".claude"),
        },
      });
      expect(r.status, r.stderr).toBe(0);
      expect(recordMap(join(dir, ".git", "ff-dev-toolkit", "gate-record")).STATUS).toBe("pass");
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(home, { recursive: true, force: true });
    }
  });

  it("toolkit が無いときは記録せず exit 0 のまま返す", () => {
    const dir = mkdtempSync(join(tmpdir(), "ql-skip-"));
    try {
      initRepo(dir);
      const missing = join(dir, "empty-toolkit");
      mkdirSync(missing);
      const r = spawnSync("bash", [RECORD_HELPER, "--status", "pass"], {
        cwd: dir,
        encoding: "utf8",
        env: { ...gitEnv(), FF_DEV_TOOLKIT_ROOT: missing },
      });
      expect(r.status, r.stderr).toBe(0);
      expect(r.stderr).toMatch(/スキップ/);
      expect(() =>
        readFileSync(join(dir, ".git", "ff-dev-toolkit", "gate-record"), "utf8"),
      ).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("quality-local.sh は npm チェーン成功で pass、失敗で fail を書く", () => {
    const passDir = mkdtempSync(join(tmpdir(), "ql-npm-pass-"));
    const failDir = mkdtempSync(join(tmpdir(), "ql-npm-fail-"));
    const toolkit = mkdtempSync(join(tmpdir(), "ql-tk-"));
    try {
      writeFixtureToolkit(toolkit);
      writeFileSync(join(passDir, "npm"), "#!/bin/sh\nexit 0\n");
      chmodSync(join(passDir, "npm"), 0o755);
      writeFileSync(join(failDir, "npm"), "#!/bin/sh\nexit 1\n");
      chmodSync(join(failDir, "npm"), 0o755);
      const passFile = join(passDir, "gate-record");
      const failFile = join(failDir, "gate-record");
      const pass = spawnSync("bash", [QUALITY_LOCAL], {
        cwd: REPO_ROOT,
        encoding: "utf8",
        env: {
          ...gitEnv(),
          PATH: `${passDir}:${BASE_PATH}`,
          FF_DEV_TOOLKIT_ROOT: toolkit,
          FF_GATE_RECORD_FILE: passFile,
        },
      });
      expect(pass.status, pass.stderr).toBe(0);
      expect(recordMap(passFile).STATUS).toBe("pass");
      const fail = spawnSync("bash", [QUALITY_LOCAL], {
        cwd: REPO_ROOT,
        encoding: "utf8",
        env: {
          ...gitEnv(),
          PATH: `${failDir}:${BASE_PATH}`,
          FF_DEV_TOOLKIT_ROOT: toolkit,
          FF_GATE_RECORD_FILE: failFile,
        },
      });
      expect(fail.status).toBe(1);
      expect(recordMap(failFile).STATUS).toBe("fail");
    } finally {
      rmSync(passDir, { recursive: true, force: true });
      rmSync(failDir, { recursive: true, force: true });
      rmSync(toolkit, { recursive: true, force: true });
    }
  });

  it.skipIf(!TOOLKIT_ROOT)(
    "記録直後の check-merge-freshness.sh --remote-head は exit 0",
    () => {
      const dir = mkdtempSync(join(tmpdir(), "ql-fresh-"));
      try {
        const head = initRepo(dir);
        const env = { ...gitEnv(), FF_DEV_TOOLKIT_ROOT: TOOLKIT_ROOT as string };
        const rec = spawnSync("bash", [RECORD_HELPER, "--status", "pass", "--expect-head", head], {
          cwd: dir,
          encoding: "utf8",
          env,
        });
        expect(rec.status, rec.stderr).toBe(0);
        const check = spawnSync(
          "bash",
          [
            join(TOOLKIT_ROOT as string, "scripts", "check-merge-freshness.sh"),
            "--remote-head",
            head,
          ],
          { cwd: dir, encoding: "utf8", env },
        );
        expect(check.status, `${check.stdout}\n${check.stderr}`).toBe(0);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
  );
});
