import {
  existsSync,
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

describe("book-referenced URLs stay resolvable (Issue #468)", () => {
  it("reports missing targets, mismatched paths and unverified anchors", () => {
    const root = mkdtempSync(join(tmpdir(), "book-urls-"));
    try {
      writeFileSync(join(root, "README.md"), "");
      expect(
        findProblems([{ url: REPO_URL, repoPath: "README.md" }], root),
      ).toEqual([]);
      expect(
        findProblems(
          [
            {
              url: `${REPO_URL}/blob/develop/docs/GONE.md`,
              repoPath: "docs/GONE.md",
            },
          ],
          root,
        ),
      ).toHaveLength(1);
      expect(
        findProblems(
          [
            {
              url: `${REPO_URL}/blob/develop/README.md`,
              repoPath: "docs/OTHER.md",
            },
          ],
          root,
        ),
      ).toHaveLength(1);
      expect(
        findProblems(
          [{ url: `${REPO_URL}#readme`, repoPath: "README.md" }],
          root,
        ),
      ).toHaveLength(1);
      expect(
        findProblems(
          [
            {
              url: "https://github.com/feel-flow/other",
              repoPath: "README.md",
            },
          ],
          root,
        ),
      ).toHaveLength(1);
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
