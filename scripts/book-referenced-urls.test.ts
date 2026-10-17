import {
  existsSync,
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

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIST_PATH = join(REPO_ROOT, "scripts", "book-referenced-urls.json");
const REPO_URL = "https://github.com/feel-flow/ai-spec-driven-development";
// ルート URL を開くと GitHub が既定ブランチの README を表示する
const ROOT_LANDING_PATH = "README.md";
// /blob/<ref>/<path> と /tree/<ref>/<path>。<ref> にスラッシュを含むブランチ名は書籍に載せない前提
// （載せると <ref> の残りがパス側に入り、repoPath 不一致として失敗する）
const DEEP_LINK = /^\/(?:blob|tree)\/[^/]+\/(.+)$/;

interface Entry {
  url: string;
  repoPath: string;
}

function findProblems(entries: Entry[], root: string): string[] {
  const problems: string[] = [];
  for (const { url, repoPath } of entries) {
    if (url.includes("#")) {
      // 書籍がアンカーを参照した時点で、見出しの存在検証をここへ実装する
      problems.push(`${url}: アンカー付き URL の検証は未実装`);
      continue;
    }
    if (url !== REPO_URL && !url.startsWith(`${REPO_URL}/`)) {
      problems.push(`${url}: 本リポジトリの URL ではない`);
      continue;
    }
    const rest = url.slice(REPO_URL.length).replace(/\/$/, "");
    const expected =
      rest === "" ? ROOT_LANDING_PATH : DEEP_LINK.exec(rest)?.[1];
    if (expected === undefined) {
      problems.push(`${url}: blob / tree 以外の URL 形式`);
    } else if (expected !== repoPath) {
      problems.push(`${url}: repoPath が ${expected} ではなく ${repoPath}`);
    } else if (!existsSync(join(root, repoPath))) {
      problems.push(`${url}: ${repoPath} が存在しない`);
    }
  }
  return problems;
}

// [url, repoPath, 期待する問題文の一部（null は問題なし）]
const SELF_TEST_CASES: [string, string, string | null][] = [
  [REPO_URL, "README.md", null],
  [`${REPO_URL}/`, "README.md", null],
  [`${REPO_URL}/tree/develop/docs`, "docs", null],
  [`${REPO_URL}/blob/develop/docs/GONE.md`, "docs/GONE.md", "が存在しない"],
  // repoPath 側は実在させ、不一致の分岐だけが検出役になるようにする
  [`${REPO_URL}/blob/develop/docs/GONE.md`, "README.md", "repoPath が"],
  [`${REPO_URL}#readme`, "README.md", "アンカー付き URL"],
  [`${REPO_URL}/issues/468`, "README.md", "blob / tree 以外"],
  [
    "https://github.com/feel-flow/other",
    "README.md",
    "本リポジトリの URL ではない",
  ],
];

describe("book-referenced URLs stay resolvable (Issue #468)", () => {
  it("reports each kind of broken entry by its own branch", () => {
    const root = mkdtempSync(join(tmpdir(), "book-urls-"));
    try {
      writeFileSync(join(root, "README.md"), "");
      mkdirSync(join(root, "docs"));
      for (const [url, repoPath, problem] of SELF_TEST_CASES) {
        const found = findProblems([{ url, repoPath }], root);
        if (problem === null) {
          expect(found, url).toEqual([]);
        } else {
          expect(found, url).toEqual([expect.stringContaining(problem)]);
        }
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps every listed URL pointing at an existing file", () => {
    const { entries } = JSON.parse(readFileSync(LIST_PATH, "utf8")) as {
      entries: Entry[];
    };
    expect(entries.length).toBeGreaterThan(0);
    expect(findProblems(entries, REPO_ROOT)).toEqual([]);
  });
});
