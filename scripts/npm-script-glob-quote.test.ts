import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// glob 文字（* か ?）を含む空白区切りトークンは、ダブルクォートで囲まれていなければならない（Issue #563）。
// - 単一引用符: cmd.exe では引数の一部としてそのまま渡り、ツール側の glob が一致しない。
// - 引用なし: sh が先に展開する。globstar を持たない dash では ** が 1 階層分にしか効かない。
const GLOB_CHARS = /[*?]/;
const DOUBLE_QUOTED = /^"[^"]*"$/;

function hasUnsafeGlobToken(script: string): boolean {
  return script
    .split(/\s+/)
    .some((token) => GLOB_CHARS.test(token) && !DOUBLE_QUOTED.test(token));
}

describe("npm script glob quoting (Issue #563)", () => {
  it("flags single-quoted and unquoted globs so a broken detector cannot stay green", () => {
    expect(hasUnsafeGlobToken("prettier --check 'docs/**/*.md'")).toBe(true);
    expect(hasUnsafeGlobToken("prettier --check docs/**/*.md")).toBe(true);
    expect(hasUnsafeGlobToken("markdownlint-cli2 'docs/**/*.md' '*.md'")).toBe(true);
    expect(hasUnsafeGlobToken("tool 'file?.md'")).toBe(true);
    expect(hasUnsafeGlobToken("echo 'a' b* 'c'")).toBe(true);
  });

  it("does not flag double-quoted globs or scripts without glob characters", () => {
    expect(hasUnsafeGlobToken('prettier --check "docs/**/*.md" "*.md"')).toBe(false);
    expect(hasUnsafeGlobToken("prettier --check docs/foo.md")).toBe(false);
    expect(hasUnsafeGlobToken("echo 'no glob here'")).toBe(false);
  });

  it("keeps unsafe glob tokens out of every package.json script", () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    const scripts = Object.entries(pkg.scripts ?? {});
    expect(scripts.length, "package.json must define scripts to scan").toBeGreaterThan(0);
    const offenders = scripts
      .filter(([, command]) => hasUnsafeGlobToken(command))
      .map(([name]) => name);
    expect(offenders, `unquoted or single-quoted glob in npm scripts: ${offenders.join(", ")}`).toEqual([]);
  });
});
