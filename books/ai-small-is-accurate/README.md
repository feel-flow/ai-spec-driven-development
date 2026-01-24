# なぜあの人のAIは優秀なのか

Kindle出版用のMarkdownソースとビルドスクリプト

## 📚 概要

このディレクトリには、書籍「なぜあの人のAIは優秀なのか──「分割と余白」で変わるAIと協働術」のMarkdownソースファイルと、EPUB/PDF生成スクリプトが含まれています。

## 🛠️ 前提条件

### 必須

- **Node.js** v16以上
- **Pandoc** v2.19以上

### Pandocのインストール

```bash
# macOS
brew install pandoc

# Linux
sudo apt-get install pandoc

# Windows
# https://pandoc.org/installing.html からインストーラーをダウンロード
```

### 推奨ツール

- **Kindle Previewer** - EPUB表示確認用
- **Calibre** - EPUB構造検証用
- **epubcheck** - EPUB規格準拠確認用

## 📖 ファイル構成

```
books/ai-small-is-accurate/
├── book-config.js           # 書籍設定（ファイル順序、メタデータ）
├── build-epub.js            # EPUB生成スクリプト
├── build-pdf.js             # PDF生成スクリプト
├── epub-style.css           # EPUB用スタイルシート
├── pdf-style.css            # PDF用スタイルシート
├── _metadata.md             # 書籍メタデータ
├── 00_preface.md            # はじめに
├── 00_toc.md                # 目次
├── part1_why-ai-fails/      # 第1部：なぜAIは失敗するのか
├── part2_context-limit/     # 第2部：コンテキストの限界
├── part3_precision/         # 第3部：精度を上げる戦略
├── part4_inference/         # 第4部：推論を引き出す
├── part5_failures/          # 第5部：失敗パターン集
├── part6_vscode/            # 第6部：実践Tips
├── part7_new-roles/         # 第7部：新しい役割
├── 99_afterword.md          # あとがき
└── images/                  # 図版フォルダ
```

## 🚀 使用方法

### EPUB生成

```bash
# ディレクトリに移動
cd books/ai-small-is-accurate

# EPUB生成
node build-epub.js
```

生成されるファイル: `なぜAIは期待通りに動かないのか_v0.1.0.epub`

**対応プラットフォーム:**
- ✅ Amazon Kindle (KDP)
- ✅ Apple Books
- ✅ その他EPUB 3.0対応リーダー

### PDF生成

```bash
# 章番号付きMarkdownの結合
node build-pdf.js
```

生成されるファイル: `combined-numbered.md`

## ✅ 検証方法

### 1. Kindle Previewerで確認

```bash
# macOS
open -a "Kindle Previewer" "なぜAIは期待通りに動かないのか_v0.1.0.epub"
```

確認項目:
- カバー画像の表示
- 章立ての認識
- 目次からのジャンプ動作
- 画像の表示品質
- コードブロックのフォーマット

### 2. Calibreで確認

```bash
# Calibreでファイルを開く
calibre "なぜAIは期待通りに動かないのか_v0.1.0.epub"
```

確認項目:
- EPUB構造の検証
- メタデータの確認
- リーダービューでの確認

### 3. epubcheckで規格準拠を確認

```bash
# epubcheckのインストール
brew install epubcheck

# 検証実行
epubcheck "なぜAIは期待通りに動かないのか_v0.1.0.epub"
```

## 📱 Apple Books対応

### 追加されたメタデータ

- **Publisher**: Futoshi Okazaki
- **ISBN**: 空文字列（出版時に実際のISBNに置き換え）

### ISBN設定方法

[book-config.js](book-config.js) の `isbn` フィールドを更新:

```javascript
metadata: {
  // ... 他のフィールド ...
  isbn: '978-1234567890' // 実際のISBN-13
}
```

### Apple Books Connect での配信

1. [Apple Books Connect](https://books.apple.com/) にアカウント登録
2. EPUBファイルをアップロード
3. 価格・地域設定
4. 審査提出

### Kindle vs Apple Books の違い

| 項目 | Kindle (KDP) | Apple Books |
|------|--------------|-------------|
| フォーマット | EPUB 3.0 ✅ | EPUB 3.0 ✅ |
| カバー画像 | 必須 | 必須 |
| ISBN | 任意（KDPが発行可） | 推奨 |
| 審査 | あり（緩め） | あり（厳しめ） |

## 📝 設定のカスタマイズ

### メタデータの変更

[book-config.js](book-config.js) を編集:

```javascript
metadata: {
  title: 'なぜAIは期待通りに動かないのか',
  subtitle: '小さく、でも余白を残して',
  author: 'Futoshi Okazaki',
  language: 'ja',
  version: '0.1.0',  // バージョンを変更
  date: '2026-01-18',
  coverImage: 'images/cover.jpg'
}
```

### ファイル順序の変更

[book-config.js](book-config.js) の `files` 配列を編集。

## 🎨 スタイルのカスタマイズ

### EPUB用スタイル

[epub-style.css](epub-style.css) を編集して、フォント、色、レイアウトをカスタマイズ。

特徴:
- EPUBリーダーのシステムフォントを尊重
- 相対的なフォントサイズ (em/rem)
- ダークモード対応

### PDF用スタイル

[pdf-style.css](pdf-style.css) を編集。

## 🔧 トラブルシューティング

### Pandocが見つからない

```
エラー: Pandocがインストールされていません。
```

→ 「前提条件」セクションを参照してPandocをインストール

### ファイルが見つからない

```
エラー: 以下のファイルが見つかりません:
  - part1_why-ai-fails/01-1_the-seventy-percent-problem.md
```

→ Markdownファイルが正しい場所にあるか確認

### 画像が表示されない

→ `images/` ディレクトリに画像ファイルが存在するか確認

## 📊 書籍情報

| 項目 | 内容 |
|------|------|
| **タイトル** | なぜあの人のAIは優秀なのか |
| **サブタイトル** | 「分割と余白」で変わるAIと協働術 |
| **著者** | Futoshi Okazaki |
| **バージョン** | 0.1.0 |
| **構成** | 7部8章 |

## 🤝 貢献

Issue #51: ビルド環境セットアップ

## 📄 ライセンス

[書籍のライセンス情報を記載]
