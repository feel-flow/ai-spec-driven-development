#!/usr/bin/env node
/**
 * validate-docs.mjs
 * AI仕様駆動開発の7ドキュメント構造を検証するスクリプト
 *
 * Usage: node scripts/validate-docs.mjs [docs-dir]
 *   docs-dir: 検証対象のdocsディレクトリ（デフォルト: ./docs）
 */
import fs from 'fs';
import path from 'path';

const DOCS_DIR = process.argv[2] || 'docs';
const MINIMUM_LINES = 10;

// コア7ドキュメントの定義（フォルダ名の揺れに対応）
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

// MASTER.md 必須セクション
const MASTER_REQUIRED_SECTIONS = [
  { pattern: /プロジェクト|project\s*(name|識別)/i, label: 'プロジェクト識別情報' },
  { pattern: /技術スタック|tech(nology)?\s*stack|FE|BE|DB|Infra/i, label: '技術スタック要約' },
  { pattern: /ルール|rule|命名|naming|convention/i, label: '守るべきルール' },
  { pattern: /確認プロトコル|情報不足|verification|推論禁止/i, label: '情報不足時の確認プロトコル' },
  { pattern: /索引|index|リンク|ドキュメント一覧/i, label: 'ドキュメント索引' },
];

let exitCode = 0;
const results = { files: [], master: [], quality: [], summary: {} };

// --- ファイル存在チェック ---
console.log('\n== 必須ファイル ==\n');
let foundCount = 0;

for (const doc of CORE_DOCS) {
  let found = null;
  for (const p of doc.paths) {
    const fullPath = path.join(DOCS_DIR, p);
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
const masterPath = path.join(DOCS_DIR, 'MASTER.md');
if (fs.existsSync(masterPath)) {
  const masterContent = fs.readFileSync(masterPath, 'utf-8');
  console.log('\n== MASTER.md セクション ==\n');
  let sectionFound = 0;

  for (const section of MASTER_REQUIRED_SECTIONS) {
    if (section.pattern.test(masterContent)) {
      console.log(`  ✅ ${section.label}`);
      results.master.push({ label: section.label, status: 'ok' });
      sectionFound++;
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

  // 行数チェック
  if (file.lines < MINIMUM_LINES) {
    console.log(`  ⚠️  ${file.name} — 内容が少ない (${file.lines}行, 最低${MINIMUM_LINES}行推奨)`);
    qualityIssues++;
  }

  // プレースホルダー残存チェック
  const placeholders = content.match(/\{\{[^}]+\}\}/g);
  const todos = content.match(/\bTODO\b|\bTBD\b/gi);
  if (placeholders) {
    console.log(`  ⚠️  ${file.name} — プレースホルダー残存 (${placeholders.length}箇所)`);
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

// --- サマリー ---
const total = CORE_DOCS.length;
const score = Math.round((foundCount / total) * 100);
console.log('\n== サマリー ==\n');
console.log(`  必須ファイル: ${foundCount}/${total} ✅`);
console.log(`  全体スコア: ${score}%${score === 100 ? ' — 完璧！' : score >= 70 ? ' — 良好' : ' — 改善が必要'}`);
console.log('');

process.exit(exitCode);
