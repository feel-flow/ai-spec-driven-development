---
description: 書籍の文章校正を実行（日本語・構造・用語・Markdown・ファクトチェック）
---

# 文章校正コマンド

引数で指定されたファイルまたはディレクトリに対して、総合的な文章校正を実行してください。

## 実行手順

1. `.claude/skills/proofread.md` のスキル内容を読み込む
2. 関連するサブスキルも参照:
   - `proofread-japanese.md` - 日本語校正
   - `proofread-structure.md` - 章構造検証
   - `proofread-terms.md` - 用語統一
   - `proofread-markdown.md` - Markdown検証
   - `proofread-facts.md` - ファクトチェック
3. 指定されたファイルを校正し、結果をレポート

## 引数

- `$ARGUMENTS` - 校正対象のファイルパスまたはディレクトリ
- `focus:` オプションで特定の観点のみ実行可能（例: `focus:japanese`）

## 使用例

```
/proofread books/ai-small-is-accurate/part1_why-ai-fails/01_the-seventy-percent-problem.md
/proofread books/ai-small-is-accurate/ focus:facts
```
