import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// 空白区切りの 1 トークン全体が単一引用符で囲まれ、glob 文字（* か ?）を含むもの。
// cmd.exe では単一引用符が引数の一部としてそのまま渡り、ツール側の glob 展開が一致しない（Issue #563）。
const SINGLE_QUOTED_GLOB = /(?:^|\s)'[^']*[*?][^']*'(?=\s|$)/;

function hasSingleQuotedGlob(script: string): boolean {
  return SINGLE_QUOTED_GLOB.test(script);
}

describe("npm script glob quoting (Issue #563)", () => {
  it("flags single-quoted globs so a broken detector cannot stay green", () => {
    expect(hasSingleQuotedGlob("prettier --check 'docs/**/*.md'")).toBe(true);
    expect(hasSingleQuotedGlob("markdownlint-cli2 'docs/**/*.md' '*.md'")).toBe(true);
    expect(hasSingleQuotedGlob("tool 'file?.md'")).toBe(true);
  });

  it("does not flag cmd.exe/sh-portable forms", () => {
    expect(hasSingleQuotedGlob('prettier --check "docs/**/*.md" "*.md"')).toBe(false);
    expect(hasSingleQuotedGlob("prettier --check docs/foo.md")).toBe(false);
    expect(hasSingleQuotedGlob("echo 'no glob here'")).toBe(false);
    expect(hasSingleQuotedGlob("cmd a*b c")).toBe(false);
    expect(hasSingleQuotedGlob("echo 'a' b* 'c'")).toBe(false);
  });

  it("keeps single-quoted globs out of every package.json script", () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    const scripts = Object.entries(pkg.scripts ?? {});
    expect(scripts.length, "package.json must define scripts to scan").toBeGreaterThan(0);
    const offenders = scripts
      .filter(([, command]) => hasSingleQuotedGlob(command))
      .map(([name]) => name);
    expect(offenders, `single-quoted glob in npm scripts: ${offenders.join(", ")}`).toEqual([]);
  });
});
