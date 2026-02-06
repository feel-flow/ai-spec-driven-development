#!/usr/bin/env node
/**
 * ペーパーバック本文PDF生成スクリプト
 *
 * KDPペーパーバック用の本文PDFを生成する。
 *
 * 処理の流れ:
 * 1. Markdownファイルを結合（章番号付与）
 * 2. Pandoc + weasyprint でPDFを生成（ペーパーバック用CSS適用）
 * 3. 一時ファイルをクリーンアップ
 *
 * 使い方:
 *   node build-paperback-pdf.js
 *
 * 依存:
 *   - Pandoc
 *   - weasyprint
 */

const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const bookConfig = require('./book-config');

const baseDir = __dirname;
const outputFileName = `${bookConfig.metadata.title}_paperback.pdf`;
const combinedMdPath = path.join(baseDir, 'combined-paperback.md');
const paperbackCssPath = path.join(baseDir, 'paperback-style.css');

/**
 * ペーパーバック用CSSを生成
 */
function createPaperbackCss() {
  // KDPペーパーバック用設定
  // トリムサイズ: 5.83 x 8.27 インチ（148 x 210 mm = A5）
  // KDP要件: 内側0.5インチ、外側0.25インチ以上（151-300ページ）
  // 安全マージンを追加: 内側0.875インチ、外側0.625インチ
  const css = `
@page {
  size: 5.83in 8.27in;
  margin: 0.625in 0.625in 0.625in 0.75in; /* 上 右 下 左（ノド側） */

  @bottom-center {
    content: counter(page);
    font-size: 10pt;
    color: #666;
  }
}

@page :first {
  @bottom-center {
    content: none;
  }
}

body {
  font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif;
  font-size: 9.5pt;
  line-height: 1.8;
  color: #333;
  text-align: left;
  orphans: 2;
  widows: 2;
}

h1 {
  font-size: 17pt;
  font-weight: bold;
  margin-top: 2em;
  margin-bottom: 1em;
  page-break-before: always;
  page-break-after: avoid;
  border-bottom: 2px solid #3182CE;
  padding-bottom: 0.3em;
  text-align: left;
}

h1:first-of-type {
  page-break-before: avoid;
}

h2 {
  font-size: 13pt;
  font-weight: bold;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  page-break-after: avoid;
  color: #1a365d;
  text-align: left;
}

h3 {
  font-size: 11pt;
  font-weight: bold;
  margin-top: 1.2em;
  margin-bottom: 0.6em;
  page-break-after: avoid;
  text-align: left;
}

p {
  margin: 0.8em 0;
  text-indent: 1em;
}

p:first-child,
h1 + p,
h2 + p,
h3 + p,
blockquote + p,
pre + p,
ul + p,
ol + p {
  text-indent: 0;
}

blockquote {
  margin: 1em 0;
  padding: 0.8em 1em;
  background-color: #f7fafc;
  border-left: 4px solid #3182CE;
  font-size: 10pt;
}

pre, code {
  font-family: "SF Mono", "Monaco", "Inconsolata", "Fira Mono", monospace;
  font-size: 7.5pt;
}

/* タイトル・ラベル直後のコードブロックは間隔を詰める */
p + pre, p + div.sourceCode,
h2 + pre, h2 + div.sourceCode,
h3 + pre, h3 + div.sourceCode {
  margin-top: 0.2em;
}

pre {
  background-color: #1a202c;
  color: #f1f5f9;
  padding: 0.8em;
  margin: 0.8em 0;
  line-height: 1.3;
  border-radius: 4px;
  page-break-inside: avoid;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* シンタックスハイライト — 印刷向けに明るさを調整 */
code span.fu { color: #d8a0ff !important; } /* 関数名：明るい紫 */
code span.kw { color: #7cc4ff !important; } /* キーワード：明るい青 */
code span.st { color: #98d9a0 !important; } /* 文字列：明るい緑 */
code span.co { color: #8899aa !important; } /* コメント：灰色（やや控えめ） */
code span.dt { color: #7cc4ff !important; } /* データ型：明るい青 */
code span.dv { color: #f5a97f !important; } /* 数値：明るいオレンジ */
code span.at { color: #7cc4ff !important; } /* 属性：明るい青 */
code span.ss { color: #f5c97f !important; } /* セクション：明るいゴールド */
code span.sc { color: #f5a97f !important; } /* 特殊文字：明るいオレンジ */
code span.va { color: #f1f5f9 !important; } /* 変数：ベース白 */
code span.cf { color: #7cc4ff !important; } /* 制御フロー：明るい青 */
code span.op { color: #f1f5f9 !important; } /* 演算子：ベース白 */
code span.bu { color: #7cc4ff !important; } /* 組み込み：明るい青 */
code span.ot { color: #98d9a0 !important; } /* その他：明るい緑 */

code {
  background-color: #edf2f7;
  padding: 0.1em 0.3em;
  border-radius: 3px;
}

pre code {
  background-color: transparent;
  padding: 0;
}

img {
  max-width: 100%;
  max-height: 90vh;
  width: auto;
  height: auto;
  display: block;
  margin: 0.5em auto;
  page-break-inside: avoid;
  object-fit: contain;
}

table {
  max-width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 9pt;
  page-break-inside: avoid;
  table-layout: fixed;
}

th, td {
  border: 1px solid #cbd5e0;
  padding: 0.4em;
  text-align: left;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

th {
  background-color: #edf2f7;
  font-weight: bold;
}

ul, ol {
  margin: 0.5em 0;
  padding-left: 2em;
}

li {
  margin: 0.1em 0;
  line-height: 1.5;
}

hr {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 2em 0;
}

/* 強調 */
strong {
  font-weight: bold;
  color: #1a365d;
}

em {
  font-style: italic;
}

/* 脚注 */
.footnote {
  font-size: 9pt;
  color: #666;
}

/* ページ区切り */
.page-break {
  page-break-before: always;
}

/* 部（Part）の扉ページ */
.part-divider {
  page-break-before: always;
}

/* コラムボックス */
.column-box {
  background-color: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 1em;
  margin: 1em 0;
  page-break-inside: avoid;
}

/* 比較ボックス */
.comparison-box {
  margin: 1em 0;
  page-break-inside: avoid;
}

.comparison-before,
.comparison-after {
  padding: 0.8em;
  margin: 0.5em 0;
  border-radius: 4px;
}

.comparison-before {
  background-color: #fff5f5;
  border-left: 4px solid #e53e3e;
}

.comparison-after {
  background-color: #f0fff4;
  border-left: 4px solid #38a169;
}

.comparison-result {
  background-color: #ebf8ff;
  border-left: 4px solid #3182ce;
  padding: 0.8em;
  margin: 0.5em 0;
  border-radius: 4px;
}

/* 茶話コーナー */
.break-corner {
  background-color: #fffaf0;
  border: 2px solid #DD6B20;
  border-radius: 8px;
  padding: 1em;
  margin: 1.5em 0;
  page-break-inside: avoid;
}

/* チェックリスト */
.checklist-item {
  font-size: 8.5pt;
  margin: 0.4em 0;
  padding-left: 1.5em;
  text-indent: -1.5em;
}

/* 目次（Table of Contents） */
nav#TOC {
  page-break-after: always;
  margin-bottom: 2em;
}

nav#TOC > ul {
  list-style: none;
  padding-left: 0;
}

nav#TOC ul ul {
  padding-left: 1.5em;
  list-style: none;
}

nav#TOC li {
  margin: 0.4em 0;
  line-height: 1.6;
}

nav#TOC a {
  text-decoration: none;
  color: #333;
}

nav#TOC a::after {
  content: leader('.') target-counter(attr(href), page);
  float: right;
}

nav#TOC > ul > li > a {
  font-weight: bold;
  font-size: 12pt;
}
`;

  fs.writeFileSync(paperbackCssPath, css, 'utf8');
  console.log('  ✓ ペーパーバック用CSSを生成');
}

