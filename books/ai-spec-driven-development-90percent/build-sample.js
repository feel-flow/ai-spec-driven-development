#!/usr/bin/env node
/**
 * サンプル版（試し読み）EPUB/PDF生成スクリプト
 *
 * 処理の流れ:
 * 1. sample-config.js からサンプル版の設定を読み込み
 * 2. PandocでEPUBを生成
 * 3. Markdownを結合して章番号を付与
 * 4. 画像を一時コピー
 * 5. Pandoc + weasyprint でPDFを生成
 * 6. 一時ファイルをクリーンアップ
 *
 * 使い方:
 *   node build-sample.js          # EPUB と PDF の両方を生成
 *   node build-sample.js --epub   # EPUB のみ生成
 *   node build-sample.js --pdf    # PDF のみ生成
 */

const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const sampleConfig = require('./sample-config');

const baseDir = __dirname;
const imagesDir = path.join(baseDir, 'images');
const baseFileName = `AI仕様駆動開発_v${sampleConfig.metadata.version}_sample`;
const epubOutputPath = path.join(baseDir, `${baseFileName}.epub`);
const pdfOutputPath = path.join(baseDir, `${baseFileName}.pdf`);
const combinedMdPath = path.join(baseDir, 'combined-sample.md');

// サンプル版で使用するパートディレクトリ（Part 1のみ）
const partDirs = ['part1_why-ai-fails'];

// コマンドライン引数の解析
const args = process.argv.slice(2);
const buildEpub = args.length === 0 || args.includes('--epub');
const buildPdf = args.length === 0 || args.includes('--pdf');

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
 * ファイルの存在確認
 */
