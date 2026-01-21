# 文章校正スキル（Proofreading Skills）

日本語技術書の校正を行うClaude Code skillsです。

## 概要

`books/` ディレクトリ内の技術書（Markdown形式）に対して、以下の観点で校正を実行します：

1. **日本語表現** - 誤字脱字、文法、読みやすさ
2. **章構造** - フォーマット準拠、必須セクションの有無
3. **用語統一** - 表記揺れ、略語ルール、固有名詞
4. **Markdown形式** - コードブロック、リンク、テーブル
5. **ファクトチェック** - 研究論文、統計データの裏付け確認

## クイックスタート

### 初回セットアップ

まず用語集を生成します：

```bash
/extract-terms books/
```

### 校正の実行

```bash
# 単一ファイルの校正
/proofread books/ai-small-is-accurate/part1_why-ai-fails/01_the-seventy-percent-problem.md

# 書籍全体の校正
/proofread books/ai-small-is-accurate/

# 特定の観点のみ
/proofread books/ai-small-is-accurate/ focus:facts
```

## スキル一覧

| スキル | コマンド | 説明 |
| --- | --- | --- |
| メイン校正 | `/proofread` | 全観点の統合校正 |
| 用語抽出 | `/extract-terms` | 本文から用語集を生成 |
| 日本語校正 | - | 誤字脱字、文法、読みやすさ |
| 構造検証 | `/proofread-structure` | 章構造のみを検証 |
| 用語統一 | - | 表記揺れ、略語、固有名詞 |
| Markdown検証 | - | コードブロック、リンク、テーブル |
| ファクトチェック | `/proofread-facts` | 事実確認のみを実行 |

**注**: `-` のスキルは `/proofread` から内部的に呼び出されるサブスキルです。`focus:` オプションで個別実行も可能です（例: `/proofread file.md focus:japanese`）。

## ファイル構成

```text
.claude/skills/proofreading/
├── README.md              # このファイル
├── proofread.md           # メインコーディネーター
├── proofread-japanese.md  # 日本語校正ルール
├── proofread-structure.md # 章構造検証ルール
├── proofread-terms.md     # 用語統一ルール
├── proofread-markdown.md  # Markdown検証ルール
├── proofread-facts.md     # ファクトチェックルール
├── extract-terms.md       # 用語抽出スキル
└── terminology.yaml       # /extract-terms 実行後に生成
```

## 出力形式

校正結果は重要度別に分類されます：

| 重要度 | 記号 | 説明 |
| --- | --- | --- |
| 重大 | 🔴 | 修正必須（誤り、リンク切れ、出典なし） |
| 警告 | 🟡 | 修正推奨（表記揺れ、構造の逸脱） |
| 提案 | 🔵 | 改善可能（冗長表現、読みやすさ） |

## 出力例

```markdown
## 校正結果レポート

### サマリー
- 対象ファイル: 01_the-seventy-percent-problem.md
- 検出数: 🔴 重大: 2件 / 🟡 警告: 5件 / 🔵 提案: 8件

---

### 🔴 重大な問題

1. **[行227]** ファクトチェック: 論文の正式名称が不明確
   - 現在: 「スタンフォード大学の研究者たちが発見した」
   - 推奨: 論文名と著者を追記
   - 参照: arXiv:2307.03172

### 🟡 警告

1. **[行52]** 用語揺れ: 「コンテキスト」と「コンテクスト」が混在
   - 推奨: 「コンテキスト」に統一
```

## カスタマイズ

### 用語集の編集

自動生成された `terminology.yaml` を手動で編集できます：

```yaml
terms:
  - standard: "仕様駆動開発"
    variants:
      - "Spec-driven development"
    note: "本プロジェクトの中核概念"  # 手動で追加
```

### 検証ルールの調整

各スキルファイル内のルールを編集して、プロジェクト固有の要件に対応できます。

## 設計方針

- **厳密モード**: すべての統計・主張に出典を要求
- **本文から抽出**: 用語集は既存の本文から自動生成
- **重要度分類**: 問題を優先度別に整理して対処しやすく

## 関連ドキュメント

- [CLAUDE.md](../../../CLAUDE.md) - プロジェクト全体のAI向けガイドライン
- [books/](../../../books/) - 校正対象の書籍ディレクトリ
