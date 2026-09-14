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

function extractYamlFences(markdown: string): string[] {
  const blocks: string[] = [];
  const fence = /```yaml\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null = fence.exec(markdown);
  while (match !== null) {
    blocks.push(match[1]);
    match = fence.exec(markdown);
  }
  return blocks;
}

describe("agent-config.yaml スニペットのキー実在 (Issue #506)", () => {
  it("実ファイルは perspectives.review 入れ子と tasks.review.cost_strategy を持ち、旧キーを持たない", () => {
    const yaml = readFileSync(AGENT_CONFIG, "utf8");
    expect(yaml).toMatch(/^ {4}perspectives:\n {6}review:/m);
    expect(yaml).toMatch(/^tasks:\n {2}review:\n {4}cost_strategy:/m);
    expect(yaml).not.toMatch(new RegExp(`^\\s*${RETIRED_PERSPECTIVES_KEY}:`, "m"));
  });

  it("docs-template の案内・スニペットに旧キーを残さず、入れ子スキーマを維持する", () => {
    const retiredHits: string[] = [];
    const missingNest: string[] = [];
    const v2TopLevelCost: string[] = [];
    for (const file of listMarkdown(TEMPLATE_ROOT)) {
      const rel = relative(REPO_ROOT, file);
      const content = readFileSync(file, "utf8");
      content.split("\n").forEach((line, index) => {
        if (line.includes(RETIRED_PERSPECTIVES_KEY)) {
          retiredHits.push(`${rel}:${index + 1}`);
        }
      });
      extractYamlFences(content).forEach((block, index) => {
        const label = `${rel} yaml#${index + 1}`;
        if (block.includes("perspectives:") && !/^ *perspectives:\n +review:/m.test(block)) {
          missingNest.push(label);
        }
        if (/^version:\s*["']2\.0["']\s*$/m.test(block) && /^cost_strategy:/m.test(block)) {
          v2TopLevelCost.push(label);
        }
      });
    }
    expect(retiredHits).toEqual([]);
    expect(missingNest).toEqual([]);
    expect(v2TopLevelCost).toEqual([]);
  });
});
