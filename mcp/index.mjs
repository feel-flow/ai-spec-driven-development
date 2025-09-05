import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import url from "url";

// Resolve repo root relative to this file
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const docsRoot = path.join(repoRoot, "docs");

// Utilities
function walkMarkdownFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walkMarkdownFiles(full));
    else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) files.push(full);
  }
  return files;
}

function loadFile(filePath) {
  try { return fs.readFileSync(filePath, "utf-8"); } catch { return ""; }
}

function splitSections(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = [];
  let current = { title: "", content: [] };
  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current.title || current.content.length) sections.push({ ...current, content: current.content.join("\n") });
      current = { title: line.slice(3).trim(), content: [] };
    } else {
      current.content.push(line);
    }
  }
  if (current.title || current.content.length) sections.push({ ...current, content: current.content.join("\n") });
  return sections;
}

function basicSearchIndex(files) {
  const index = [];
  for (const f of files) {
    const rel = path.relative(repoRoot, f);
    const text = loadFile(f);
    const sections = splitSections(text);
    if (sections.length === 0) {
      index.push({ file: rel, title: path.basename(f), content: text });
    } else {
      for (const s of sections) index.push({ file: rel, title: s.title || path.basename(f), content: s.content });
    }
  }
  return index;
}

// Build index
const mdFiles = [
  path.join(repoRoot, "README.md"),
  path.join(repoRoot, "ai_spec_driven_development.md"),
  ...walkMarkdownFiles(docsRoot)
].filter(f => fs.existsSync(f));

const searchIndex = basicSearchIndex(mdFiles);

// Glossary
function buildGlossary(markdown) {
  const result = {};
  const lines = markdown.split(/\r?\n/);

  // 1) Bullet list style: "- Term: definition"
  for (const line of lines) {
    const m = line.match(/^[-*]\s+([^:]+):\s*(.+)$/);
    if (m) {
      const term = m[1].trim();
      const def = m[2].trim();
      if (term && def) result[term] = def;
    }
  }

  // 2) Heading style: "### Term (Optional...)" then next non-empty line(s) as definition
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i];
    const hm = h.match(/^###\s+(.+?)\s*$/);
    if (!hm) continue;
    const raw = hm[1].trim();
    // Extract term before a parenthetical or trailing explanation
    const term = raw.replace(/\s*\(.+\)\s*$/, "").trim();
    // Collect the next paragraph (first non-empty line), stop at next heading or table separator
    let j = i + 1;
    let paragraph = [];
    while (j < lines.length && lines[j].trim() === "") j++;
    while (j < lines.length) {
      const l = lines[j];
      if (/^#{1,6}\s/.test(l) || /^---+$/.test(l)) break; // next heading or hr
      if (/^\|/.test(l)) break; // likely table start
      if (l.trim() === "") break; // end of paragraph
      paragraph.push(l.trim());
      j++;
    }
    const def = paragraph.join(" ").trim();
    if (term && def && !result[term]) result[term] = def;
  }

  // 3) Abbreviation table under a section heading like "## 略語一覧"
  let inAbbrev = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^##\s+.*略語一覧/.test(l)) { inAbbrev = true; i++; continue; }
    if (inAbbrev) {
      if (/^##\s/.test(l)) { inAbbrev = false; continue; }
      if (/^\|\s*-+\s*\|/.test(l)) continue; // separator line
      const m = l.match(/^\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/);
      if (m) {
        const term = m[1].trim();
        const def = m[3].trim();
        if (term && def && !result[term]) result[term] = def;
      }
    }
  }

  return result;
}

let glossary = {};
const glossaryPath = path.join(docsRoot, "06-reference", "GLOSSARY.md");
if (fs.existsSync(glossaryPath)) {
  const g = loadFile(glossaryPath);
  glossary = buildGlossary(g);
}

// MCP server (high-level)
const mcp = new McpServer({ name: "ai-spec-driven-development-mcp", version: "0.1.0" });

// Register fixed resources for each markdown file
for (const f of mdFiles) {
  const uri = `file://${path.resolve(f)}`;
  mcp.resource(path.relative(repoRoot, f), uri, { mimeType: "text/markdown", description: "AI spec-driven development documentation" }, async (uriObj) => {
    const p = url.fileURLToPath(uriObj);
    if (!p.startsWith(repoRoot)) throw new Error("Access denied");
    const text = loadFile(p);
    return { contents: [{ uri: uriObj.toString(), mimeType: "text/markdown", text }] };
  });
}

// Register virtual search index resource
mcp.resource("search-index", "mcp://ai-spec-driven-development/index", { mimeType: "application/json", description: "Lightweight search index of docs" }, async (uriObj) => {
  return { contents: [{ uri: uriObj.toString(), mimeType: "application/json", text: JSON.stringify(searchIndex, null, 2) }] };
});

