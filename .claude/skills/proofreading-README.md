# 文章校正・校閲スキル（Proofreading & Editing Skills）

日本語技術書の校正・校閲を行うClaude Code skillsです。

## 概要

`books/` ディレクトリ内の技術書（Markdown形式）に対して、以下の観点で校正・校閲を実行します。

### 校正（Proofreading）- 表記・形式の検証

1. **日本語表現** - 誤字脱字、文法、読みやすさ
2. **章構造** - フォーマット準拠、必須セクションの有無
3. **用語統一** - 表記揺れ、略語ルール、固有名詞
4. **Markdown形式** - コードブロック、リンク、テーブル
5. **ファクトチェック** - 研究論文、統計データの裏付け確認

### 校閲（Editing）- 内容・論理の検証

6. **論理検証** - 論理の一貫性、矛盾検出
7. **主張検証** - 根拠のない主張、過度な断言
8. **整合性検証** - 章間の矛盾、用語定義の一貫性

## クイックスタート

### 初回セットアップ

まず用語集を生成します：

```bash
/extract-terms books/
```

### 校正の実行

```bash
# 単一ファイルの校正（総合）
/proofread books/ai-small-is-accurate/part1_why-ai-fails/01_the-seventy-percent-problem.md

# 書籍全体の校正
/proofread books/ai-small-is-accurate/

# 特定の観点のみ
/proofread books/ai-small-is-accurate/ focus:facts
```

### 校閲の実行

```bash
# 論理チェック
/proofread-logic books/ai-spec-driven-development-90percent/

# 主張チェック
/proofread-claims books/ai-spec-driven-development-90percent/

# 整合性チェック（書籍全体推奨）
/proofread-consistency books/ai-spec-driven-development-90percent/
```

## スキル一覧

### 校正系（Proofreading）

| スキル | コマンド | 説明 |
| --- | --- | --- |
| メイン校正 | `/proofread` | 全観点の統合校正 |
| 用語抽出 | `/extract-terms` | 本文から用語集を生成 |
| 日本語校正 | - | 誤字脱字、文法、読みやすさ |
| 構造検証 | `/proofread-structure` | 章構造のみを検証 |
| 用語統一 | - | 表記揺れ、略語、固有名詞 |
| Markdown検証 | - | コードブロック、リンク、テーブル |
| ファクトチェック | `/proofread-facts` | 事実確認のみを実行 |

### 校閲系（Editing）

| スキル | コマンド | 説明 |
| --- | --- | --- |
| 論理校閲 | `/proofread-logic` | 論理の一貫性・矛盾検出 |
| 主張校閲 | `/proofread-claims` | 根拠のない主張・過度な断言 |
| 整合性校閲 | `/proofread-consistency` | 章間の矛盾・定義の一貫性 |

**注**: `-` のスキルは `/proofread` から内部的に呼び出されるサブスキルです。`focus:` オプションで個別実行も可能です（例: `/proofread file.md focus:japanese`）。

## ファイル構成

```text
.claude/skills/
├── proofreading-README.md    # このファイル
├── proofread.md              # メインコーディネーター
│
│  # 校正系（Proofreading）
├── proofread-japanese.md     # 日本語校正ルール
├── proofread-structure.md    # 章構造検証ルール
├── proofread-terms.md        # 用語統一ルール
├── proofread-markdown.md     # Markdown検証ルール
├── proofread-facts.md        # ファクトチェックルール
│
│  # 校閲系（Editing）
├── proofread-logic.md        # 論理検証ルール
├── proofread-claims.md       # 主張検証ルール
├── proofread-consistency.md  # 整合性検証ルール
│
│  # ユーティリティ
├── extract-terms.md          # 用語抽出スキル
└── terminology.yaml          # /extract-terms 実行後に生成
```

## 出力形式

校正・校閲結果は重要度別に分類されます：

| 重要度 | 記号 | 説明 |
| --- | --- | --- |
| 重大 | 🔴 | 修正必須（誤り、矛盾、出典なし） |
| 警告 | 🟡 | 修正推奨（表記揺れ、論理の飛躍） |
| 提案 | 🔵 | 改善可能（冗長表現、表現の強さ） |

## 出力例

```markdown
## 校正・校閲結果レポート

### サマリー
- 対象ファイル: 01_the-seventy-percent-problem.md
- 検出数: 🔴 重大: 2件 / 🟡 警告: 5件 / 🔵 提案: 8件

---

### 🔴 重大な問題

1. **[行227]** ファクトチェック: 論文の正式名称が不明確
   - 現在: 「スタンフォード大学の研究者たちが発見した」
   - 推奨: 論文名と著者を追記
   - 参照: arXiv:2307.03172

2. **[行45 ↔ 行320]** 論理校閲: 主張の矛盾
   - 行45: 「AIは万能ではない」
   - 行320: 「AIを使えば必ず成功する」
   - 推奨: 条件を明確にして両立させる

### 🟡 警告

1. **[行52]** 用語揺れ: 「コンテキスト」と「コンテクスト」が混在
   - 推奨: 「コンテキスト」に統一

2. **[行156]** 主張校閲: 過度な断言
   - 現在: 「常にこの方法を使うべき」
   - 推奨: 「多くの場合」などの限定を追加
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
- **マイクロスコープ**: スキルを細分化して再利用性・組み合わせ性を向上

## 校正と校閲の違い

| 観点 | 校正（Proofreading） | 校閲（Editing） |
|------|----------------------|-----------------|
| 目的 | 誤字脱字・表記ミスの修正 | 内容の正確性・論理性の検証 |
| 対象 | 文字、記号、レイアウト | 事実、論理、整合性 |
| 専門知識 | 日本語・表記ルール | 該当分野の知識 |
| 実行タイミング | 執筆後〜校了前 | 初稿完成後〜校正前 |

## 関連ドキュメント

- [CLAUDE.md](../../CLAUDE.md) - プロジェクト全体のAI向けガイドライン
- [books/](../../books/) - 校正対象の書籍ディレクトリ
