/**
 * Pure utility functions for the MCP server.
 * Extracted for testability — no side effects, no file I/O.
 */
import { SectionIndexEntry, Glossary } from './types.js';

/** Split markdown into level-2 heading sections. */
export const splitSections = (markdown: string): SectionIndexEntry[] => {
  const lines = markdown.split(/\r?\n/);
  const sections: SectionIndexEntry[] = [];
  let current: { title: string; buf: string[] } = { title: '', buf: [] };
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current.title || current.buf.length) sections.push({ file: '', title: current.title, content: current.buf.join('\n') });
      current = { title: line.slice(3).trim(), buf: [] };
    } else current.buf.push(line);
  }
  if (current.title || current.buf.length) sections.push({ file: '', title: current.title, content: current.buf.join('\n') });
  return sections;
};

/** Parse a YAML-like scalar value. */
export const parseScalar = (val: string): unknown => {
  const t = val.trim();
  if (t === '[]') return [];
  if (/^\[.*\]$/.test(t)) return t.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
  if (/^(true|false)$/.test(t)) return t === 'true';
  if (/^[0-9]+$/.test(t)) return Number(t);
  return t;
};

/** Parse YAML-ish front matter from a markdown string. */
export const parseFrontMatter = (raw: string): { meta: Record<string, unknown>; body: string } => {
  const FRONT = '---';
  if (!raw.startsWith(FRONT)) return { meta: {}, body: raw };
  const lines = raw.split(/\r?\n/);
  let i = 1; const metaLines: string[] = [];
  while (i < lines.length && lines[i] !== FRONT) { metaLines.push(lines[i]); i++; }
  if (i === lines.length) return { meta: {}, body: raw };
  const body = lines.slice(i + 1).join('\n');
  const meta: Record<string, unknown> = {};
  let current: string | null = null;
  for (const l of metaLines) {
    if (!l.trim()) continue;
    const m = l.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (m) {
      current = m[1];
      const v = m[2];
      meta[current] = (v === '' || v === '>-') ? '' : parseScalar(v);
    } else if (/^\s+-\s+/.test(l) && current) {
      const arr = Array.isArray(meta[current]) ? [...(meta[current] as unknown[])] : [];
      arr.push(l.replace(/^\s+-\s+/, '').trim());
      meta[current] = arr;
    }
  }
  return { meta, body };
};

/** Build a glossary map from GLOSSARY.md content. */
export const buildGlossary = (md: string): Glossary => {
  const res: Glossary = {};
  const lines = md.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^[-*]\s+([^:]+):\s*(.+)$/); if (m) res[m[1].trim()] = m[2].trim();
  }
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i]; const hm = h.match(/^###\s+(.+?)\s*$/); if (!hm) continue;
    const raw = hm[1].trim(); const term = raw.replace(/\s*\(.+\)\s*$/, '').trim();
    let j = i + 1; const buf: string[] = [];
    while (j < lines.length && lines[j].trim() === '') j++;
    while (j < lines.length) { const l = lines[j]; if (/^#{1,6}\s/.test(l) || /^---+$/.test(l) || /^\|/.test(l) || !l.trim()) break; buf.push(l.trim()); j++; }
    if (term && buf.length && !res[term]) res[term] = buf.join(' ');
  }
  return res;
};
