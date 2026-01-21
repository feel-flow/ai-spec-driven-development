---
name: extract-terms
description: 既存の書籍本文から用語を自動抽出し、terminology.yamlを生成するスキル
triggers:
  - "用語を抽出して"
  - "用語集を作成して"
  - "/extract-terms"
---

# 用語抽出スキル（/extract-terms）

## 概要

既存の書籍本文を解析し、用語集（`terminology.yaml`）を自動生成します。
校正スキルで用語統一チェックを行う前に、このスキルを実行して用語集を作成してください。

## 使用方法

```bash
# 特定の書籍から抽出
/extract-terms books/ai-small-is-accurate/

# 全書籍から抽出
/extract-terms books/

# 既存の用語集を更新
/extract-terms books/ --update
```

## 抽出対象

### 1. カタカナ語

連続するカタカナ文字列を抽出：

- コンテキスト、エンジニア、プロジェクト
- フレームワーク、コンポーネント
- インターフェース、アーキテクチャ

### 2. 固有名詞

大文字を含む英語の固有名詞：

- Claude Code, ChatGPT, GitHub
- TypeScript, JavaScript, React
- Anthropic, OpenAI, Google

### 3. 略語

大文字の連続または括弧内の略語：

- LLM, AI, API, JWT, PR
- 「プルリクエスト（PR）」形式から抽出

### 4. 専門用語

本プロジェクト固有の概念：

- 仕様駆動開発
- コンテキストエンジニアリング
- 70%問題
- Lost in the Middle

## 抽出プロセス

### ステップ1：ファイル収集

```
対象: books/**/*.md
除外: 00_toc.md, _metadata.md, images/
```

### ステップ2：トークン化と分類

```python
# 擬似コード
for file in markdown_files:
    text = extract_text(file)

    # カタカナ語抽出
    katakana = regex.findall(r'[ァ-ヶー]+', text)

    # 固有名詞抽出（英語）
    proper_nouns = regex.findall(r'[A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*)*', text)

    # 略語抽出
    abbreviations = regex.findall(r'\b[A-Z]{2,}\b', text)

    # 括弧内の略語
    abbrev_with_full = regex.findall(r'([^（]+)（([A-Z]+)）', text)
```

### ステップ3：頻度カウントと標準表記の決定

```yaml
# 頻度が最も高い表記を標準とする
term_analysis:
  - candidates: ["コンテキスト", "コンテクスト"]
    frequency:
      "コンテキスト": 45
      "コンテクスト": 3
    standard: "コンテキスト"  # 頻度が高い方を採用
```

### ステップ4：YAML出力

## 出力形式（terminology.yaml）

