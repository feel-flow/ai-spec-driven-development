import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { delimiter, join, resolve } from "node:path";

// Issue #572: bash / git / sh を子プロセスとして起動するテスト（quality-local / review-scripts /
// review-cli-config / codex-review-shim）が共有するヘルパー。元は quality-local.test.ts（Issue #570）に
// あったものを、他のテストが `PATH=/usr/bin:/bin` を ":" で連結して Windows の ENOENT で落ちていたので
// ここへ切り出した。ファイル名は vitest の include（scripts/**/*.test.ts）に一致させないこと。

export const IS_WINDOWS = process.platform === "win32";
// macOS / Linux では子の PATH を OS 標準の 2 か所に絞り、実行環境の外のツールに依存しないことを確かめる
export const POSIX_BASE_DIRS: readonly string[] = ["/usr/bin", "/bin"];

// 子プロセスとして起動する bash / sh / git と、子の PATH の基底ディレクトリ（stub ディレクトリはこの前に足す）。
export interface ShellTools {
  bash: string;
  // .husky/pre-push のように husky が sh で実行するスクリプトは、忠実性のため bash ではなく sh で起動する
  sh: string;
  git: string;
  baseDirs: readonly string[];
  // Windows で bash が出す /c/... 形式を Node が読める形へ直す cygpath。POSIX では不要なので null
  cygpath: string | null;
}

// Issue #570: Windows の Node は子プロセスの実行ファイルを渡した env.PATH から探すため、POSIX 形式の
// PATH では bash を解決できない。PATH 順で bash を探すと System32 の WSL bash を拾うこともあるので、
// Git for Windows の配置（git --exec-path = <Git>/<mingw>/libexec/git-core）から bash.exe と git.exe を
// 絶対パスで決め、子の PATH もその 2 ディレクトリ（<Git>/usr/bin と git.exe の在処）に絞る。
// <mingw> は mingw64 / clangarm64 などインストール種別で変わるので直書きせず exec-path から導出する。
export function resolveShellTools(): ShellTools {
  if (!IS_WINDOWS) {
    return { bash: "bash", sh: "sh", git: "git", baseDirs: POSIX_BASE_DIRS, cygpath: null };
  }
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
    sh: join(usrBin, "sh.exe"),
    git: join(gitBin, "git.exe"),
    baseDirs: [usrBin, gitBin],
    cygpath: join(usrBin, "cygpath.exe"),
  };
  for (const exe of [tools.bash, tools.sh, tools.git, tools.cygpath as string]) {
    if (!existsSync(exe)) {
      throw new Error(`Git for Windows の ${exe} がありません（git --exec-path: ${execPath}）`);
    }
  }
  return tools;
}

export const TOOLS = resolveShellTools();

// 子の PATH。stub ディレクトリを先頭に置き、基底ディレクトリ以外は通さない。
// 区切りは path.delimiter（Windows は ";"）。":" で連結すると Windows では 1 つの壊れたエントリになる。
export function childPath(...stubDirs: string[]): string {
  return [...stubDirs, ...TOOLS.baseDirs].join(delimiter);
}

// env の PATH を childPath(...stubDirs) に置き換える。Windows の env キーは大文字小文字を区別しないので、
// 継承した Path と PATH が並ぶとどちらが効くか定まらない。PATH 系のキーを全部落としてから 1 つだけ置く。
export function withChildPath<T extends Record<string, string | undefined>>(
  env: T,
  ...stubDirs: string[]
): T {
  for (const key of Object.keys(env)) {
    if (key.toUpperCase() === "PATH") delete env[key];
  }
  (env as Record<string, string>).PATH = childPath(...stubDirs);
  return env;
}

// bash へ渡すパス。MSYS の dirname は "\" を区切りと見なさず、quality-local.sh の
// ROOT="$(cd "$(dirname "$0")/.." && pwd)" がずれるので、Windows では "/" へ寄せる（C:/... は Node も読める）。
export function shellPath(path: string): string {
  return IS_WINDOWS ? path.replace(/\\/g, "/") : path;
}

// bash が出したパスを Node の existsSync で読める形へ直す（Windows の /c/... → C:/...）。
// cygpath が失敗したときは入力をそのまま返す（呼び出し元の existsSync が偽になり、その候補を使わないだけ）。
export function nodePath(path: string): string {
  if (!TOOLS.cygpath || !path.startsWith("/")) return path;
  const r = spawnSync(TOOLS.cygpath, ["-m", path], { encoding: "utf8" });
  return r.status === 0 && r.stdout ? r.stdout.trim() : path;
}
