#!/usr/bin/env node
/**
 * validate-docs.mjs
 * AI仕様駆動開発のコア7文書の存在を検証するスクリプト
 *
 * Usage: node scripts/validate-docs.mjs [docs-dir]
 *   docs-dir: 検証対象のdocsディレクトリ（デフォルト: ./docs-template）
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const DOCS_DIR = process.argv[2] || 'docs-template';
const MINIMUM_LINES = 10;
const TEMPLATE_DOCS_DIR_NAME = 'docs-template';

// コア7文書の定義（最小構成 — フォルダ名の揺れに対応）
const CORE_DOCS = [
  {
    name: 'MASTER.md',
    paths: ['MASTER.md'],
    required: true,
    description: '中央管理ハブ',
  },
  {
    name: 'PROJECT.md',
    paths: ['01-context/PROJECT.md', '01-business/PROJECT.md'],
    required: true,
    description: 'ビジョン・要件',
  },
  {
    name: 'ARCHITECTURE.md',
    paths: ['02-design/ARCHITECTURE.md'],
    required: true,
    description: 'システム設計',
  },
  {
    name: 'DOMAIN.md',
    paths: ['02-design/DOMAIN.md', '01-context/DOMAIN.md', '01-business/DOMAIN.md'],
    required: true,
    description: 'ビジネスロジック',
  },
  {
    name: 'PATTERNS.md',
    paths: ['03-implementation/PATTERNS.md'],
    required: true,
    description: '実装パターン',
  },
  {
    name: 'TESTING.md',
    paths: ['04-quality/TESTING.md', '07-quality/TESTING.md'],
    required: true,
    description: 'テスト戦略',
  },
  {
    name: 'DEPLOYMENT.md',
    paths: ['05-operations/DEPLOYMENT.md'],
    required: true,
    description: '運用手順',
  },
];

// Frontmatter バリデーション定数
const REQUIRED_FRONTMATTER_FIELDS = ['title', 'version', 'status', 'owner', 'created', 'updated'];
const VALID_STATUS_VALUES = ['draft', 'review', 'approved'];
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

/** /init-docs が推測で埋めず残す未確定値（Issue #507） */
const DEFERRED_BRACKET_INNERS = new Set([
  '金額',
  'SLA値',
  'x.x.x',
  'x.x',
  'YYYY-MM-DD / URL',
  '注意点',
  'Library',
]);

/**
 * Frontmatter を解析する（外部ライブラリ不要の簡易版パーサー）
 * mcp/src/utils.ts parseFrontMatter を参考にした簡略化実装。
 * 差異: null返却（utils.tsは空meta返却）、trim付きデリミタ判定、YAML配列非対応、引用符除去あり。
 * @param {string} content - ファイル全文
 * @returns {{ meta: Record<string, string>, body: string, warnings: string[] } | null}
 *   Frontmatter未検出時または閉じデリミタ欠落時は null
 */
