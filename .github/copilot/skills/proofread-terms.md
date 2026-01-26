---
name: github-copilot-proofread-terms
description: 用語の統一性と一貫した表記をチェックするスキル
scope: terminology-consistency
agent: github-copilot
triggers:
  - "用語を統一"
  - "用語をチェック"
  - "表記揺れ確認"
---

# GitHub Copilot 用語統一スキル

## 役割

PR コメントで書籍内の用語が統一されているかを検証します。`books/ai-small-is-accurate/.proofreading/terminology.yaml` が存在する場合はそれを参照します。

**このスキルの特徴：**
- スコープが小さい（用語統一のみに集中）
- PR コメント形式での出力
- 表記揺れの一貫性チェック

## 検証対象

### 1. 表記揺れ

同一概念が異なる表記で登場していないかをチェックします。

#### よくある表記揺れパターン

| カテゴリ | 推奨 | 揺れパターン |
| --- | --- | --- |
| 長音符 | ユーザー | ユーザ |
| 長音符 | サーバー | サーバ |
| 長音符 | コンピューター | コンピュータ |
| 長音符 | ブラウザー | ブラウザ |
| 外来語 | コンテキスト | コンテクスト |
| 外来語 | インターフェース | インタフェース |
| 漢字 | および | 及び |
| 漢字 | または | 又は |
| 数字 | 2 つ | 2つ、二つ |

### 2. 本プロジェクト固有の用語

`books/ai-small-is-accurate/.proofreading/terminology.yaml` から読み込まれる用語：

```yaml
terms:
  - standard: "仕様駆動開発"
    variants: ["Spec-driven development", "スペック駆動開発"]
    category: "core-concept"

  - standard: "コンテキストエンジニアリング"
    variants: ["Context Engineering", "文脈エンジニアリング"]
    category: "core-concept"

  - standard: "AI侍"
    variants: ["AI 侍", "あいさむらい"]
    category: "character"

  - standard: "DJ町娘"
    variants: ["DJ 町娘"]
    category: "character"
```

## 出力形式

```markdown
## 用語統一レビュー結果

**対象ファイル**: [ファイル名]  
**検出した表記揺れ**: X件

### 🟡 警告（統一推奨）

1. **[行番号]** 用語の表記揺れ
   - 検出: 「ユーザ」「ユーザー」が混在
   - 推奨: 「ユーザー」に統一
   - 箇所: [行番号] など X 箇所

2. **[行番号]** 用語の不統一
   - 検出: 「コンテクスト」
   - 推奨: 「コンテキスト」に統一
```

## 使用例（PR コメント）

```markdown
## 用語統一レビュー

**対象ファイル**: 01_why-ai-fails.md

🟡 2 件の表記揺れが見つかりました

### 🟡 警告

1. **複数箇所** 「ユーザ」「ユーザー」の混在
   - 推奨: 「ユーザー」に統一
   - 箇所: L23, L45, L67

2. **複数箇所** 「且つ」「かつ」「および」の混在
   - 推奨: 「かつ」で統一
   - 箇所: L12, L34, L56

---

統一をお願いします。
```

## 参照リソース

- `books/ai-small-is-accurate/.proofreading/terminology.yaml` - プロジェクト用語定義

## 注意事項

- このスキルは**用語統一のみ**をチェック
- 日本語表現は `proofread-japanese` スキルで担当
- ファクトチェックは `proofread-facts` スキルで担当