/**
 * Markdownファイルを結合して章番号を付与
 */
function combineMarkdownFiles() {
  // _metadata.md と 00_toc.md を除外
  const files = bookConfig.files.filter(f => f !== '_metadata.md' && f !== '00_toc.md');
  let combined = '';
  let currentPart = null;

  for (const file of files) {
    // 新しい部（Part）の最初のファイルを検知して改ページを挿入
    const partMatch = file.match(/^(part\d+)_/);
    if (partMatch && partMatch[1] !== currentPart) {
      currentPart = partMatch[1];
      combined += '<div class="part-divider"></div>\n\n';
    }
    const filePath = path.join(baseDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  警告: ファイルが見つかりません: ${file}`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // 画像パスの修正
    // ../images/ → images/（パート内ファイル用）- 先に長いパターンを置換
    // ./images/ → images/（ルートファイル用）
    content = content.replace(/\.\.\/images\//g, 'images/');
    content = content.replace(/\.\/images\//g, 'images/');

    // Pandoc属性構文を除去（weasyprintでは解釈されずそのまま表示されるため）
    // 例: # はじめに {.unnumbered} → # はじめに
    content = content.replace(/\s*\{\.unnumbered\}/g, '');

    // ペーパーバック用リンク変換（印刷版ではURLクリック不可）
    // ページ内リンク: [テキスト](#anchor) → テキスト
    content = content.replace(/\[([^\]]+)\]\(#[^)]+\)/g, '$1');
    // 外部リンク: [テキスト](https://...) → テキスト（URL）
    content = content.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1（$2）');

    // GFMタスクリストをHTML段落に変換（印刷版ではリスト記号・チェックボックス要素は不適切）
    // コードブロック内は変換しない（Markdownの例示がそのまま表示されるように）
    // 行単位でコードブロック内外を判定する安全な方式
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeFence = '';
    for (let i = 0; i < lines.length; i++) {
      const fenceMatch = lines[i].match(/^(`{3,})/);
      if (fenceMatch) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeFence = fenceMatch[1];
        } else if (lines[i].startsWith(codeFence) && lines[i].trim() === codeFence) {
          inCodeBlock = false;
          codeFence = '';
        }
        continue;
      }
      if (!inCodeBlock) {
        lines[i] = lines[i].replace(/^(\s*)- \[ \] (.+)$/, '<p class="checklist-item">□　$2</p>');
        lines[i] = lines[i].replace(/^(\s*)- \[x\] (.+)$/, '<p class="checklist-item">☑　$2</p>');
      }
    }
    content = lines.join('\n');

    combined += content + '\n\n';
  }

  fs.writeFileSync(combinedMdPath, combined, 'utf8');
  console.log(`  ✓ ${files.length}ファイルを結合`);
}

