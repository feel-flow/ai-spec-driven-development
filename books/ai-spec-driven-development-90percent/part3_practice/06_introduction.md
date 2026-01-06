# 第6章　導入手順：既存プロジェクト／新規プロジェクト

## この章で学ぶこと

- 新規プロジェクトでの7文書構成の始め方
- 既存プロジェクトへの段階的な導入方法
- 「最初から完璧」を捨てる実践的アプローチ

---

## 新規プロジェクト：docs構造を作り、最初の7文書を生成する

### ステップ1：ディレクトリ構造の作成

まず、番号付きディレクトリ構造を作成します。番号付けにより、ファイルが増えても整理しやすくなります。

```bash
# ディレクトリ構造を作成
mkdir -p docs/{00-planning,01-context,02-design,03-implementation,04-quality,05-operations,06-reference,07-project-management,08-knowledge}

# 7文書を作成
touch docs/MASTER.md
touch docs/01-context/PROJECT.md
touch docs/02-design/ARCHITECTURE.md
touch docs/02-design/DOMAIN.md
touch docs/03-implementation/PATTERNS.md
touch docs/04-quality/TESTING.md
touch docs/05-operations/DEPLOYMENT.md
```

作成される構造：

```text
docs/
├── MASTER.md                      # 索引・ナビゲーション
├── 00-planning/                   # 企画段階の文書
├── 01-context/
│   └── PROJECT.md                 # ビジョン・要件
├── 02-design/
│   ├── ARCHITECTURE.md            # システム設計
│   └── DOMAIN.md                  # ビジネスロジック
├── 03-implementation/
│   └── PATTERNS.md                # 実装パターン
├── 04-quality/
│   └── TESTING.md                 # テスト戦略
├── 05-operations/
│   └── DEPLOYMENT.md              # 運用手順
├── 06-reference/                  # API仕様・外部参照
├── 07-project-management/         # 進捗・チケット管理
└── 08-knowledge/                  # ナレッジ・ADR
```

### ステップ2：MASTER.mdを最初に書く

MASTER.mdは他の文書へのナビゲーションです。最初に骨格を作ります。

```markdown
---
title: MASTER.md
version: 0.1.0
status: draft
owner: "@your-name"
created: 2024-01-01
updated: 2024-01-01
---

# プロジェクト名

## 概要
[1〜2文でプロジェクトの目的を記述]

## 技術スタック
- 言語：[未定]
- フレームワーク：[未定]
- データベース：[未定]

## 文書索引
| 文書 | 状態 | 説明 |
|------|------|------|
| [PROJECT.md](./01-context/PROJECT.md) | draft | ビジョン・要件 |
| [ARCHITECTURE.md](./02-design/ARCHITECTURE.md) | draft | システム設計 |
| [DOMAIN.md](./02-design/DOMAIN.md) | draft | ビジネスロジック |
| [PATTERNS.md](./03-implementation/PATTERNS.md) | draft | 実装パターン |
| [TESTING.md](./04-quality/TESTING.md) | draft | テスト戦略 |
| [DEPLOYMENT.md](./05-operations/DEPLOYMENT.md) | draft | 運用手順 |

## ディレクトリ構造
```text
（プロジェクト構造が決まり次第記述）
```
```

### ステップ3：PROJECT.mdでビジョンを固める

技術的な詳細より先に、「何を作るのか」「誰のためか」を明確にします。

```markdown
---
title: PROJECT.md
version: 0.1.0
status: draft
owner: "@your-name"
created: 2024-01-01
updated: 2024-01-01
---

# PROJECT.md

## ビジョン
[このプロジェクトが実現したい世界を1〜2文で]

## 解決する課題
[ユーザーが抱える具体的な問題]

## ターゲットユーザー
- ペルソナ1：[具体的な人物像]
- ペルソナ2：[具体的な人物像]

## 主要機能（MVP）
1. [機能A]：[説明]
2. [機能B]：[説明]
3. [機能C]：[説明]

## スコープ外（MVPでは作らないもの）
- [機能X]：[理由]
- [機能Y]：[理由]
```

### ステップ4：残りの文書は「最小限」で開始

最初から完璧な文書を作る必要はありません。各文書は**見出しだけ**でも構いません。

```markdown
---
title: ARCHITECTURE.md
version: 0.1.0
status: draft
owner: "@your-name"
created: 2024-01-01
updated: 2024-01-01
---

# ARCHITECTURE.md

## システム構成
（設計が進んだら記述）

## 技術スタック
（決定次第記述）

## コンポーネント設計
（実装開始時に記述）
```

**大事なのは「場所を確保すること」** です。

---

## 既存プロジェクト：既存設計を"吸い上げ"て、欠けた文書を補完する

### ステップ1：現状把握

既存プロジェクトには、散在した情報がすでにあります。まずそれを洗い出します。