function checkFilesExist(files) {
  const missingFiles = [];

  for (const file of files) {
    const filePath = path.join(baseDir, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    throw new Error(`以下のファイルが見つかりません:\n${missingFiles.map(f => `  - ${f}`).join('\n')}`);
  }
}

/**
 * カバー画像の存在確認
 */
function checkCoverImageExists() {
  const coverImagePath = path.join(baseDir, sampleConfig.metadata.coverImage);
  if (!fs.existsSync(coverImagePath)) {
    console.warn(`警告: カバー画像が見つかりません: ${sampleConfig.metadata.coverImage}`);
    console.warn('カバー画像なしで続行します。');
    return false;
  }
  return true;
}

/**
 * PandocでEPUBを生成
 */
function generateEpub(files, hasCoverImage) {
  return new Promise((resolve, reject) => {
    const args = [
      '--from', 'markdown',
      '--to', 'epub3',
      '--output', epubOutputPath,
      '--metadata', `title=${sampleConfig.metadata.title}`,
      '--metadata', `subtitle=${sampleConfig.metadata.subtitle}`,
      '--metadata', `author=${sampleConfig.metadata.author}`,
      '--metadata', `lang=${sampleConfig.metadata.language}`,
      '--metadata', `date=${sampleConfig.metadata.date}`,
      '--split-level=1',
      '--toc',
      '--toc-depth=2',
      '--css=epub-style.css',
      '--resource-path=.:images:part1_why-ai-fails:part1_why-ai-fails/images'
    ];

    // カバー画像がある場合のみ追加
    if (hasCoverImage) {
      args.push('--epub-cover-image=' + sampleConfig.metadata.coverImage);
    }

    // ファイルリストを追加
    args.push(...files);

    console.log('EPUB生成中...');

    const pandoc = spawn('pandoc', args, {
      cwd: baseDir,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stderr = '';

    pandoc.stderr.on('data', (data) => {
      stderr += data.toString();
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
 * Markdownファイルを結合して章番号を付与
 */
function combineMarkdownFiles() {
  const files = sampleConfig.files.filter(f => f !== '_metadata.md');
  let combined = '';
  let chapterNum = 0;

  for (const file of files) {
    const filePath = path.join(baseDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 章番号の付与（01_xxx.md のようなファイル名のみ）
    const match = file.match(/\/(\d+)_/);
    if (match) {
      chapterNum = parseInt(match[1], 10);
      // 見出しに章番号を付与
      content = content.replace(/^(# )(.+)$/m, `$1第${chapterNum}章 $2`);
    }

    // 画像パスの修正（./images/ → images/）
    content = content.replace(/\.\/(images\/)/g, '$1');

    combined += content + '\n\n';
  }

  fs.writeFileSync(combinedMdPath, combined, 'utf8');
}

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
 * 結合されたMarkdownをクリーンアップ
 */
function cleanupCombinedMd() {
  if (fs.existsSync(combinedMdPath)) {
    fs.unlinkSync(combinedMdPath);
  }
}

/**
 * Pandoc + weasyprint でPDFを生成
 */
function generatePdf() {
  return new Promise((resolve, reject) => {
    const args = [
      combinedMdPath,
      '-o', pdfOutputPath,
      '--pdf-engine=weasyprint',
      '--css=pdf-style.css',
      '-f', 'gfm',
      '--metadata', `title=${sampleConfig.metadata.title}`
    ];

    console.log('PDF生成中...');

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
 * ファイルサイズを取得（MB単位）
 */
function getFileSizeMB(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const stats = fs.statSync(filePath);
  return (stats.size / 1024 / 1024).toFixed(2);
}

/**
 * メイン処理
 */
async function main() {
  console.log('='.repeat(60));
  console.log('サンプル版（試し読み）生成スクリプト');
  console.log('='.repeat(60));
  console.log('');

  let copiedFiles = [];

  try {
    // 1. 依存ツールの確認
    console.log('[1/6] 依存ツールの確認...');
    if (!checkPandocInstalled()) {
      throw new Error('Pandocがインストールされていません。\n  macOS: brew install pandoc');
    }
    if (buildPdf && !checkWeasyprintInstalled()) {
      throw new Error('weasyprintがインストールされていません。\n  pip install weasyprint');
    }
    console.log('✓ 必要なツールが見つかりました');
    console.log('');

    // 2. ファイルの存在確認
    console.log(`[2/6] ファイルの存在確認... (${sampleConfig.files.length}ファイル)`);
    checkFilesExist(sampleConfig.files);
    console.log('✓ すべてのファイルが見つかりました');
    console.log('');

    // 3. カバー画像の確認
    console.log('[3/6] カバー画像の確認...');
    const hasCoverImage = checkCoverImageExists();
    if (hasCoverImage) {
      console.log('✓ カバー画像が見つかりました');
    }
    console.log('');

    // 4. EPUB生成
    if (buildEpub) {
      console.log('[4/6] EPUB生成...');
      const epubFiles = sampleConfig.getEpubFiles();
      await generateEpub(epubFiles, hasCoverImage);
      console.log('✓ EPUB生成が完了しました');
      console.log('');
    } else {
      console.log('[4/6] EPUB生成... スキップ');
      console.log('');
    }

    // 5. PDF生成
    if (buildPdf) {
      console.log('[5/6] PDF生成の準備...');

      // Markdownを結合
      console.log('  - Markdownファイルを結合中...');
      combineMarkdownFiles();

      // 画像を一時コピー
      console.log('  - 画像を一時コピー中...');
      copiedFiles = copyImagesToRoot();
      console.log(`  - ${copiedFiles.length} 個の画像をコピーしました`);

      // PDF生成
      await generatePdf();
      console.log('✓ PDF生成が完了しました');
      console.log('');
    } else {
      console.log('[5/6] PDF生成... スキップ');
      console.log('');
    }

    // 6. クリーンアップ
    console.log('[6/6] 一時ファイルをクリーンアップ...');
    cleanupCopiedImages(copiedFiles);
    cleanupCombinedMd();
    console.log('✓ クリーンアップが完了しました');
    console.log('');

    // 結果表示
    console.log('='.repeat(60));
    console.log('生成完了!');
    console.log('='.repeat(60));

    if (buildEpub) {
      const epubSize = getFileSizeMB(epubOutputPath);
      console.log(`EPUB: ${path.basename(epubOutputPath)} (${epubSize} MB)`);
    }

    if (buildPdf) {
      const pdfSize = getFileSizeMB(pdfOutputPath);
      console.log(`PDF:  ${path.basename(pdfOutputPath)} (${pdfSize} MB)`);
    }

    console.log('');
    console.log('含まれる内容:');
    console.log('  - 前書き');
    console.log('  - Part 1: なぜAIエージェント開発は失敗するのか');
    console.log('    - 第1章: あるあるな失敗パターン');
    console.log('    - 第2章: AIの得意なこと、苦手なこと');
    console.log('  - あとがき');
    console.log('');

  } catch (error) {
    // エラー時もクリーンアップを実行
    if (copiedFiles.length > 0) {
      console.log('エラー発生。一時ファイルをクリーンアップ中...');
      cleanupCopiedImages(copiedFiles);
    }
    cleanupCombinedMd();

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
