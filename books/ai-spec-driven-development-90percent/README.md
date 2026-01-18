# AIエージェント開発は仕様が9割

Kindle出版用のMarkdownソースとビルドスクリプト

## 📚 概要

このディレクトリには、書籍「AIエージェント開発は仕様が9割」のMarkdownソースファイルと、EPUB/PDF生成スクリプトが含まれています。

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
books/ai-spec-driven-development-90percent/
├── book-config.js           # 書籍設定（ファイル順序、メタデータ）
├── build-epub.js            # EPUB生成スクリプト
├── build-pdf.js             # PDF生成スクリプト
├── epub-style.css           # EPUB用スタイルシート
├── pdf-style.css            # PDF用スタイルシート
├── _metadata.md             # 書籍メタデータ
├── 00_preface.md            # はじめに
├── 00_toc.md                # 目次
├── part1_why-ai-fails/      # 第1部
├── part2_spec-is-90percent/ # 第2部
├── part3_practice/          # 第3部
├── part4_faq/               # 第4部
├── part5_organization/      # 第5部
├── 99_afterword.md          # おわりに
├── appendix_agent-config.md # 付録
└── images/                  # 図版フォルダ
```

## 🚀 使用方法

### EPUB生成

```bash
# ディレクトリに移動
cd books/ai-spec-driven-development-90percent

# EPUB生成
node build-epub.js
```

生成されるファイル: `AIエージェント開発は仕様が9割_v0.1.0.epub`

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
open -a "Kindle Previewer" "AIエージェント開発は仕様が9割_v0.1.0.epub"
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
calibre "AIエージェント開発は仕様が9割_v0.1.0.epub"
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
epubcheck "AIエージェント開発は仕様が9割_v0.1.0.epub"
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

[book-config.js](book-config.js:34-45) を編集:

```javascript
metadata: {
  title: 'AIエージェント開発は仕様が9割',
  subtitle: 'Vibe Codingで失敗しないための設計図',
  author: 'Futoshi Okazaki',
  language: 'ja',
  version: '0.1.0',  // バージョンを変更
  date: '2026-01-01',
  coverImage: 'images/cover.png'
}
```

### ファイル順序の変更

[book-config.js](book-config.js:7-26) の `files` 配列を編集。

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
  - part1_why-ai-fails/01_typical-failure-patterns.md
```

→ Markdownファイルが正しい場所にあるか確認

### 画像が表示されない

→ `images/` ディレクトリに画像ファイルが存在するか確認

## 📊 書籍情報

| 項目 | 内容 |
|------|------|
| **タイトル** | AIエージェント開発は仕様が9割 |
| **サブタイトル** | Vibe Codingで失敗しないための設計図 |
| **著者** | Futoshi Okazaki |
| **バージョン** | 0.1.0 |
| **構成** | 5部14章 + 付録 |

## 🛒 出版リンク

本書は以下のプラットフォームで購入できます：

| プラットフォーム | リンク |
|-----------------|--------|
| **Amazon Kindle** | [Kindleストアで見る](https://www.amazon.co.jp/dp/B0GHHVX1NY) |
| **Apple Books** | [Apple Booksで見る](http://books.apple.com/us/book/id6757913579) |

## 🤝 貢献

Issue #24: EPUB生成スクリプトの作成

## 📄 ライセンス

[書籍のライセンス情報を記載]
