#!/usr/bin/env node
/**
 * PDF生成スクリプト
 *
 * 処理の流れ:
 * 1. build-pdf.js を実行して章番号付きMarkdownを生成
 * 2. 各パートの画像をルートのimagesフォルダに一時コピー
 * 3. Pandoc + weasyprint でPDFを生成
 * 4. 一時コピーした画像をクリーンアップ
 *
 * 使い方:
 *   node generate-pdf.js
 */

const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const bookConfig = require('./book-config');

const baseDir = __dirname;
const imagesDir = path.join(baseDir, 'images');
const outputFileName = `${bookConfig.metadata.title}_v${bookConfig.metadata.version}.pdf`;

// パートディレクトリのリスト
const partDirs = [
  'part1_why-ai-fails',
  'part2_context-limit',
  'part3_precision',
  'part4_inference',
  'part5_vscode',
  'part6_new-roles'
];

/**
 * 各パートの画像をルートのimagesにコピー
 * @returns {string[]} コピーしたファイル名のリスト（クリーンアップ用）
 */
function copyImagesToRoot() {
  const copiedFiles = [];

  for (const partDir of partDirs) {
    const partImagesDir = path.join(baseDir, partDir, 'images');

    if (!fs.existsSync(partImagesDir)) {
      continue;
    }

    const files = fs.readdirSync(partImagesDir);
    for (const file of files) {
      if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
        const srcPath = path.join(partImagesDir, file);
        const destPath = path.join(imagesDir, file);

        // 既存ファイルがなければコピー
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(srcPath, destPath);
          copiedFiles.push(file);
        }
      }
    }
  }

  return copiedFiles;
}

/**
 * 一時コピーした画像をクリーンアップ
 * @param {string[]} copiedFiles コピーしたファイル名のリスト
 */
function cleanupCopiedImages(copiedFiles) {
  for (const file of copiedFiles) {
    const filePath = path.join(imagesDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
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
 * build-pdf.js を実行
 */
function runBuildPdf() {
  const result = spawnSync('node', ['build-pdf.js'], {
    cwd: baseDir,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    throw new Error('build-pdf.js の実行に失敗しました');
  }
}

/**
 * Pandoc + weasyprint でPDFを生成
 */
function generatePdf() {
  return new Promise((resolve, reject) => {
    const args = [
      'combined-numbered.md',
      '-o', outputFileName,
      '--pdf-engine=weasyprint',
      '--css=pdf-style.css',
      '-f', 'gfm',
      '--metadata', `title=${bookConfig.metadata.title}`
    ];

    console.log('Pandocコマンドを実行中...');

    const pandoc = spawn('pandoc', args, {
      cwd: baseDir,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stderr = '';

    pandoc.stderr.on('data', (data) => {
      stderr += data.toString();
      // ERRORのみ表示（WARNINGはCSSの非対応プロパティの警告が多いため省略）
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('ERROR:')) {
          process.stderr.write(line + '\n');
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
  console.log('PDF生成スクリプト');
  console.log('='.repeat(60));
  console.log('');

  let copiedFiles = [];

  try {
    // 1. 依存ツールの確認
    console.log('[1/5] 依存ツールの確認...');
    if (!checkPandocInstalled()) {
      throw new Error('Pandocがインストールされていません。\n  macOS: brew install pandoc');
    }
    if (!checkWeasyprintInstalled()) {
      throw new Error('weasyprintがインストールされていません。\n  pip install weasyprint');
    }
    console.log('✓ Pandoc, weasyprint が見つかりました');
    console.log('');

    // 2. build-pdf.js を実行
    console.log('[2/5] Markdownの結合と章番号付与...');
    runBuildPdf();
    console.log('');

    // 3. 画像を一時コピー
    console.log('[3/5] 画像を一時コピー...');
    copiedFiles = copyImagesToRoot();
    console.log(`✓ ${copiedFiles.length} 個の画像をコピーしました`);
    console.log('');

    // 4. PDF生成
    console.log('[4/5] PDFを生成中...');
    await generatePdf();
    console.log('✓ PDF生成が完了しました');
    console.log('');

    // 5. クリーンアップ
    console.log('[5/5] 一時ファイルをクリーンアップ...');
    cleanupCopiedImages(copiedFiles);
    console.log(`✓ ${copiedFiles.length} 個の一時画像を削除しました`);
    console.log('');

    // 結果表示
    const stats = fs.statSync(path.join(baseDir, outputFileName));
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log('='.repeat(60));
    console.log('生成完了!');
    console.log('='.repeat(60));
    console.log(`ファイル: ${outputFileName}`);
    console.log(`サイズ: ${fileSizeMB} MB`);
    console.log('');

  } catch (error) {
    // エラー時もクリーンアップを実行
    if (copiedFiles.length > 0) {
      console.log('エラー発生。一時ファイルをクリーンアップ中...');
      cleanupCopiedImages(copiedFiles);
    }

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
