import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(REPO_ROOT, "scripts", "check-md-typescript.mjs");
const EXIT_OK = 0;
const EXIT_VIOLATION = 1;
const EXIT_NO_TARGET = 2;
const FENCE = "```";

const tempDirs: string[] = [];

function fixture(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "check-md-ts-"));
  tempDirs.push(dir);
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  return dir;
}

function run(cwd: string, ...dirs: string[]) {
  return spawnSync(process.execPath, [SCRIPT, ...dirs], { cwd, encoding: "utf8" });
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("check-md-typescript (Issue #512)", () => {
  it("try の無い catch を、ファイルと Markdown 上の行で報告して失敗する", () => {
    const cwd = fixture({
      "docs/sub/bad.md": [
        "# 例",
        "",
        `${FENCE}typescript`,
        "const a = 1;",
        "} catch (e) {",
        "  console.error(e);",
        "}",
        FENCE,
        "",
      ].join("\n"),
    });
    const r = run(cwd, "docs");
    expect(r.status).toBe(EXIT_VIOLATION);
    // 区切りは OS によらず / に揃える。本文 2 行目（Markdown 5 行目）の `}` が最初の違反
    expect(r.stderr).toMatch(/^docs\/sub\/bad\.md:5:1 TS\d+: /m);
  });

  it("構文として正しいブロックは通る", () => {
    const cwd = fixture({
      "docs/ok.md": `${FENCE}typescript\ntry {\n  run();\n} catch (e) {\n  report(e);\n}\n${FENCE}\n`,
    });
    const r = run(cwd, "docs");
    expect(r.status).toBe(EXIT_OK);
    expect(r.stdout).toContain("1 ファイル / 1 ブロックを構文検査しました");
  });

  it("リスト内でインデントされたフェンスの違反は、インデント込みの列で報告する", () => {
    const cwd = fixture({
      "docs/list.md": ["1. 手順", "", `   ${FENCE}ts`, "   if (x) { ... }", `   ${FENCE}`, ""].join("\n"),
    });
    const r = run(cwd, "docs");
    expect(r.status).toBe(EXIT_VIOLATION);
    // `   if (x) { ` の 12 文字の次、`...` の位置
    expect(r.stderr).toMatch(/^docs\/list\.md:4:13 TS\d+: /m);
  });

  it("CRLF の Markdown でも行番号がずれない", () => {
    const cwd = fixture({
      "docs/crlf.md": ["# 見出し", "", `${FENCE}typescript`, "const ok = 1;", "} oops", FENCE, ""].join("\r\n"),
    });
    const r = run(cwd, "docs");
    expect(r.status).toBe(EXIT_VIOLATION);
    expect(r.stderr).toMatch(/^docs\/crlf\.md:5:1 /m);
  });

  it("tsx フェンスは JSX として解析し、typescript フェンスの JSX は違反にする", () => {
    const jsx = "const el = <div className=\"a\">{name}</div>;";
    const ok = run(fixture({ "docs/a.md": `${FENCE}tsx\n${jsx}\n${FENCE}\n` }), "docs");
    expect(ok.status).toBe(EXIT_OK);
    const ng = run(fixture({ "docs/a.md": `${FENCE}typescript\n${jsx}\n${FENCE}\n` }), "docs");
    expect(ng.status).toBe(EXIT_VIOLATION);
  });

  it("no-check: <理由> 付きのブロックは検査しない", () => {
    const cwd = fixture({
      "docs/a.md": `${FENCE}typescript no-check: 意図的に崩した悪い例\n} catch {\n${FENCE}\n`,
    });
    const r = run(cwd, "docs");
    expect(r.status).toBe(EXIT_OK);
    expect(r.stdout).toContain("no-check 1 件");
  });

  it("理由の無い no-check は違反として報告する", () => {
    const cwd = fixture({ "docs/a.md": `${FENCE}typescript no-check\nconst a = 1;\n${FENCE}\n` });
    const r = run(cwd, "docs");
    expect(r.status).toBe(EXIT_VIOLATION);
    expect(r.stderr).toMatch(/^docs\/a\.md:1:1 no-check に理由がありません/m);
  });

  it("TypeScript 以外のフェンスと、外側フェンスの本文に書かれた TypeScript フェンスは検査しない", () => {
    const cwd = fixture({
      "docs/a.md": [
        `${FENCE}jsonc`,
        "{ \"data\": [...] }",
        FENCE,
        "",
        "````markdown",
        `${FENCE}typescript`,
        "} catch {",
        FENCE,
        "````",
        "",
      ].join("\n"),
    });
    const r = run(cwd, "docs");
    expect(r.status).toBe(EXIT_OK);
    expect(r.stdout).toContain("0 ブロックを構文検査しました");
  });

  it("no-check で始まる別の語（no-checking など）は除外マーカーとして受理しない", () => {
    const cwd = fixture({ "docs/a.md": `${FENCE}typescript no-checking\n} catch {\n${FENCE}\n` });
    const r = run(cwd, "docs");
    expect(r.status).toBe(EXIT_VIOLATION);
    expect(r.stderr).toMatch(/^docs\/a\.md:2:1 TS\d+: /m);
  });

  it.each([
    ["引用の中", ["> 例:", ">", `> ${FENCE}typescript`, "> } catch (e) {", `> ${FENCE}`], "4:3"],
    ["リスト項目の開始行", [`- ${FENCE}typescript`, "  } catch (e) {", `  ${FENCE}`], "2:3"],
    ["タブでインデントした位置", ["1. 手順", "", `\t${FENCE}ts`, "\t} catch (e) {", `\t${FENCE}`], "4:2"],
  ])("%sのフェンスも検査し、元の行の列で報告する", (_label, lines, at) => {
    const cwd = fixture({ "docs/a.md": [...lines, ""].join("\n") });
    const r = run(cwd, "docs");
    expect(r.status).toBe(EXIT_VIOLATION);
    expect(r.stderr).toMatch(new RegExp(`^docs/a\\.md:${at} TS\\d+: `, "m"));
  });

  it("引用が終わるとフェンスも閉じ、後ろの本文を TypeScript として読まない", () => {
    const cwd = fixture({
      "docs/a.md": ["> " + FENCE + "typescript", "> const a = 1;", "", "引用の外の文章 { ...", ""].join("\n"),
    });
    expect(run(cwd, "docs").status).toBe(EXIT_OK);
  });

  it("複数ファイル・複数ブロックの違反を、それぞれのファイルと行へ戻して報告する", () => {
    const ok = `${FENCE}ts\nconst ok = 1;\n${FENCE}\n`;
    const cwd = fixture({
      "docs/a.md": [ok, "本文", "", `${FENCE}typescript`, "const a = 1;", "} x", FENCE, ""].join("\n"),
      "docs/b.md": [`${FENCE}ts`, "} y", FENCE, ""].join("\n"),
    });
    const r = run(cwd, "docs");
    expect(r.status).toBe(EXIT_VIOLATION);
    // a.md: 1〜3 行目が正しいブロック、4 行目が空行、7 行目が 2 つ目のフェンス、9 行目が `} x`
    expect(r.stderr).toMatch(/^docs\/a\.md:9:1 TS\d+: /m);
    expect(r.stderr).toMatch(/^docs\/b\.md:2:1 TS\d+: /m);
    expect(r.stderr).not.toMatch(/^docs\/a\.md:[1-8]:/m);
  });

  it("チルダのフェンス・大文字の言語名・閉じられないフェンスも検査する", () => {
    const tilde = run(fixture({ "docs/a.md": "~~~TypeScript\n} catch {\n~~~\n" }), "docs");
    expect(tilde.stderr).toMatch(/^docs\/a\.md:2:1 TS\d+: /m);
    const unclosed = run(fixture({ "docs/a.md": `# 末尾\n\n${FENCE}ts\n} catch {\n` }), "docs");
    expect(unclosed.stderr).toMatch(/^docs\/a\.md:4:1 TS\d+: /m);
  });

  it("node_modules 配下の Markdown は辿らない", () => {
    const cwd = fixture({
      "docs/ok.md": "# ok\n",
      "docs/node_modules/pkg/README.md": `${FENCE}ts\n} catch {\n${FENCE}\n`,
    });
    expect(run(cwd, "docs").status).toBe(EXIT_OK);
  });

  it("対象ディレクトリが無い・Markdown が無いときは 0 件の緑にしない", () => {
    const cwd = fixture({ "docs/readme.txt": "not markdown" });
    expect(run(cwd, "missing").status).toBe(EXIT_NO_TARGET);
    expect(run(cwd, "docs").status).toBe(EXIT_NO_TARGET);
  });
});