```yaml
# .claude/skills/proofreading/terminology.yaml
# 自動生成: /extract-terms コマンド
# 最終更新: YYYY-MM-DD HH:MM:SS

version: "1.0"
generated_at: "2024-01-15T10:00:00Z"
source_files:
  - books/ai-spec-driven-development-90percent/
  - books/ai-small-is-accurate/

# ===================================
# コア概念
# ===================================
core_concepts:
  - standard: "仕様駆動開発"
    variants:
      - "Spec-driven development"
      - "spec駆動開発"
    frequency: 28
    first_appearance: "part1/01_typical-failure-patterns.md:15"
    description: "AIとの協働において仕様を中心に据えた開発手法"

  - standard: "コンテキストエンジニアリング"
    variants:
      - "Context Engineering"
      - "文脈エンジニアリング"
    frequency: 15
    first_appearance: "part2/03_context-engineering.md:1"

  - standard: "70%問題"
    variants:
      - "70%の完成度"
      - "七割問題"
    frequency: 22
    first_appearance: "part1/01_the-seventy-percent-problem.md:1"

# ===================================
# 技術用語
# ===================================
technical_terms:
  - standard: "コンテキスト"
    variants:
      - "コンテクスト"
      - "context"
    frequency: 89
    note: "長音符ありの「コンテキスト」を標準とする"

  - standard: "プルリクエスト"
    short_form: "PR"
    variants:
      - "Pull Request"
      - "プルリク"
    frequency: 34
    requires_initial_explanation: true

  - standard: "大規模言語モデル"
    short_form: "LLM"
    variants:
      - "Large Language Model"
    frequency: 28
    requires_initial_explanation: true

# ===================================
# 製品・サービス名
# ===================================
product_names:
  - standard: "Claude Code"
    variants:
      - "claude code"
      - "ClaudeCode"
    frequency: 42
    case_sensitive: true
    official_url: "https://claude.ai/code"

  - standard: "ChatGPT"
    variants:
      - "chatGPT"
      - "Chat GPT"
      - "chatgpt"
    frequency: 31
    case_sensitive: true

  - standard: "GitHub"
    variants:
      - "Github"
      - "github"
    frequency: 56
    case_sensitive: true

  - standard: "GitHub Copilot"
    variants:
      - "Github Copilot"
      - "copilot"
    frequency: 18
    case_sensitive: true

# ===================================
# 長音符の統一
# ===================================
katakana_standards:
  - standard: "ユーザー"
    variant: "ユーザ"
    rule: "長音符あり"

  - standard: "サーバー"
    variant: "サーバ"
    rule: "長音符あり"

  - standard: "ブラウザー"
    variant: "ブラウザ"
    rule: "長音符あり"

  - standard: "エンジニア"
    note: "長音符なしが標準"

# ===================================
# 略語一覧
# ===================================
abbreviations:
  - abbreviation: "PR"
    full_form: "プルリクエスト（Pull Request）"
    requires_explanation: true

  - abbreviation: "LLM"
    full_form: "大規模言語モデル（Large Language Model）"
    requires_explanation: true

  - abbreviation: "AI"
    full_form: "人工知能（Artificial Intelligence）"
    requires_explanation: false  # 一般的に認知されている

  - abbreviation: "API"
    full_form: "Application Programming Interface"
    requires_explanation: false

  - abbreviation: "JWT"
    full_form: "JSON Web Token"
    requires_explanation: true
```

## オプション

| オプション | 説明 |
| --- | --- |
| `--update` | 既存のterminology.yamlを更新（新規用語のみ追加） |
| `--force` | 既存ファイルを上書き |
| `--dry-run` | 実際には書き込まず、結果をプレビュー |
| `--min-freq N` | 出現頻度N回以上の用語のみ抽出（デフォルト: 2） |

## 出力例

```markdown
## 用語抽出結果

### 統計
- スキャンしたファイル: 24個
- 抽出した用語: 156個
- カテゴリ:
  - コア概念: 8個
  - 技術用語: 45個
  - 製品名: 23個
  - カタカナ語: 67個
  - 略語: 13個

### 表記揺れの検出
以下の用語で表記揺れが見つかりました：

1. **コンテキスト** vs **コンテクスト**
   - 「コンテキスト」: 45回
   - 「コンテクスト」: 3回
   - 推奨: 「コンテキスト」に統一

2. **ユーザー** vs **ユーザ**
   - 「ユーザー」: 28回
   - 「ユーザ」: 5回
   - 推奨: 「ユーザー」に統一

### 生成されたファイル
- .claude/skills/proofreading/terminology.yaml

次のステップ：
`/proofread` を実行して、この用語集に基づいた校正を開始できます。
```

## 注意事項

1. **コードブロック内は除外**
   - ` ``` ` で囲まれた部分は用語抽出の対象外

2. **手動での調整が必要な場合**
   - 自動抽出後、`terminology.yaml` を手動で調整可能
   - `note` フィールドに理由を記載推奨

3. **更新時の動作**
   - `--update` 使用時は既存の設定を保持し、新規用語のみ追加
   - 手動で追加した `note` や `description` は上書きされない
