---
description: 書籍本文から用語を抽出してterminology.yamlを生成
---

# 用語抽出コマンド

引数で指定されたディレクトリ内の書籍本文から用語を自動抽出し、用語集を生成してください。

## 実行手順

1. `.claude/skills/extract-terms.md` のスキル内容を読み込む
2. 指定ディレクトリ内の `.md` ファイルをスキャン
3. カタカナ語、固有名詞、略語を抽出
4. `.claude/skills/terminology.yaml` を生成

## 引数

- `$ARGUMENTS` - 抽出対象のディレクトリパス

## 使用例

```
/extract-terms books/
/extract-terms books/ai-small-is-accurate/
```

## 出力

生成される `terminology.yaml` は `/proofread` コマンドで用語統一チェックに使用されます。
