#!/usr/bin/env node
// Spec Index Builder
// Scans docs/specs/**/*.md extracting YAML front-matter and outputs dist/spec-index.json
// Validation rules:
//  - Required: specId (unique), title, status (enum), version
//  - status enum: draft|review|approved|implementing|done|deprecated
import fs from 'fs';
import path from 'path';

const SPEC_DIR = path.resolve('docs', 'specs');
const DIST_DIR = path.resolve('dist');
const OUTPUT_FILE = path.join(DIST_DIR, 'spec-index.json');
const FRONT_BOUNDARY = '---';
const STATUS_ENUM = new Set(['draft','review','approved','implementing','done','deprecated']);

/** Parse front matter (very small implementation) */
function parseFrontMatter(raw) {
  const lines = raw.split(/\r?\n/);
  if (lines[0] !== FRONT_BOUNDARY) return { meta: {}, body: raw };
  let i = 1; const metaLines = [];
  while (i < lines.length && lines[i] !== FRONT_BOUNDARY) { metaLines.push(lines[i]); i++; }
  if (i === lines.length) return { meta: {}, body: raw }; // no closing boundary
  const body = lines.slice(i+1).join('\n');
  const meta = {};
  let currentKey = null;
  for (const l of metaLines) {
    if (/^\s*$/.test(l)) continue;
    const keyMatch = l.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const val = keyMatch[2];
      if (val === '' || val === '>-' || val === '|') {
        meta[currentKey] = '';
      } else {
        meta[currentKey] = parseScalar(val);
      }
    } else if (/^\s+-\s+/.test(l) && currentKey) {
      if (!Array.isArray(meta[currentKey])) meta[currentKey] = [];
      meta[currentKey].push(l.replace(/^\s+-\s+/, '').trim());
    } else if (/^\s{2,}[A-Za-z0-9_]+:/.test(l) && currentKey) {
      // nested map naive support (owners: - github: id) not fully parsed; skip for simplicity
    }
  }
  return { meta, body };
}

function parseScalar(val) {
  const trimmed = val.trim();
  if (trimmed === '[]') return [];
  if (/^\[.*\]$/.test(trimmed)) {
    return trimmed.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
  }
  if (/^(true|false)$/.test(trimmed)) return trimmed === 'true';
  if (/^[0-9]+$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function walkMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdown(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) out.push(full);
  }
  return out;
}

function validate(spec, seenIds) {
  const errors = [];
  if (!spec.specId) errors.push('MISSING_specId');
  if (spec.specId && seenIds.has(spec.specId)) errors.push('DUPLICATE_specId');
  if (!spec.title) errors.push('MISSING_title');
  if (!spec.status) errors.push('MISSING_status');
  if (spec.status && !STATUS_ENUM.has(spec.status)) errors.push('INVALID_status');
  if (!spec.version) errors.push('MISSING_version');
  return errors;
}

function build() {
  const files = walkMarkdown(SPEC_DIR);
  const specs = []; const errors = []; const seen = new Set();
  for (const f of files) {
    const raw = fs.readFileSync(f, 'utf-8');
    const { meta, body } = parseFrontMatter(raw);
    const spec = { ...meta, file: path.relative(process.cwd(), f) };
    const specErrors = validate(spec, seen);
    if (spec.specId) seen.add(spec.specId);
    if (specErrors.length) errors.push({ file: spec.file, specId: spec.specId || null, errors: specErrors });
    specs.push({ ...spec, body });
  }
  if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR);
  const result = { generatedAt: new Date().toISOString(), count: specs.length, specs, errors };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
  const summary = `specs=${specs.length} errors=${errors.length}`;
  console.error(summary);
  if (errors.length) process.exitCode = 1;
}

build();