// Tools
mcp.registerTool("search", {
  title: "Search docs",
  description: "Keyword search over AI spec-driven development docs. Returns top matches with file and excerpt.",
  inputSchema: {
    query: z.string().min(1).describe("Search query"),
    limit: z.number().int().min(1).max(20).default(5).describe("Max results")
  }
}, async ({ query, limit }) => {
  const q = query.toLowerCase();
  const scored = searchIndex.map(item => {
    const iTitle = item.title?.toLowerCase() || "";
    const iContent = item.content?.toLowerCase() || "";
    const score = (iTitle.includes(q) ? 3 : 0) + (iContent.includes(q) ? 1 : 0);
    const pos = iContent.indexOf(q);
    const excerpt = pos >= 0 ? item.content.slice(Math.max(0, pos - 80), pos + q.length + 80) : "";
    return { file: item.file, title: item.title, score, excerpt };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  return {
    content: [{ type: "text", text: `Found ${scored.length} results for "${query}"` }],
    structuredContent: { results: scored }
  };
});

mcp.registerTool("extract_section", {
  title: "Extract section",
  description: "Extract a level-2 heading section from a markdown file.",
  inputSchema: {
    file: z.string().describe("Relative path like docs/02-design/API.md"),
    heading: z.string().describe("Exact heading text after '## '")
  }
}, async ({ file, heading }) => {
  const abs = path.join(repoRoot, file);
  if (!abs.startsWith(repoRoot) || !fs.existsSync(abs)) {
    return { content: [{ type: "text", text: "File not found" }], isError: true };
  }
  const sections = splitSections(loadFile(abs));
  const found = sections.find(s => s.title.trim() === heading.trim());
  if (!found) {
    return { content: [{ type: "text", text: "Section not found" }], structuredContent: { section: null } };
  }
  return {
    content: [{ type: "text", text: `Section: ${found.title}\n\n${found.content.slice(0, 300)}${found.content.length > 300 ? "\n..." : ""}` }],
    structuredContent: { section: { title: found.title, content: found.content } }
  };
});

mcp.registerTool("glossary_lookup", {
  title: "Glossary lookup",
  description: "Lookup a term in the glossary.",
  inputSchema: { term: z.string().describe("Term to lookup") }
}, async ({ term }) => {
  const key = Object.keys(glossary).find(k => k.toLowerCase() === term.toLowerCase());
  if (!key) return { content: [{ type: "text", text: `No definition for: ${term}` }], structuredContent: { definition: null } };
  return { content: [{ type: "text", text: `${key}: ${glossary[key]}` }], structuredContent: { term: key, definition: glossary[key] } };
});

mcp.registerTool("list_docs", {
  title: "List docs",
  description: "List repository documentation markdown files (relative paths).",
  inputSchema: { prefix: z.string().optional().describe("Filter by prefix, e.g., docs/02-design/") }
}, async ({ prefix }) => {
  const rels = mdFiles.map(f => path.relative(repoRoot, f));
  const filtered = prefix ? rels.filter(r => r.startsWith(prefix)) : rels;
  return { content: [{ type: "text", text: `${filtered.length} files` }], structuredContent: { files: filtered } };
});

// Prompts
mcp.prompt("adr", "Architecture Decision Record prompt", async () => ({
  description: "Architecture Decision Record prompt",
  messages: [
    { role: "system", content: "You are an AI engineer recording an Architecture Decision (ADR). Follow the repository's docs and constraints. Fill in Context, Decision, Consequences." },
    { role: "user", content: "Create an ADR draft referencing docs/06-reference/DECISIONS.md and related design docs." }
  ],
  metadata: { tags: ["adr", "architecture"] }
}));

mcp.prompt("design_review", "Review a design against constraints and patterns", async () => ({
  description: "Review a design against constraints and patterns",
  messages: [
    { role: "system", content: "You review design proposals. Cross-check with constraints, patterns, and testing strategy." },
    { role: "user", content: "Given a proposal, identify risks, violations, and suggest concrete improvements with references to docs." }
  ],
  metadata: { tags: ["review", "design"] }
}));

// --check mode: validate and exit before connecting
if (process.argv.includes("--check")) {
  console.error(`Indexed ${mdFiles.length} markdown files, ${searchIndex.length} sections. Glossary terms: ${Object.keys(glossary).length}`);
  process.exit(0);
}

// Start server over stdio
const transport = new StdioServerTransport();
await mcp.connect(transport);
console.error("ai-spec-driven-development MCP server started (stdio)");
// (Removed legacy server API code)
