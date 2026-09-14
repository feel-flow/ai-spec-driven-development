import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(__dirname, "..");
const TEMPLATE_ROOT = join(REPO_ROOT, "docs-template");
const AGENT_CONFIG = join(REPO_ROOT, "scripts", "agent-config.yaml");

/** 実ファイル `scripts/agent-config.yaml` に存在しない旧キー（Issue #506） */
const RETIRED_PERSPECTIVES_KEY = "default_perspectives";

function listMarkdown(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listMarkdown(full));
    else if (entry.endsWith(".md")) out.push(full);
  }
  return out;
}

describe("agent-config.yaml スニペットのキー実在 (Issue #506)", () => {
  it("実ファイルは perspectives 入れ子を持ち、旧キーを持たない", () => {
    const yaml = readFileSync(AGENT_CONFIG, "utf8");
    expect(yaml).toMatch(/^ {4}perspectives:$/m);
    expect(yaml).toMatch(/^ {6}review:$/m);
    expect(yaml).not.toMatch(new RegExp(`^\\s*${RETIRED_PERSPECTIVES_KEY}:`, "m"));
  });

  it("docs-template の案内・スニペットに旧キーを残さない", () => {
    const hits: string[] = [];
    for (const file of listMarkdown(TEMPLATE_ROOT)) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, index) => {
        if (line.includes(RETIRED_PERSPECTIVES_KEY)) {
          hits.push(`${relative(REPO_ROOT, file)}:${index + 1}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });
});
