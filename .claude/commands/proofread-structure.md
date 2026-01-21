---
description: 章のフォーマット・構造が規定に準拠しているかチェック
---

# 章構造検証コマンド

引数で指定されたファイルの章構造が書籍の規定フォーマットに準拠しているかを検証してください。

## 実行手順

1. `.claude/skills/proofread-structure.md` のスキル内容を読み込む
2. 指定されたファイルの構造を検証
3. 結果をレポート

## 検証項目

- 必須セクションの存在（この章で学ぶこと、章末チェックリスト、次章への橋渡し）
- 見出しレベルの適切さ（H1→H2→H3の順序）
- 区切り線の配置
- 学習目標・チェックリストの形式

## 引数

- `$ARGUMENTS` - 検証対象のファイルパス

## 使用例

```
/proofread-structure books/ai-small-is-accurate/part1_why-ai-fails/01_the-seventy-percent-problem.md
```