```markdown
## 既存情報の棚卸し

### README.md
- [ ] プロジェクト概要 → MASTER.mdに転記
- [ ] セットアップ手順 → DEPLOYMENT.mdに転記

### 既存ドキュメント
- [ ] API仕様書 → ARCHITECTURE.mdに転記
- [ ] ER図 → DOMAIN.mdに転記
- [ ] テスト手順 → TESTING.mdに転記

### コード内コメント
- [ ] 重要なビジネスロジック → DOMAIN.mdに転記
- [ ] 設計意図のコメント → ARCHITECTURE.mdに転記

### チャットログ・議事録
- [ ] 技術選定の経緯 → ARCHITECTURE.md（ADR）に転記
- [ ] 要件の合意事項 → PROJECT.mdに転記
```

### ステップ2：優先順位をつける

すべてを一度にやろうとしないでください。以下の優先順位で進めます。

| 優先度 | 文書 | 理由 |
|--------|------|------|
| 1 | MASTER.md | 他の文書への入り口 |
| 2 | PATTERNS.md | 日々の開発で最も参照される |
| 3 | ARCHITECTURE.md | 新規実装時に必須 |
| 4 | DOMAIN.md | ビジネスロジックの誤解を防ぐ |
| 5 | TESTING.md | 品質基準を統一 |
| 6 | PROJECT.md | 長期的な方向性 |
| 7 | DEPLOYMENT.md | 運用が安定してから |

### ステップ3：AIに「吸い上げ」を手伝わせる

既存コードから情報を抽出するのは、AIが得意な作業です。

```markdown
## プロンプト例：コードから設計意図を抽出

以下のコードを分析して、ARCHITECTURE.mdに記載すべき設計方針を抽出してください。

[コードを貼り付け]

以下の観点で整理してください：
- レイヤー構成
- 依存関係の方向
- エラーハンドリングのパターン
- 使用しているデザインパターン
```

```markdown
## プロンプト例：テストからテスト戦略を抽出

以下のテストコードを分析して、TESTING.mdに記載すべきテスト方針を抽出してください。

[テストコードを貼り付け]

以下の観点で整理してください：
- テストの種類（Unit/Integration/E2E）
- モック戦略
- テストデータの管理方法
- アサーションのパターン
```

### ステップ4：段階的に育てる

最初は「現状を記録した」だけの文書でOKです。

その後、以下のタイミングで文書を育てていきます：

- **新機能追加時**：PROJECT.mdに機能を追記、ARCHITECTURE.mdに設計を追記
- **バグ修正時**：DOMAIN.mdにルールを明確化、PATTERNS.mdにアンチパターンを追記
- **レビュー指摘時**：PATTERNS.mdにパターンを蓄積
- **障害発生時**：DEPLOYMENT.mdにRunbookを追加

---

## 「最初から完璧」を捨てる

### パレートの法則を適用する

文書の80%の価値は、20%の労力で生み出せます。

| 完成度 | 得られる価値 | 必要な労力 |
|--------|------------|-----------|
| 20% | 骨格だけでもAIは参照できる | 1時間 |
| 50% | 日常の開発で十分使える | 3時間 |
| 80% | ほぼ完璧、例外対応も記載 | 1日 |
| 100% | 完璧（ただし陳腐化が早い） | 1週間 |

**狙うべきは50%の完成度**です。

### ドラフト→レビュー→更新の反復

完璧を目指すより、**反復で育てる**ほうが効率的です。

```
ドラフト（30分）
  ↓
実際に使ってみる
  ↓
「これが足りない」と気づく
  ↓
更新（15分）
  ↓
また使ってみる
  ↓
...
```

この反復を3回繰り返せば、使い物になる文書が完成します。

### 「最小限で始める」テンプレート

各文書の最小限バージョンを示します。

```markdown
# ARCHITECTURE.md（最小限版）

## 技術スタック
- Backend: Node.js + Express
- Database: PostgreSQL
- Cache: Redis

## レイヤー構成
API → Service → Repository → Database

## 最重要ルール
- Service層にビジネスロジックを集約
- Repositoryは純粋なデータアクセスのみ
- 直接SQLは書かない（ORMを使用）
```

これだけあれば、AIは「Serviceにロジックを書く」「Repositoryは薄く保つ」という判断ができます。

---

## 章末チェックリスト

### 新規プロジェクトの場合

- [ ] 番号付きディレクトリ構造（00〜08）と7つの文書を作成した
- [ ] MASTER.mdに概要と文書索引を書いた
- [ ] PROJECT.mdにビジョンとMVP機能を書いた
- [ ] 他の文書は見出しだけでも作成した

### 既存プロジェクトの場合

- [ ] 既存情報の棚卸しを行った
- [ ] 優先順位に基づいて、まずMASTER.mdを作成した
- [ ] 次にPATTERNS.md（またはARCHITECTURE.md）を作成した
- [ ] 残りは「今後育てる」と割り切った

---

## 次章への橋渡し

この章では、7文書構成の導入手順を学びました。

次章では、**日々の開発フロー**——Issueを作り、AIにタスクを渡し、PRを出すまでの流れを解説します。冒頭で紹介した「3つの戦略」を、具体的なワークフローに落とし込みます。
