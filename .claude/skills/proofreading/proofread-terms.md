---
name: proofread-terms
description: 用語の統一性と一貫した表記をチェックするスキル
---

# 用語統一チェックスキル

## 役割

書籍全体で用語が統一されているかを検証します。`terminology.yaml` が存在する場合はそれを参照し、存在しない場合は `/extract-terms` の実行を推奨します。

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
| 外来語 | レビュー | レビュウ |
| 漢字 | および | 及び |
| 漢字 | または | 又は |
| 漢字 | 〜のとき | 〜の時 |
| 漢字 | 〜のこと | 〜の事 |

#### 本プロジェクト固有の用語

`terminology.yaml` から読み込む用語：

```yaml
# 例：terminology.yaml の形式
terms:
  - standard: "仕様駆動開発"
    variants: ["Spec-driven development", "スペック駆動開発"]
    category: "core-concept"

  - standard: "コンテキストエンジニアリング"
    variants: ["Context Engineering", "文脈エンジニアリング"]
    category: "core-concept"

  - standard: "Claude Code"
    variants: ["claude code", "ClaudeCode", "claude-code"]
    category: "product-name"
```

### 2. 略語ルール

#### 初出時の説明

略語は初出時にフルスペルで説明が必要です。

```
🔴 悪い例：
「PRを作成してください。」（初出で説明なし）

✅ 良い例：
「プルリクエスト（PR）を作成してください。」（初出）
「PRを作成してください。」（2回目以降）
```

#### 主要な略語一覧

| 略語 | フルスペル | 初出時の書き方 |
| --- | --- | --- |
| PR | Pull Request | プルリクエスト（PR） |
| LLM | Large Language Model | 大規模言語モデル（LLM） |
| AI | Artificial Intelligence | 人工知能（AI）または AI（説明不要の場合） |
| JWT | JSON Web Token | JSON Web Token（JWT） |
| API | Application Programming Interface | API（一般的に説明不要） |
| UI | User Interface | UI（一般的に説明不要） |
| UX | User Experience | ユーザー体験（UX） |
| CRUD | Create, Read, Update, Delete | CRUD操作 |

### 3. 固有名詞の正確性

#### 製品・サービス名

| 正 | 誤 |
| --- | --- |
| Claude Code | claude code, ClaudeCode |
| GitHub | Github, github, GITHUB |
| GitHub Copilot | Github Copilot, github copilot |
| ChatGPT | chatGPT, Chat GPT, chatgpt |
| TypeScript | Typescript, typescript |
| JavaScript | Javascript, javascript |
| Node.js | NodeJS, node.js, Nodejs |
| Next.js | NextJS, next.js, Nextjs |
| React | react, REACT |
| VS Code | VSCode, vscode, VS code |
| PostgreSQL | Postgres, PostgresSQL |
| MongoDB | Mongodb, mongodb |

#### 企業・組織名

| 正 | 誤 |
| --- | --- |
| Anthropic | anthropic, ANTHROPIC |
| OpenAI | Open AI, openAI |
| Google | google, GOOGLE |
| Microsoft | microsoft, MICROSOFT |

### 4. 長音符の統一

JIS規格に基づく原則：

> 3音節以上の語は長音符を省略可能、2音節以下は省略不可

ただし、本プロジェクトでは**統一性を優先**し、以下を推奨：

| 推奨 | 省略形（非推奨） |
| --- | --- |
| ユーザー | ユーザ |
| サーバー | サーバ |
| ブラウザー | ブラウザ |
| コンピューター | コンピュータ |
| プログラマー | プログラマ |
| エンジニア | （変化なし） |
| データ | （変化なし） |

### 5. 数字の表記

#### 全角・半角の統一

| 文脈 | 推奨 | 例 |
| --- | --- | --- |
| 本文中の数値 | 半角 | 70%、100個、3つ |
| 連番・順序 | 半角 | 1つ目、第2章 |
| 日付 | 半角 | 2023年、12月 |
| 桁区切り | 使わない | 10000（10,000は避ける） |

#### 単位との組み合わせ

```
✅ 良い例：
- 200行
- 5000字
- 30分
- 70%

🔴 悪い例：
- 200 行（スペースあり）
- ２００行（全角）
```

## 検証方法

### 1. 用語集ベースの検証

`terminology.yaml` が存在する場合：

1. 各用語の `variants` をファイル内で検索
2. `standard` 以外の表記が見つかった場合は警告
3. 出現位置（行番号）を記録

### 2. パターンベースの検証

用語集がない場合でも検出可能なパターン：

1. 長音符の揺れ（正規表現でマッチ）
2. 固有名詞の大文字小文字（既知のリストと照合）
3. 略語の初出チェック（略語の出現順を追跡）

## 出力形式

```markdown
### 用語統一チェック結果

#### 🔴 表記揺れ（修正必須）

1. **「コンテキスト」と「コンテクスト」が混在**
   - 「コンテキスト」: 行12, 行45, 行89
   - 「コンテクスト」: 行67
   - 推奨: 「コンテキスト」に統一

2. **固有名詞の誤り**
   - 行XX: 「Github」→「GitHub」

#### 🟡 略語の問題（修正推奨）

1. **行XX**: 「PR」が説明なしで初出
   - 推奨: 「プルリクエスト（PR）」と初出時に説明

#### 🔵 改善提案

1. **長音符の統一**
   - 行XX: 「ユーザ」→「ユーザー」
   - （機能的には問題なし、統一性のため推奨）

---

### 用語統計

| 用語 | 出現回数 | 揺れの有無 |
| --- | --- | --- |
| コンテキスト | 15 | ✅ |
| AI | 42 | ✅ |
| PR | 8 | 🟡 初出説明なし |
| Claude Code | 12 | ✅ |
```

## terminology.yaml の形式

```yaml
# .claude/skills/proofreading/terminology.yaml
version: "1.0"
generated_at: "2024-01-15T10:00:00Z"
source_files:
  - books/ai-spec-driven-development-90percent/
  - books/ai-small-is-accurate/

terms:
  # コア概念
  - standard: "仕様駆動開発"
    variants: ["Spec-driven development", "spec駆動開発"]
    category: "core-concept"
    first_appearance: "part1/01_typical-failure-patterns.md:15"

  - standard: "コンテキスト"
    variants: ["コンテクスト", "context"]
    category: "technical"
    note: "「コンテキスト」を標準とする"

  # 製品名
  - standard: "Claude Code"
    variants: ["claude code", "ClaudeCode"]
    category: "product"
    case_sensitive: true

  # 略語
  - standard: "プルリクエスト（PR）"
    short_form: "PR"
    category: "abbreviation"
    requires_initial_explanation: true
```

## チェックリスト

検証時に確認すべき項目：

- [ ] 同一概念の表記が統一されているか
- [ ] 長音符の使用が統一されているか
- [ ] 固有名詞の大文字小文字が正しいか
- [ ] 略語は初出時に説明されているか
- [ ] 数字は半角で統一されているか
- [ ] terminology.yaml の用語と一致しているか
