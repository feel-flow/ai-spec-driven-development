import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { findBracketPlaceholders, maskExemptSpans } from "./validate-docs.mjs";

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), "validate-docs.mjs");
const VALID_DOCS = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../mcp/tests/fixtures/valid-docs",
);
const EXIT_SUCCESS = 0;

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function run(docsDir: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execFileSync("node", [SCRIPT, docsDir], { encoding: "utf-8" });
    return { stdout, exitCode: EXIT_SUCCESS };
  } catch (error: unknown) {
    const failed = error as { stdout?: string; status?: number };
    return { stdout: failed.stdout ?? "", exitCode: failed.status ?? 1 };
  }
}

function copyValidDocs(): string {
  const dir = mkdtempSync(join(tmpdir(), "validate-docs-ph-"));
  tempDirs.push(dir);
  cpSync(VALID_DOCS, dir, { recursive: true });
  return dir;
}

describe("findBracketPlaceholders (Issue #507)", () => {
  it("本文の [金額] を拾い、Markdown リンクとタスクリストは拾わない", () => {
    const masked = maskExemptSpans(
      [
        "予算は [金額] です。",
        "- [ ] 未完了",
        "[公開テンプレート配布元](https://example.com)",
        "[本文][ref]",
        "[ref]: https://example.com",
        "",
      ].join("\n"),
    );
    const hits = findBracketPlaceholders(masked);
    expect(hits.map((hit) => hit.raw)).toEqual(["[金額]"]);
    expect(hits[0]?.deferred).toBe(true);
  });

  it("[日付] は未確定値、[SLACK連携] は leftover のまま", () => {
    const hits = findBracketPlaceholders(maskExemptSpans("期日 [日付] / [SLACK連携]"));
    expect(hits).toEqual([
      { raw: "[日付]", inner: "日付", deferred: true },
      { raw: "[SLACK連携]", inner: "SLACK連携", deferred: false },
    ]);
  });

  it("閉じたコードフェンス内の [金額] は拾わず、閉じ忘れフェンス内は拾う", () => {
    const closed = maskExemptSpans("```\n[金額]\n```\n本文 [金額]\n");
    expect(findBracketPlaceholders(closed).map((hit) => hit.raw)).toEqual(["[金額]"]);

    const tilde = maskExemptSpans("~~~\n[金額]\n~~~\n本文 [金額]\n");
    expect(findBracketPlaceholders(tilde).map((hit) => hit.raw)).toEqual(["[金額]"]);

    const unclosed = maskExemptSpans("```\n[金額]\n本文も [SLA値]\n");
    expect(findBracketPlaceholders(unclosed).map((hit) => hit.raw)).toEqual(["[金額]", "[SLA値]"]);
  });

  it("インラインコードの [x.x.x] は拾わない", () => {
    const masked = maskExemptSpans("バージョンは `[x.x.x]` と書く。本文は [x.x.x]。");
    expect(findBracketPlaceholders(masked).map((hit) => hit.raw)).toEqual(["[x.x.x]"]);
  });
});

describe("validate-docs.mjs 角括弧プレースホルダー (Issue #507)", () => {
  it("Given [金額] が残った文書 When validate すると Then 未確定値プレースホルダー残存として報告する", () => {
    const dir = copyValidDocs();
    const project = join(dir, "01-context/PROJECT.md");
    writeFileSync(project, `${readFileSync(project, "utf-8")}\n予算: [金額]\n`, "utf-8");

    const { stdout, exitCode } = run(dir);
    expect(exitCode).toBe(EXIT_SUCCESS);
    expect(stdout).toContain("[金額]");
    expect(stdout).toMatch(/未確定値プレースホルダー残存/);
    expect(stdout).not.toMatch(/プレースホルダー残存 \(角括弧/);
  });

  it("消費者ツリーの leftover は角括弧プレースホルダー残存として報告し、未確定値にはしない", () => {
    const dir = copyValidDocs();
    const project = join(dir, "01-context/PROJECT.md");
    writeFileSync(project, `${readFileSync(project, "utf-8")}\n名前: [プロジェクト名]\n`, "utf-8");

    const { stdout, exitCode } = run(dir);
    expect(exitCode).toBe(EXIT_SUCCESS);
    expect(stdout).toContain("[プロジェクト名]");
    expect(stdout).toMatch(/プレースホルダー残存 \(角括弧/);
    expect(stdout).not.toMatch(/未確定値プレースホルダー残存/);
  });

  it("docs-template 検証は未確定値警告のみで exit 0（角括弧 leftover 文言は出さない）", () => {
    const template = resolve(dirname(fileURLToPath(import.meta.url)), "../docs-template");
    const { stdout, exitCode } = run(template);
    expect(exitCode).toBe(EXIT_SUCCESS);
    expect(stdout).toMatch(/未確定値プレースホルダー残存/);
    expect(stdout).not.toMatch(/プレースホルダー残存 \(角括弧/);
  });
});