/**
 * 一時ファイルをクリーンアップ
 */
function cleanupTempFiles() {
  if (fs.existsSync(combinedMdPath)) {
    fs.unlinkSync(combinedMdPath);
  }
  if (fs.existsSync(paperbackCssPath)) {
    fs.unlinkSync(paperbackCssPath);
  }
}

/**
 * Pandocのインストール確認
 */
function checkPandocInstalled() {
  const result = spawnSync('pandoc', ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

/**
 * weasyprintのインストール確認
 */
function checkWeasyprintInstalled() {
  const result = spawnSync('weasyprint', ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

/**
 * Pandoc + weasyprint でPDFを生成
 */
function generatePdf() {
  return new Promise((resolve, reject) => {
    const args = [
      combinedMdPath,
      '-o', outputFileName,
      '--pdf-engine=weasyprint',
      `--css=${paperbackCssPath}`,
      '-f', 'gfm',
      '--syntax-highlighting=breezedark',
      '--toc',
      '--toc-depth=2',
      '--metadata', `title=${bookConfig.metadata.title}`
    ];

    console.log('  Pandocコマンドを実行中...');

    const pandoc = spawn('pandoc', args, {
      cwd: baseDir,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stderr = '';

    pandoc.stderr.on('data', (data) => {
      stderr += data.toString();
      // ERRORのみ表示
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('ERROR:')) {
          process.stderr.write('  ' + line + '\n');
        }
      }
    });

    pandoc.on('error', (error) => {
      reject(new Error(`Pandocの実行に失敗しました: ${error.message}`));
    });

    pandoc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Pandocがエラーで終了しました (exit code: ${code})\n${stderr}`));
      }
    });
  });
}

/**
 * メイン処理
 */
async function main() {
  console.log('='.repeat(60));
  console.log('ペーパーバック本文PDF生成スクリプト');
  console.log('='.repeat(60));
  console.log('');
  console.log('設定:');
  console.log('  トリムサイズ: 5.83 x 8.27 インチ（A5）');
  console.log('  マージン: 上下外 0.625インチ、内側（ノド）0.875インチ');
  console.log('');

  try {
    // 1. 依存ツールの確認
    console.log('[1/5] 依存ツールの確認...');
    if (!checkPandocInstalled()) {
      throw new Error('Pandocがインストールされていません。\n  macOS: brew install pandoc');
    }
    if (!checkWeasyprintInstalled()) {
      throw new Error('weasyprintがインストールされていません。\n  pip install weasyprint');
    }
    console.log('  ✓ Pandoc, weasyprint が見つかりました');
    console.log('');

    // 2. ペーパーバック用CSSを生成
    console.log('[2/5] ペーパーバック用CSSを生成...');
    createPaperbackCss();
    console.log('');

    // 3. Markdownを結合
    console.log('[3/5] Markdownファイルを結合...');
    combineMarkdownFiles();
    console.log('');

    // 4. PDF生成
    console.log('[4/5] PDFを生成中...');
    await generatePdf();
    console.log('  ✓ PDF生成が完了しました');
    console.log('');

    // 5. クリーンアップ
    console.log('[5/5] 一時ファイルをクリーンアップ...');
    cleanupTempFiles();
    console.log('  ✓ クリーンアップ完了');
    console.log('');

    // 結果表示
    const outputPath = path.join(baseDir, outputFileName);
    const stats = fs.statSync(outputPath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log('='.repeat(60));
    console.log('生成完了!');
    console.log('='.repeat(60));
    console.log(`ファイル: ${outputFileName}`);
    console.log(`サイズ: ${fileSizeMB} MB`);
    console.log('');
    console.log('KDPにアップロード:');
    console.log('  1. 表紙: images/cover_paperback.pdf');
    console.log(`  2. 本文: ${outputFileName}`);
    console.log('');

  } catch (error) {
    // エラー時もクリーンアップを実行
    cleanupTempFiles();

    console.error('');
    console.error('='.repeat(60));
    console.error('エラーが発生しました');
    console.error('='.repeat(60));
    console.error(error.message);
    console.error('');
    process.exit(1);
  }
}

// スクリプト実行
main();
