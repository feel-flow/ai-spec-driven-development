#!/usr/bin/env node
/**
 * EPUB生成スクリプト
 * - Pandocを使用してMarkdownファイルをEPUB形式に変換
 * - メタデータの埋め込み
 * - 目次の自動生成
 * - カバー画像の設定
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const bookConfig = require('./book-config');

// 基準ディレクトリ
const baseDir = __dirname;

// 出力ファイル名
const outputFileName = `${bookConfig.metadata.title}_v${bookConfig.metadata.version}.epub`;
const outputPath = path.join(baseDir, outputFileName);

/**
 * Pandocのインストール確認
 */
function checkPandocInstalled() {
  return new Promise((resolve, reject) => {
    const pandoc = spawn('pandoc', ['--version']);

    pandoc.on('error', () => {
      reject(new Error('Pandocがインストールされていません。\n\nインストール方法:\n  macOS: brew install pandoc\n  Linux: sudo apt-get install pandoc\n  Windows: https://pandoc.org/installing.html'));
    });

    pandoc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Pandocのバージョン確認に失敗しました (exit code: ${code})`));
      }
    });
  });
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
 * 画像ファイルの存在確認
 */
function checkCoverImageExists() {
  const coverImagePath = path.join(baseDir, bookConfig.metadata.coverImage);
  if (!fs.existsSync(coverImagePath)) {
    console.warn(`警告: カバー画像が見つかりません: ${bookConfig.metadata.coverImage}`);
    console.warn('カバー画像なしで続行します。');
    return false;
  }
  return true;
}

/**
 * Pandocコマンドの構築と実行
 */
function runPandoc(files, hasCoverImage) {
  return new Promise((resolve, reject) => {
    const args = [
      '--from', 'markdown',
      '--to', 'epub3',
      '--output', outputPath,
      '--metadata', `title=${bookConfig.metadata.title}`,
      '--metadata', `subtitle=${bookConfig.metadata.subtitle}`,
      '--metadata', `author=${bookConfig.metadata.author}`,
      '--metadata', `lang=${bookConfig.metadata.language}`,
      '--metadata', `date=${bookConfig.metadata.date}`,
      '--toc',
      '--toc-depth=3',
      '--split-level=1',
      '--css=epub-style.css',
      '--resource-path=.:images'
    ];

    // Publisher情報を追加
    if (bookConfig.metadata.publisher) {
      args.push('--metadata', `publisher=${bookConfig.metadata.publisher}`);
    }

    // ISBN情報を追加（ISBNがある場合のみ）
    if (bookConfig.metadata.isbn && bookConfig.metadata.isbn.trim() !== '') {
      args.push('--metadata', `identifier=ISBN:${bookConfig.metadata.isbn}`);
    }

    // カバー画像がある場合のみ追加
    if (hasCoverImage) {
      args.push('--epub-cover-image=' + bookConfig.metadata.coverImage);
    }

    // ファイルリストを追加
    args.push(...files);

    console.log('Pandocコマンドを実行中...');
    console.log(`出力ファイル: ${outputFileName}`);
    console.log('');

    const pandoc = spawn('pandoc', args, {
      cwd: baseDir,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pandoc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pandoc.stderr.on('data', (data) => {
      stderr += data.toString();
      // Pandocの進捗メッセージを表示
      process.stderr.write(data);
    });

    pandoc.on('error', (error) => {
      reject(new Error(`Pandocの実行に失敗しました: ${error.message}`));
    });

    pandoc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Pandocがエラーで終了しました (exit code: ${code})\n\n${stderr}`));
      }
    });
  });
}

/**
 * 生成されたEPUBファイルの確認
 */
function verifyEpubGenerated() {
  if (!fs.existsSync(outputPath)) {
    throw new Error('EPUBファイルの生成に失敗しました。ファイルが見つかりません。');
  }

  const stats = fs.statSync(outputPath);
  const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

  return {
    path: outputPath,
    size: stats.size,
    sizeMB: fileSizeMB
  };
}

/**
 * メイン処理
 */
async function main() {
  console.log('='.repeat(60));
  console.log('EPUB生成スクリプト');
  console.log('='.repeat(60));
  console.log('');

  try {
    // 1. Pandocのインストール確認
    console.log('[1/5] Pandocのインストール確認...');
    await checkPandocInstalled();
    console.log('✓ Pandocが見つかりました');
    console.log('');

    // 2. EPUB用のファイルリストを取得 (00_toc.md除外)
    const epubFiles = bookConfig.getEpubFiles();
    console.log(`[2/5] ファイルの存在確認... (${epubFiles.length}ファイル)`);
    checkFilesExist(epubFiles);
    console.log('✓ すべてのファイルが見つかりました');
    console.log('');

    // 3. カバー画像の確認
    console.log('[3/5] カバー画像の確認...');
    const hasCoverImage = checkCoverImageExists();
    if (hasCoverImage) {
      console.log('✓ カバー画像が見つかりました');
    }
    console.log('');

    // 4. Pandoc実行
    console.log('[4/5] PandocでのEPUB変換実行中...');
    console.log(`  - タイトル: ${bookConfig.metadata.title}`);
    console.log(`  - 著者: ${bookConfig.metadata.author}`);
    console.log(`  - バージョン: ${bookConfig.metadata.version}`);
    console.log('');
    await runPandoc(epubFiles, hasCoverImage);
    console.log('');
    console.log('✓ EPUB変換が完了しました');
    console.log('');

    // 5. 生成確認
    console.log('[5/5] 生成されたEPUBファイルの確認...');
    const epubInfo = verifyEpubGenerated();
    console.log('✓ EPUBファイルが正常に生成されました');
    console.log('');

    // 結果表示
    console.log('='.repeat(60));
    console.log('生成完了!');
    console.log('='.repeat(60));
    console.log(`ファイル: ${path.basename(epubInfo.path)}`);
    console.log(`サイズ: ${epubInfo.sizeMB} MB`);
    console.log(`パス: ${epubInfo.path}`);
    console.log('');
    console.log('次のステップ:');
    console.log('  1. Kindle Previewerで表示を確認');
    console.log('  2. Calibreで構造を検証');
    console.log('  3. epubcheckで規格準拠を確認 (オプション)');
    console.log('');

  } catch (error) {
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