function parseFrontMatter(content) {
  const DELIM = '---';
  const lines = content.split(/\r?\n/);
  if (lines[0].trim() !== DELIM) return null;

  let i = 1;
  const metaLines = [];
  while (i < lines.length && lines[i].trim() !== DELIM) {
    metaLines.push(lines[i]);
    i++;
  }
  if (i === lines.length) return null; // 閉じデリミタなし

  const meta = {};
  const warnings = [];
  for (const line of metaLines) {
    if (!line.trim()) continue; // 空行はスキップ
    const match = line.match(/^(\w+)\s*:\s*(.+)$/);
    if (match) {
      // 先頭/末尾の引用符を個別に除去
      meta[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
    } else {
      warnings.push(`パース不能な行: "${line.trim()}"`);
    }
  }
  return { meta, body: lines.slice(i + 1).join('\n'), warnings };
}

/**
 * Frontmatter のバリデーション
 * @param {Record<string, string>} meta - パース済み Frontmatter
 * @param {string} fileName - ファイル名（エラーメッセージ用）
 * @returns {{ level: 'error', message: string }[]} バリデーションエラーの配列（問題なしの場合は空配列）
 */
function validateFrontMatter(meta, fileName) {
  const errors = [];

  // 必須フィールド存在チェック（in 演算子でプロパティ存在を正確に判定）
  for (const field of REQUIRED_FRONTMATTER_FIELDS) {
    if (!(field in meta)) {
      errors.push({ level: 'error', message: `${fileName}: 必須フィールド "${field}" が未設定です` });
    }
  }

  // status 値検証
  if (meta.status && !VALID_STATUS_VALUES.includes(meta.status)) {
    errors.push({
      level: 'error',
      message: `${fileName}: status "${meta.status}" は無効です (有効値: ${VALID_STATUS_VALUES.join(', ')})`,
    });
  }

  // version 形式検証（SemVer）
  if (meta.version && !SEMVER_PATTERN.test(meta.version)) {
    errors.push({
      level: 'error',
      message: `${fileName}: version "${meta.version}" はSemVer形式ではありません (例: 1.0.0)`,
    });
  }

  return errors;
}

/**
 * 閉じたコードフェンス・閉じた HTML コメント・同一行のインラインコードを空白化し、
 * 閉じ忘れは除外区間にしない（閉じマーカーが無ければマッチしない）。
 * @param {string} content
 * @returns {string}
 */
export function maskExemptSpans(content) {
  let masked = content.replace(/```[\s\S]*?```/g, (block) => ' '.repeat(block.length));
  masked = masked.replace(/<!--[\s\S]*?-->/g, (block) => ' '.repeat(block.length));
  masked = masked.replace(/`[^`\n]+`/g, (span) => ' '.repeat(span.length));
  return masked;
}

function isDeferredBracketInner(inner) {
  if (DEFERRED_BRACKET_INNERS.has(inner)) return true;
  if (/^x(\.x)+$/.test(inner)) return true;
  if (inner.includes('金額') || inner.includes('SLA')) return true;
  return false;
}

function isTaskListMarker(inner) {
  return inner === ' ' || inner === 'x' || inner === 'X';
}

function isChangelogVersion(inner) {
  return /^\d+\.\d+\.\d+$/.test(inner);
}

function looksLikeCodeInner(inner) {
  return /[=,"']/.test(inner);
}

/**
 * マスク済み本文から角括弧プレースホルダーを拾う。
 * Markdown リンク・タスクリスト・Changelog 版番号・コード風の中身は除外する。
 * @param {string} masked
 * @returns {{ raw: string, inner: string, deferred: boolean }[]}
 */
export function findBracketPlaceholders(masked) {
  const hits = [];
  const pattern = /\[([^\[\]]+)\]/g;
  let match = pattern.exec(masked);
  while (match !== null) {
    const inner = match[1];
    const after = masked[match.index + match[0].length];
    if (after !== '(' && !isTaskListMarker(inner) && !isChangelogVersion(inner) && !looksLikeCodeInner(inner)) {
      hits.push({ raw: match[0], inner, deferred: isDeferredBracketInner(inner) });
    }
    match = pattern.exec(masked);
  }
  return hits;
}

export function isTemplateDocsDir(docsDir) {
  return path.basename(path.resolve(docsDir)) === TEMPLATE_DOCS_DIR_NAME;
}

// MASTER.md 必須セクション
const MASTER_REQUIRED_SECTIONS = [
  { pattern: /プロジェクト|project\s*(name|識別)/i, label: 'プロジェクト識別情報' },
  { pattern: /技術スタック|tech(nology)?\s*stack|FE|BE|DB|Infra/i, label: '技術スタック要約' },
  { pattern: /ルール|rule|命名|naming|convention/i, label: '守るべきルール' },
  { pattern: /確認プロトコル|情報不足|verification|推論禁止/i, label: '情報不足時の確認プロトコル' },
  { pattern: /索引|index|リンク|ドキュメント一覧/i, label: 'ドキュメント索引' },
];

function runValidation(docsDir) {
  let exitCode = 0;
  const results = { files: [], master: [], quality: [], summary: {} };
  const templateTree = isTemplateDocsDir(docsDir);

  // --- ファイル存在チェック ---
  console.log('\n== 必須ファイル ==\n');
  let foundCount = 0;

  for (const doc of CORE_DOCS) {
    let found = null;
    for (const p of doc.paths) {
      const fullPath = path.join(docsDir, p);
      if (fs.existsSync(fullPath)) {
        found = fullPath;
        break;
      }
    }
    if (found) {
      const lines = fs.readFileSync(found, 'utf-8').split('\n').length;
      console.log(`  ✅ ${doc.name} — ${found} (${lines}行)`);
      results.files.push({ name: doc.name, status: 'ok', path: found, lines });
      foundCount++;
    } else {
      console.log(`  ❌ ${doc.name} — 未作成 (${doc.description})`);
      results.files.push({ name: doc.name, status: 'missing' });
      if (doc.required) exitCode = 1;
    }
  }

  // --- MASTER.md セクションチェック ---
  const masterPath = path.join(docsDir, 'MASTER.md');
  if (fs.existsSync(masterPath)) {
    const masterContent = fs.readFileSync(masterPath, 'utf-8');
    console.log('\n== MASTER.md セクション ==\n');

    for (const section of MASTER_REQUIRED_SECTIONS) {
      if (section.pattern.test(masterContent)) {
        console.log(`  ✅ ${section.label}`);
        results.master.push({ label: section.label, status: 'ok' });
      } else {
        console.log(`  ❌ ${section.label} — 見つかりません`);
        results.master.push({ label: section.label, status: 'missing' });
      }
    }
  }

  // --- 内容品質チェック ---
  console.log('\n== 内容品質 ==\n');
  let qualityIssues = 0;

  for (const file of results.files) {
    if (file.status !== 'ok') continue;
    const content = fs.readFileSync(file.path, 'utf-8');
    const scanned = maskExemptSpans(content);

    // 行数チェック
    if (file.lines < MINIMUM_LINES) {
      console.log(`  ⚠️  ${file.name} — 内容が少ない (${file.lines}行, 最低${MINIMUM_LINES}行推奨)`);
      qualityIssues++;
    }

    // プレースホルダー残存チェック（{{…}} / 角括弧 / TODO・TBD）
    const mustache = scanned.match(/\{\{[^}]+\}\}/g);
    const brackets = findBracketPlaceholders(scanned);
    const todos = scanned.match(/\bTODO\b|\bTBD\b/gi);
    if (mustache) {
      console.log(`  ⚠️  ${file.name} — プレースホルダー残存 (${mustache.length}箇所)`);
      qualityIssues++;
    }
    if (brackets.length > 0) {
      const samples = [...new Set(brackets.map((hit) => hit.raw))].slice(0, 3).join(' ');
      if (templateTree) {
        console.log(
          `  ⚠️  ${file.name} — 未確定値プレースホルダー残存 (${brackets.length}箇所: ${samples})`,
        );
      } else {
        const leftover = brackets.filter((hit) => !hit.deferred);
        const deferred = brackets.filter((hit) => hit.deferred);
        if (leftover.length > 0) {
          const leftoverSamples = [...new Set(leftover.map((hit) => hit.raw))].slice(0, 3).join(' ');
          console.log(
            `  ⚠️  ${file.name} — プレースホルダー残存 (角括弧 ${leftover.length}箇所: ${leftoverSamples})`,
          );
        }
        if (deferred.length > 0) {
          const deferredSamples = [...new Set(deferred.map((hit) => hit.raw))].slice(0, 3).join(' ');
          console.log(
            `  ⚠️  ${file.name} — 未確定値プレースホルダー残存 (${deferred.length}箇所: ${deferredSamples})`,
          );
        }
      }
      qualityIssues++;
    }
    if (todos) {
      console.log(`  ⚠️  ${file.name} — TODO/TBD残存 (${todos.length}箇所)`);
      qualityIssues++;
    }

    // 見出し構造チェック
    const headings = content.match(/^## .+/gm);
    if (!headings || headings.length === 0) {
      console.log(`  ⚠️  ${file.name} — ## レベルの見出しがありません`);
      qualityIssues++;
    }
  }

  if (qualityIssues === 0) {
    console.log('  ✅ 品質上の問題は見つかりませんでした');
  }

  // --- Frontmatter バリデーション ---
  console.log('\n== Frontmatter ==\n');
  let frontmatterIssues = 0;

  for (const file of results.files) {
    if (file.status !== 'ok') continue;
    const content = fs.readFileSync(file.path, 'utf-8');
    const parsed = parseFrontMatter(content);

    if (!parsed) {
      console.log(`  ❌ ${file.name} — Frontmatter が見つかりません`);
      frontmatterIssues++;
      exitCode = 1;
      continue;
    }

    // パース時の警告を表示
    for (const warn of parsed.warnings) {
      console.log(`  ⚠️  ${file.name}: ${warn}`);
      frontmatterIssues++;
    }

    const errors = validateFrontMatter(parsed.meta, file.name);
    for (const err of errors) {
      console.log(`  ❌ ${err.message}`);
      frontmatterIssues++;
      exitCode = 1;
    }
  }

  if (frontmatterIssues === 0) {
    console.log('  ✅ Frontmatterに問題はありません');
  }

  // --- サマリー ---
  const total = CORE_DOCS.length;
  const score = Math.round((foundCount / total) * 100);
  console.log('\n== サマリー ==\n');
  console.log(`  必須ファイル: ${foundCount}/${total} ✅`);
  console.log(`  品質警告: ${qualityIssues}件${qualityIssues === 0 ? ' ✅' : ' ⚠️'}`);
  console.log(`  Frontmatter: ${frontmatterIssues}件${frontmatterIssues === 0 ? ' ✅' : ' ❌'}`);
  console.log(`  全体スコア: ${score}%${score === 100 ? ' — 完璧！' : score >= 70 ? ' — 良好' : ' — 改善が必要'}`);
  console.log('');

  return exitCode;
}

const invokedDirectly =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  process.exit(runValidation(DOCS_DIR));
}

export { runValidation };
