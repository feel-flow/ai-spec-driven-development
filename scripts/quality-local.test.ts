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
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { gitFixtureEnv } from "./git-fixture-env";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const QUALITY_LOCAL = join(REPO_ROOT, "scripts", "quality-local.sh");
const RECORD_HELPER = join(REPO_ROOT, "scripts", "record-quality-gate.sh");
const IS_WINDOWS = process.platform === "win32";
// macOS / Linux では子の PATH を OS 標準の 2 か所に絞り、実行環境の外のツールに依存しないことを確かめる
const POSIX_BASE_DIRS: readonly string[] = ["/usr/bin", "/bin"];

// 子プロセスとして起動する bash / git と、子の PATH の基底ディレクトリ（stub ディレクトリはこの前に足す）。
interface ShellTools {
  bash: string;
  git: string;
  baseDirs: readonly string[];
  // Windows で bash が出す /c/... 形式を Node が読める形へ直す cygpath。POSIX では不要なので null
  cygpath: string | null;
}

// Issue #570: Windows の Node は子プロセスの実行ファイルを渡した env.PATH から探すため、POSIX 形式の
// PATH では bash を解決できない。PATH 順で bash を探すと System32 の WSL bash を拾うこともあるので、
// Git for Windows の配置（git --exec-path = <Git>/<mingw>/libexec/git-core）から bash.exe と git.exe を
// 絶対パスで決め、子の PATH もその 2 ディレクトリ（<Git>/usr/bin と git.exe の在処）に絞る。
function resolveShellTools(): ShellTools {
  if (!IS_WINDOWS) return { bash: "bash", git: "git", baseDirs: POSIX_BASE_DIRS, cygpath: null };
  // ここだけは親の PATH で git を探す（絞った PATH を作る前の起点）
  const exec = spawnSync("git", ["--exec-path"], { encoding: "utf8" });
  if (exec.error || exec.status !== 0) {
    throw new Error(
      `git --exec-path を実行できません（Git for Windows が要ります）: ${exec.error?.message ?? exec.stderr}`,
    );
  }
  const execPath = exec.stdout.trim();
  const usrBin = join(resolve(execPath, "..", "..", ".."), "usr", "bin");
  const gitBin = resolve(execPath, "..", "..", "bin");
  const tools: ShellTools = {
    bash: join(usrBin, "bash.exe"),
    git: join(gitBin, "git.exe"),
    baseDirs: [usrBin, gitBin],
    cygpath: join(usrBin, "cygpath.exe"),
  };
  for (const exe of [tools.bash, tools.git, tools.cygpath as string]) {
    if (!existsSync(exe)) {
      throw new Error(`Git for Windows の ${exe} がありません（git --exec-path: ${execPath}）`);
    }
  }
  return tools;
}

const TOOLS = resolveShellTools();

// 子の PATH。stub ディレクトリを先頭に置き、基底ディレクトリ以外は通さない。
function childPath(...stubDirs: string[]): string {
  return [...stubDirs, ...TOOLS.baseDirs].join(delimiter);
}

// bash へ渡すパス。MSYS の dirname は "\" を区切りと見なさず、quality-local.sh の
// ROOT="$(cd "$(dirname "$0")/.." && pwd)" がずれるので、Windows では "/" へ寄せる（C:/... は Node も読める）。
function shellPath(path: string): string {
  return IS_WINDOWS ? path.replace(/\\/g, "/") : path;
}

// bash が出したパスを Node の existsSync で読める形へ直す（Windows の /c/... → C:/...）。
function nodePath(path: string): string {
  if (!TOOLS.cygpath || !path.startsWith("/")) return path;
  const r = spawnSync(TOOLS.cygpath, ["-m", path], { encoding: "utf8" });
  return r.status === 0 && r.stdout ? r.stdout.trim() : path;
}

// 各テストは bash を起動して quality-local.sh を走らせるので、Windows では起動が重い。単独なら最長 3.3 秒の
// テストが、vitest 全体（他スイートと並列）では既定の 5 秒を超えて落ちた（Issue #570）。単独時の約 6 倍まで待つ（ms）
const SPAWN_TEST_TIMEOUT_MS = 20_000;

// quality-local.sh の STEPS と同じ順序（段を足したらここも足す。段数はこの配列から数える）
const EXPECTED_ORDER = [
  "run build:mcp",
  "run check",
  "--prefix mcp test",
  "run test:ace-scripts",
  "run validate -- docs-template",
  "run check:md-ts",
  "run build:spec-index",
  "run format:md:check",
  "run lint:md",
];
const STEP_COUNT = EXPECTED_ORDER.length;

