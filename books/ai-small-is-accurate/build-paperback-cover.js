#!/usr/bin/env node
/**
 * ペーパーバック表紙生成スクリプト
 *
 * 既存の電子書籍表紙をベースに、ペーパーバック用の表紙（表・背・裏）を生成する。
 *
 * 使い方:
 *   node build-paperback-cover.js [ページ数]
 *   node build-paperback-cover.js 125
 *
 * 依存:
 *   - ImageMagick (magick コマンド)
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const bookConfig = require('./book-config');

// === 設定 ===
const CONFIG = {
  // 判型（トリムサイズ）- 5.83 x 8.27 インチ（A5）
  trimWidth: 5.83,     // インチ
  trimHeight: 8.27,    // インチ

  // 裁ち落とし
  bleed: 0.125,        // インチ（各辺）

  // セーフゾーン（KDP必須：トリムエッジからの最小距離）
  safeZone: 0.374,     // インチ（9.5mm）— テキストはこの内側に配置

  // 解像度
  dpi: 300,

  // 用紙タイプ（背幅計算用）
  // クリーム紙: 0.0025 インチ/ページ
  // 白紙: 0.002 インチ/ページ
  pageThickness: 0.0025,

  // 色設定
  backgroundColor: '#1a1a1a',  // 裏表紙・背表紙の背景色
  textColor: '#ffffff',        // テキスト色
  accentColor: '#ED8936',      // アクセント色（オレンジ）

  // フォント（日本語対応フォント）
  fontFamily: '.Hiragino-Kaku-Gothic-Interface-W4',
  fontFamilyLight: '.Hiragino-Kaku-Gothic-Interface-W2',
  fontFamilyBold: '.Hiragino-Kaku-Gothic-Interface-W5',

  // 入出力ファイル
  inputCover: 'images/cover.jpg',
  outputCoverJpg: 'images/cover_paperback.jpg',
  outputCoverPdf: 'images/cover_paperback.pdf',
};

// === ヘルパー関数 ===

/**
 * インチをピクセルに変換
 */
function inchToPixel(inch) {
  return Math.round(inch * CONFIG.dpi);
}

/**
 * 背幅を計算（ページ数から）
 */
function calculateSpineWidth(pageCount) {
  return pageCount * CONFIG.pageThickness;
}

/**
 * ImageMagickがインストールされているか確認
 */