// 実チェックアウトで quality-local.sh を走らせるテストの前提（Issue #565）。
// 依存が無いと本物のスクリプトが先頭で止まるが、テスト側の失敗は終了コードの不一致や calls ログ不在などで
// 原因（依存不在）を名指ししないので、先にここで原因を名指しして止める。
const REAL_CHECKOUT_DEPS: ReadonlyArray<{ dir: string; fix: string }> = [
  { dir: "node_modules", fix: "npm ci" },
  { dir: "mcp/node_modules", fix: "npm --prefix mcp ci" },
];

function requireRealCheckoutDeps(): void {
  const missing = REAL_CHECKOUT_DEPS.filter(({ dir }) => !existsSync(join(REPO_ROOT, dir)));
  if (missing.length > 0) {
    throw new Error(
      `実チェックアウトの依存が未導入です。${missing
        .map(({ dir, fix }) => `${dir} が無い（先に実行: ${fix}）`)
        .join(" / ")}`,
    );
  }
}

function gitEnv(): NodeJS.ProcessEnv {
  const env = gitFixtureEnv({
    FF_DEV_TOOLKIT_ROOT: undefined,
    FF_GATE_RECORD_FILE: undefined,
  });
  // Windows の env キーは大文字小文字を区別しない。継承した Path と PATH が並ぶとどちらが効くか
  // 定まらないので、PATH 系のキーを全部落としてから絞った PATH を 1 つだけ置く。
  for (const key of Object.keys(env)) {
    if (key.toUpperCase() === "PATH") delete env[key];
  }
  env.PATH = childPath();
  return env;
}