function checkImageMagick() {
  const result = spawnSync('magick', ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

/**
 * ImageMagickコマンドを実行
 */
function runMagick(args) {
  console.log(`  実行: magick ${args.slice(0, 3).join(' ')}...`);
  const result = spawnSync('magick', args, {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  if (result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString() : '';
    throw new Error(`ImageMagickエラー: ${stderr}`);
  }

  return result;
}

/**
 * 表紙サイズを計算
 */
function calculateCoverSize(pageCount) {
  const spineWidth = calculateSpineWidth(pageCount);

  // 各要素のサイズ（インチ）
  const frontWidth = CONFIG.trimWidth;
  const backWidth = CONFIG.trimWidth;

  // 全体サイズ（裁ち落とし込み）
  const totalWidth = backWidth + spineWidth + frontWidth + (CONFIG.bleed * 2);
  const totalHeight = CONFIG.trimHeight + (CONFIG.bleed * 2);

  return {
    spineWidth,
    totalWidth,
    totalHeight,
    // ピクセル値
    spineWidthPx: inchToPixel(spineWidth),
    totalWidthPx: inchToPixel(totalWidth),
    totalHeightPx: inchToPixel(totalHeight),
    frontWidthPx: inchToPixel(frontWidth + CONFIG.bleed),
    backWidthPx: inchToPixel(backWidth + CONFIG.bleed),
    bleedPx: inchToPixel(CONFIG.bleed),
    // セーフゾーン: ファイル端からテキストまでの最小距離 = bleed + safeZone
    safeMarginPx: inchToPixel(CONFIG.bleed + CONFIG.safeZone),
  };
}

/**
 * 背表紙画像を生成
 */
function createSpineImage(size, tempDir) {
  const spinePath = path.join(tempDir, 'spine.png');
  const title = bookConfig.metadata.title;
  const author = bookConfig.metadata.author;

  // 背表紙のテキスト
  // 背幅が狭い場合（100px未満）はフォントサイズを小さくする
  const fontSize = size.spineWidthPx < 100 ? 12 : 16;
  const spineText = `${title}　　${author}`;

  // ベース画像を作成
  runMagick([
    '-size', `${size.spineWidthPx}x${size.totalHeightPx}`,
    `xc:${CONFIG.backgroundColor}`,
    spinePath
  ]);

  // 回転してテキストを配置（背表紙は通常90度回転）
  // 一時的に回転した画像を作成
  const rotatedPath = path.join(tempDir, 'spine_rotated.png');
  runMagick([
    '-size', `${size.totalHeightPx}x${size.spineWidthPx}`,
    `xc:${CONFIG.backgroundColor}`,
    '-fill', CONFIG.textColor,
    '-font', CONFIG.fontFamily,
    '-pointsize', `${fontSize}`,
    '-gravity', 'center',
    '-annotate', '+0+0', spineText,
    rotatedPath
  ]);

  // 90度回転して背表紙の向きに
  runMagick([
    rotatedPath,
    '-rotate', '-90',
    spinePath
  ]);

  return spinePath;
}

/**
 * 裏表紙画像を生成
 */
function createBackCoverImage(size, tempDir) {
  const backPath = path.join(tempDir, 'back.png');
  const safeMargin = size.safeMarginPx; // ≈150px（bleed + safeZone）

  // ベース画像を作成
  runMagick([
    '-size', `${size.backWidthPx}x${size.totalHeightPx}`,
    `xc:${CONFIG.backgroundColor}`,
    backPath
  ]);

  // キャッチコピー（上部）— セーフゾーン内に収める
  runMagick([
    backPath,
    '-fill', CONFIG.accentColor,
    '-font', CONFIG.fontFamilyBold,
    '-pointsize', '36',
    '-gravity', 'north',
    '-annotate', `+0+${safeMargin + 80}`, 'AIを使う全ての人に贈る「思想編」',
    backPath
  ]);

  // メインテキスト（中央）
  runMagick([
    backPath,
    '-fill', CONFIG.textColor,
    '-font', CONFIG.fontFamily,
    '-pointsize', '28',
    '-gravity', 'center',
    '-annotate', '+0-100', '70%で止まる原因と\n98%を達成する方法',
    backPath
  ]);

  // キーメッセージ（中央下）
  runMagick([
    backPath,
    '-fill', CONFIG.textColor,
    '-font', CONFIG.fontFamilyLight,
    '-pointsize', '32',
    '-gravity', 'center',
    '-annotate', '+0+150', '小さく、でも余白を残して。',
    backPath
  ]);

  // 特徴（下部）— バーコードと干渉しないよう位置調整
  const features = '✓ ChatGPT / Claude / Gemini 対応\n✓ コピペで使えるプロンプト例付き\n✓ 初心者でもすぐ実践できる';
  runMagick([
    backPath,
    '-fill', '#cccccc',
    '-font', CONFIG.fontFamilyLight,
    '-pointsize', '22',
    '-gravity', 'south',
    '-annotate', `+0+${safeMargin + 250}`, features,
    backPath
  ]);

  // 姉妹編の紹介
  runMagick([
    backPath,
    '-fill', '#888888',
    '-font', CONFIG.fontFamilyLight,
    '-pointsize', '18',
    '-gravity', 'south',
    '-annotate', `+0+${safeMargin + 150}`, '姉妹編「AIエージェント開発は仕様が9割」も好評発売中',
    backPath
  ]);

  // バーコード領域（KDP必須: 裏表紙左下に2" x 1.2"の白い領域）
  // 見開きで裏表紙は左側なので、外端 = 左端。セーフゾーンを確保。
  const barcodeWidth = inchToPixel(2);
  const barcodeHeight = inchToPixel(1.2);
  const barcodeX = safeMargin;
  const barcodeY = size.totalHeightPx - barcodeHeight - safeMargin;
  runMagick([
    backPath,
    '-fill', 'white',
    '-draw', `rectangle ${barcodeX},${barcodeY} ${barcodeX + barcodeWidth},${barcodeY + barcodeHeight}`,
    backPath
  ]);

  return backPath;
}

/**
 * 表表紙をリサイズ
 */
function resizeFrontCover(size, tempDir) {
  const frontPath = path.join(tempDir, 'front.png');
  const inputPath = path.join(__dirname, CONFIG.inputCover);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`表紙画像が見つかりません: ${inputPath}`);
  }

  // 表表紙サイズにリサイズ（裁ち落とし込み）
  const frontWidth = size.frontWidthPx;
  const frontHeight = size.totalHeightPx;

  runMagick([
    inputPath,
    '-resize', `${frontWidth}x${frontHeight}^`,
    '-gravity', 'center',
    '-extent', `${frontWidth}x${frontHeight}`,
    frontPath
  ]);

  return frontPath;
}

/**
 * 全体を結合
 */
function combineCovers(backPath, spinePath, frontPath, size) {
  const outputPathJpg = path.join(__dirname, CONFIG.outputCoverJpg);
  const outputPathPdf = path.join(__dirname, CONFIG.outputCoverPdf);

  // JPGで結合
  runMagick([
    backPath, spinePath, frontPath,
    '+append',  // 横に結合
    '-quality', '95',
    outputPathJpg
  ]);

  // PDFに変換（300DPI）
  runMagick([
    outputPathJpg,
    '-density', '300',
    '-units', 'PixelsPerInch',
    outputPathPdf
  ]);

  return { jpg: outputPathJpg, pdf: outputPathPdf };
}

/**
 * メイン処理
 */
function main() {
  console.log('='.repeat(60));
  console.log('ペーパーバック表紙生成スクリプト');
  console.log('='.repeat(60));
  console.log('');

  // ページ数を取得
  const pageCount = parseInt(process.argv[2]) || 368;
  console.log(`ページ数: ${pageCount}`);

  // ImageMagick確認
  if (!checkImageMagick()) {
    console.error('エラー: ImageMagickがインストールされていません');
    console.error('  brew install imagemagick');
    process.exit(1);
  }

  // サイズ計算
  const size = calculateCoverSize(pageCount);
  console.log('');
  console.log('表紙サイズ:');
  console.log(`  全体: ${size.totalWidthPx} x ${size.totalHeightPx} px`);
  console.log(`  背幅: ${size.spineWidthPx} px (${size.spineWidth.toFixed(3)} インチ)`);
  console.log(`  セーフマージン: ${size.safeMarginPx} px (bleed ${CONFIG.bleed}" + safeZone ${CONFIG.safeZone}")`);
  console.log('');

  // 一時ディレクトリ
  const tempDir = path.join(__dirname, '.temp_cover');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  try {
    // 1. 表表紙をリサイズ
    console.log('[1/4] 表表紙をリサイズ...');
    const frontPath = resizeFrontCover(size, tempDir);
    console.log('  ✓ 完了');

    // 2. 背表紙を生成
    console.log('[2/4] 背表紙を生成...');
    const spinePath = createSpineImage(size, tempDir);
    console.log('  ✓ 完了');

    // 3. 裏表紙を生成
    console.log('[3/4] 裏表紙を生成...');
    const backPath = createBackCoverImage(size, tempDir);
    console.log('  ✓ 完了');

    // 4. 結合 & PDF変換
    console.log('[4/4] 画像を結合 & PDF変換...');
    const outputPaths = combineCovers(backPath, spinePath, frontPath, size);
    console.log('  ✓ 完了');

    // クリーンアップ
    fs.rmSync(tempDir, { recursive: true });

    // 結果表示
    const statsPdf = fs.statSync(outputPaths.pdf);
    const fileSizeMB = (statsPdf.size / 1024 / 1024).toFixed(2);

    console.log('');
    console.log('='.repeat(60));
    console.log('生成完了!');
    console.log('='.repeat(60));
    console.log(`PDF: ${CONFIG.outputCoverPdf}`);
    console.log(`JPG: ${CONFIG.outputCoverJpg}`);
    console.log(`サイズ: ${size.totalWidthPx} x ${size.totalHeightPx} px (300 DPI)`);
    console.log(`ファイルサイズ: ${fileSizeMB} MB`);
    console.log('');
    console.log('KDPにアップロード: PDFファイルを使用');
    console.log('');

  } catch (error) {
    // エラー時もクリーンアップ
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    console.error('');
    console.error('エラー:', error.message);
    process.exit(1);
  }
}

// 実行
main();