function resolveToolkit(): string | null {
  const printed = spawnSync(
    TOOLS.bash,
    [shellPath(join(REPO_ROOT, "scripts", "codex-review.sh")), "--print-toolkit-root"],
    { cwd: REPO_ROOT, encoding: "utf8", env: gitEnv() },
  );
  // 起動自体の失敗（Issue #570 の stdout undefined）は、何が起動できなかったかを名指しして止める
  if (printed.error) {
    throw new Error(`${TOOLS.bash} を起動できません: ${printed.error.message}`);
  }
  const printedLine = printed.stdout.trim().split("\n").filter(Boolean).pop();
  const printedRoot = printedLine ? nodePath(printedLine) : undefined;
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
    const r = spawnSync(TOOLS.git, args, { cwd: dir, encoding: "utf8", env: gitEnv() });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  };
  git("init", "-b", "develop");
  writeFileSync(join(dir, "README"), "ok\n");
  git("add", ".");
  git("commit", "-m", "init");
  const head = spawnSync(TOOLS.git, ["rev-parse", "HEAD"], {
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

describe("quality:local gate record (Issue #515)", { timeout: SPAWN_TEST_TIMEOUT_MS }, () => {
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
      const r = spawnSync(TOOLS.bash, [shellPath(RECORD_HELPER), "--status", "pass", "--expect-head", head], {
        cwd: dir,
        encoding: "utf8",
        env: { ...gitEnv(), FF_DEV_TOOLKIT_ROOT: shellPath(toolkit) },
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
      const env = { ...gitEnv(), FF_DEV_TOOLKIT_ROOT: shellPath(toolkit) };
      spawnSync(TOOLS.bash, [shellPath(RECORD_HELPER), "--status", "pass", "--expect-head", head], {
        cwd: dir,
        encoding: "utf8",
        env,
      });
      const fail = spawnSync(TOOLS.bash, [shellPath(RECORD_HELPER), "--status", "fail", "--expect-head", head], {
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
      const r = spawnSync(TOOLS.bash, [shellPath(RECORD_HELPER), "--status", "pass", "--expect-head", head], {
        cwd: dir,
        encoding: "utf8",
        env: {
          ...gitEnv(),
          HOME: shellPath(home),
          CODEX_HOME: shellPath(join(home, ".codex")),
          CLAUDE_CONFIG_DIR: shellPath(join(home, ".claude")),
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
      const r = spawnSync(TOOLS.bash, [shellPath(RECORD_HELPER), "--status", "pass"], {
        cwd: dir,
        encoding: "utf8",
        env: { ...gitEnv(), FF_DEV_TOOLKIT_ROOT: shellPath(missing) },
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
    requireRealCheckoutDeps();
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
      const pass = spawnSync(TOOLS.bash, [shellPath(QUALITY_LOCAL)], {
        cwd: REPO_ROOT,
        encoding: "utf8",
        env: {
          ...gitEnv(),
          PATH: childPath(passDir),
          FF_DEV_TOOLKIT_ROOT: shellPath(toolkit),
          FF_GATE_RECORD_FILE: shellPath(passFile),
        },
      });
      expect(pass.status, pass.stderr).toBe(0);
      expect(recordMap(passFile).STATUS).toBe("pass");
      const fail = spawnSync(TOOLS.bash, [shellPath(QUALITY_LOCAL)], {
        cwd: REPO_ROOT,
        encoding: "utf8",
        env: {
          ...gitEnv(),
          PATH: childPath(failDir),
          FF_DEV_TOOLKIT_ROOT: shellPath(toolkit),
          FF_GATE_RECORD_FILE: shellPath(failFile),
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

  describe("段ラベルと停止位置 (Issue #389)", () => {
    const FAILING_STEP_RC = 7;

    beforeAll(requireRealCheckoutDeps);

    function runWithStub(failOn: string | null) {
      const binDir = mkdtempSync(join(tmpdir(), "ql-steps-"));
      const toolkit = mkdtempSync(join(tmpdir(), "ql-tk-"));
      const log = join(binDir, "calls.log");
      const failCase = failOn
        ? `  "${failOn}") exit ${FAILING_STEP_RC} ;;\n`
        : "";
      writeFileSync(
        join(binDir, "npm"),
        `#!/bin/sh\necho "$*" >> "${shellPath(log)}"\ncase "$*" in\n${failCase}esac\nexit 0\n`,
      );
      chmodSync(join(binDir, "npm"), 0o755);
      writeFixtureToolkit(toolkit);
      try {
        const r = spawnSync(TOOLS.bash, [shellPath(QUALITY_LOCAL)], {
          cwd: REPO_ROOT,
          encoding: "utf8",
          env: {
            ...gitEnv(),
            PATH: childPath(binDir),
            FF_DEV_TOOLKIT_ROOT: shellPath(toolkit),
            FF_GATE_RECORD_FILE: shellPath(join(binDir, "gate-record")),
          },
        });
        const calls = readFileSync(log, "utf8").trim().split("\n");
        const status = recordMap(join(binDir, "gate-record")).STATUS;
        return { r, calls, status };
      } finally {
        rmSync(binDir, { recursive: true, force: true });
        rmSync(toolkit, { recursive: true, force: true });
      }
    }

    it("成功時は全段を従来の順で呼び、各段の開始ラベルが実際の呼び出しと一致する", () => {
      const { r, calls, status } = runWithStub(null);
      expect(r.status, r.stderr).toBe(0);
      expect(calls).toEqual(EXPECTED_ORDER);
      const labels = r.stdout
        .split("\n")
        .filter((line) => line.startsWith("==> quality:local "));
      expect(labels).toEqual(
        EXPECTED_ORDER.map(
          (args, i) => `==> quality:local [${i + 1}/${STEP_COUNT}] npm ${args}`,
        ),
      );
      expect(r.stdout).toContain(`✓ quality:local: 全 ${STEP_COUNT} 段が通過しました`);
      expect(status).toBe("pass");
    });

    it.each([1, 4, STEP_COUNT])(
      "%i 段目が落ちたらその段の終了コードを返し、段名を stderr に出して後続を呼ばない",
      (stepNo) => {
        const failing = EXPECTED_ORDER[stepNo - 1];
        const { r, calls, status } = runWithStub(failing);
        expect(r.status).toBe(FAILING_STEP_RC);
        expect(calls).toEqual(EXPECTED_ORDER.slice(0, stepNo));
        expect(r.stderr).toContain(
          `[${stepNo}/${STEP_COUNT}] npm ${failing} が失敗しました（exit ${FAILING_STEP_RC}）。この段だけ再実行: npm ${failing}`,
        );
        expect(r.stdout).not.toContain(`全 ${STEP_COUNT} 段が通過しました`);
        expect(status).toBe("fail");
      },
    );
  });

  describe("依存未導入のプリフライト (Issue #565)", () => {
    const ROOT_FIX = "npm ci";
    const MCP_FIX = "npm --prefix mcp ci";

    // 一時ディレクトリに scripts を複製した偽のチェックアウトを作る（ROOT は scripts の親）。
    function runInFixture(present: { root: boolean; mcp: boolean }) {
      const dir = mkdtempSync(join(tmpdir(), "ql-deps-"));
      const binDir = mkdtempSync(join(tmpdir(), "ql-deps-bin-"));
      const toolkit = mkdtempSync(join(tmpdir(), "ql-tk-"));
      const log = join(binDir, "calls.log");
      try {
        mkdirSync(join(dir, "scripts"));
        for (const name of ["quality-local.sh", "record-quality-gate.sh"]) {
          writeFileSync(
            join(dir, "scripts", name),
            readFileSync(join(REPO_ROOT, "scripts", name)),
          );
        }
        if (present.root) mkdirSync(join(dir, "node_modules"));
        if (present.mcp) mkdirSync(join(dir, "mcp", "node_modules"), { recursive: true });
        writeFixtureToolkit(toolkit);
        initRepo(dir);
        writeFileSync(join(binDir, "npm"), `#!/bin/sh\necho "$*" >> "${shellPath(log)}"\nexit 0\n`);
        chmodSync(join(binDir, "npm"), 0o755);
        const gateFile = join(binDir, "gate-record");
        // 前回の緑が残っている状態から始める
        writeFileSync(gateFile, "STATUS=pass\n");
        const r = spawnSync(TOOLS.bash, [shellPath(join(dir, "scripts", "quality-local.sh"))], {
          cwd: dir,
          encoding: "utf8",
          env: {
            ...gitEnv(),
            PATH: childPath(binDir),
            FF_DEV_TOOLKIT_ROOT: shellPath(toolkit),
            FF_GATE_RECORD_FILE: shellPath(gateFile),
          },
        });
        const calls = existsSync(log) ? readFileSync(log, "utf8").trim().split("\n") : [];
        return { r, calls, status: recordMap(gateFile).STATUS };
      } finally {
        rmSync(dir, { recursive: true, force: true });
        rmSync(binDir, { recursive: true, force: true });
        rmSync(toolkit, { recursive: true, force: true });
      }
    }

    it.each([
      { name: "ルートの node_modules だけ無い", root: false, mcp: true, named: ["node_modules"], fix: [ROOT_FIX], notNamed: ["mcp/node_modules"] },
      { name: "mcp/node_modules だけ無い", root: true, mcp: false, named: ["mcp/node_modules"], fix: [MCP_FIX], notNamed: [] },
      { name: "両方無い", root: false, mcp: false, named: ["node_modules", "mcp/node_modules"], fix: [ROOT_FIX, MCP_FIX], notNamed: [] },
    ])(
      "$name: 段を 1 つも実行せず、不在名と案内コマンドを stderr に出して exit 1、gate-record は fail",
      ({ root, mcp, named, fix, notNamed }) => {
        const { r, calls, status } = runInFixture({ root, mcp });
        expect(r.status, r.stderr).toBe(1);
        expect(calls).toEqual([]);
        expect(r.stdout).not.toContain("==> quality:local");
        expect(r.stderr).toContain("✗ quality:local:");
        for (const n of named) expect(r.stderr).toContain(n);
        for (const f of fix) expect(r.stderr).toContain(f);
        for (const n of notNamed) expect(r.stderr).not.toContain(n);
        if (!root) expect(r.stderr).toContain(ROOT_FIX);
        if (root) expect(r.stderr).not.toContain(ROOT_FIX);
        if (mcp) expect(r.stderr).not.toContain(MCP_FIX);
        expect(status).toBe("fail");
      },
    );

    it("両方在るときは従来どおり全段を実行して exit 0", () => {
      const { r, calls, status } = runInFixture({ root: true, mcp: true });
      expect(r.status, r.stderr).toBe(0);
      expect(calls).toEqual(EXPECTED_ORDER);
      expect(status).toBe("pass");
    });
  });

  it.skipIf(!TOOLKIT_ROOT)(
    "記録直後の check-merge-freshness.sh --remote-head は exit 0",
    () => {
      const dir = mkdtempSync(join(tmpdir(), "ql-fresh-"));
      try {
        const head = initRepo(dir);
        const env = { ...gitEnv(), FF_DEV_TOOLKIT_ROOT: shellPath(TOOLKIT_ROOT as string) };
        const rec = spawnSync(TOOLS.bash, [shellPath(RECORD_HELPER), "--status", "pass", "--expect-head", head], {
          cwd: dir,
          encoding: "utf8",
          env,
        });
        expect(rec.status, rec.stderr).toBe(0);
        const check = spawnSync(
          TOOLS.bash,
          [
            shellPath(join(TOOLKIT_ROOT as string, "scripts", "check-merge-freshness.sh")),
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
