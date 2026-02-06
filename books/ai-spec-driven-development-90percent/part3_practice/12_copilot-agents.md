# 第12章　ツール実装（後編）：GitHub Copilot Skills & Agentsで"仕様駆動"を自動化する

## この章で学ぶこと

- オープンスタンダード「Agent Skills」の仕組みと意義
- SKILL.md形式によるスキル作成方法
- 仕様駆動開発向けSkillsテンプレート（3種）
- Skills vs Agents の使い分け
- カスタムエージェントによる専門レビュー

---

## 読者へのメッセージ

前章（第11章）では**Claude Code Skills**を取り上げました。本章では**GitHub Copilot**側の仕組みを解説します。

ここで朗報があります。2025年12月、Anthropicが発表した**Agent Skills**というオープンスタンダードにより、Claude CodeとGitHub Copilotで**同じスキルファイルを共有**できるようになりました。

> **つまり**: `.github/skills/` に置いたスキルは、Claude CodeでもGitHub Copilotでも動きます。仕様駆動開発のノウハウを1回書けば、どちらのツールでも使い回せるのです。

| 章 | 対象ツール | 内容 |
|----|-----------|------|
| 前章（第11章） | Claude Code | Skills、pr-review-toolkit |
| 本章（第12章） | GitHub Copilot | Skills（共通）、カスタムエージェント |

---

## オープンスタンダード「Agent Skills」

### Agent Skillsとは

2025年12月18日、Anthropicは**Agent Skills**というオープンスタンダードを発表しました。仕様は[agentskills.io](https://agentskills.io/specification)で公開されています。

Agent Skillsの核心は **「AIエージェントへの指示書を、ツール横断で共有できる標準形式にする」** ことです。

| 項目 | 内容 |
|------|------|
| 仕様公開場所 | [agentskills.io/specification](https://agentskills.io/specification) |
| ファイル形式 | `SKILL.md`（YAML frontmatter + Markdown本文） |
| 採用ツール | Claude Code, GitHub Copilot, Cursor, OpenAI Codex |
| 管理団体 | Anthropic（オープンスタンダードとして公開） |

### なぜオープンスタンダードが重要か

第10章で解説した**AGENTS.md**を覚えていますか？ あれは「設定ファイル」の標準化でした。Agent Skillsは **「スキル（手順書）」の標準化** です。

```text
AGENTS.md     → AIへの基本設定（コーディングルール等）
SKILL.md      → AIへのタスク手順（テスト方法、レビュー基準等）
```

どちらもオープンスタンダードなので、ツールに依存しません。チームの誰かがClaude Codeを使い、別の誰かがGitHub Copilotを使っていても、**同じスキルが同じように動く**のです。

### Claude Code Skillsとの共通性

GitHub公式ドキュメントにはこう書かれています。

> "If you've already set up skills for Claude Code in the `.claude/skills` directory in your repository, Copilot will pick them up automatically."

つまり、`.claude/skills/` に置いたスキルをGitHub Copilotも**自動検出**します。逆も同様で、`.github/skills/` に置いたスキルをClaude Codeも読めます。

| 保存場所 | Claude Code | GitHub Copilot |
|---------|-------------|----------------|
| `.github/skills/` | 読める | 読める（推奨） |
| `.claude/skills/` | 読める（推奨） | 読める |

### Progressive Disclosure（段階的読み込み）

Agent Skillsは**Progressive Disclosure**という3段階の読み込み方式を採用しています。

**なぜ段階的か？** スキルを100個入れても、コンテキストウィンドウを圧迫しないようにするためです。

| レベル | 読み込み内容 | トークン量 | タイミング |
|--------|-------------|-----------|-----------|
| Level 1 | `name` と `description` のみ | 約100トークン/スキル | 起動時（常に） |
| Level 2 | SKILL.md の本文全体 | 推奨5,000トークン以下 | プロンプトが合致した時 |
| Level 3 | scripts/ や references/ の中身 | 必要に応じて | エージェントが参照した時 |

**ポイント**: `description` フィールドの書き方が重要です。ここが曖昧だと、AIがスキルを見つけられません。

```yaml
# 悪い例 — 曖昧すぎてAIが判断できない
description: テストに関するスキル

# 良い例 — いつ使うかが明確
description: >
  プロジェクトのテストパターンに従ってユニットテストを作成する。
  新しいファイルのテストを書く時や、テストカバレッジを改善する時に使用。
```

---

## Skillsの作成方法

### SKILL.md のフォーマット

スキルは `SKILL.md` という名前のMarkdownファイルで定義します。YAML frontmatter（メタデータ）と本文（手順書）で構成されます。

```markdown
---
name: skill-name
description: >
  スキルの説明。何をするか＋いつ使うかを書く。
  AIはこのフィールドを見て自動的にスキルを選択する。
license: MIT
compatibility: Requires Node.js 18+
metadata:
  author: your-team
  version: "1.0"
---

# スキル名

## 手順

1. まず〇〇を確認する
2. 次に〇〇を実行する
3. 最後に〇〇を検証する

## 例

（入出力の具体例）

## エッジケース

（注意すべき特殊ケース）
```

### frontmatter フィールド一覧

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `name` | はい | スキル名（小文字・ハイフン区切り、64文字以内） |
| `description` | はい | 説明（1024文字以内）。**いつ使うか**を必ず含める |
| `license` | いいえ | ライセンス名 |
| `compatibility` | いいえ | 実行環境の要件 |
| `metadata` | いいえ | 任意のキー/値ペア |

### ディレクトリ構造

```text
.github/skills/
└── review-standards/
    ├── SKILL.md              # 必須 — 手順書
    ├── scripts/              # 任意 — 実行スクリプト
    │   └── check-patterns.sh
    └── references/           # 任意 — 参考資料
        └── style-guide.md
```

**ルール**: ディレクトリ名と `name` フィールドは**完全に一致**させる必要があります。

### プロジェクトスキル vs パーソナルスキル

| 種類 | 保存場所 | 共有範囲 | 用途 |
|------|---------|---------|------|
| プロジェクトスキル | `.github/skills/` | リポジトリ全員 | チーム共通のワークフロー |
| パーソナルスキル | `~/.copilot/skills/` | 自分だけ | 個人の生産性向上 |

**プロジェクトスキル**はGitで管理されるため、チーム全員が自動的に同じスキルを使えます。これは仕様駆動開発の「チームの暗黙知を明示知にする」という考え方と完全に一致します。

**パーソナルスキル**は個人のホームディレクトリに置くため、チームには共有されません。自分だけの作業効率化に使います。

---

## 仕様駆動開発向けSkills（テンプレート）

以下は、仕様駆動開発チームが**すぐに使えるスキルテンプレート**です。`.github/skills/` に配置すれば、Claude CodeでもGitHub Copilotでも動きます。

### 1. code-review-standards

コードレビューの基準をスキルとして定義します。

```markdown
---
name: code-review-standards
description: >
  プロジェクトのコーディング規約とアーキテクチャガイドラインに基づいてコードレビューを実行する。
  PRのレビュー、コード品質チェック、コーディング規約の確認時に使用。
metadata:
  author: your-team
  version: "1.0"
---

# コードレビュー標準

## レビュー手順

1. プロジェクトのガイドライン（CLAUDE.md / AGENTS.md）を読む
2. 変更されたファイルを `git diff` で特定する
3. 各変更をガイドラインと照合する
4. 信頼度80以上の問題のみ報告する

## レビュー観点

- マジックナンバーの禁止（PATTERNS.mdの規約に従う）
- ファイルサイズ制限（500行ソフトリミット、800行ハードリミット）
- エラーハンドリングパターン（Result型の使用）
- 命名規約（MASTER.mdに準拠）

## 信頼度スコア

| スコア | 判定 | アクション |
|--------|------|-----------|
| 80-90 | 重要な問題 | 報告する |
| 91-100 | クリティカル | 必ず報告 |
| 80未満 | マイナー | 報告しない |

## 出力形式

### Critical Issues (信頼度 91-100)
- [ファイル名:行番号] 問題の説明
  - 信頼度: XX
  - 理由: なぜこれが問題か
  - 修正提案: どう修正すべきか
```

### 2. test-patterns

テスト作成のパターンをスキルとして定義します。

```markdown
---
name: test-patterns
description: >
  プロジェクトのテスト戦略に従ってユニットテスト・統合テストを作成する。
  新しいテストの作成、テストカバレッジの改善、テストパターンの確認時に使用。
metadata:
  author: your-team
  version: "1.0"
---

# テストパターン

## 基本方針

- 動作カバレッジ（行カバレッジではなく、振る舞いを網羅）
- テストピラミッド: Unit > Integration > E2E
- テストファイル命名: `[対象ファイル名].test.ts`

## テスト構造

1つのテストは以下の構造に従う:

1. **Arrange** — テストデータと前提条件を準備
2. **Act** — テスト対象の操作を実行
3. **Assert** — 期待結果を検証

## 必須テストケース

新しい機能には最低限以下のテストを含める:

- 正常系（ハッピーパス）
- 異常系（エラーケース）
- 境界値（空入力、null、最大値/最小値）

## エッジケースチェックリスト

- [ ] 空文字列 / 空配列の入力
- [ ] null / undefined の入力
- [ ] 数値の上限・下限
- [ ] 並行処理での競合状態
- [ ] タイムアウト
```

### 3. error-handling-standards

エラーハンドリングの基準をスキルとして定義します。

```markdown
---
name: error-handling-standards
description: >
  エラーハンドリングの品質を検査し、沈黙する失敗を防ぐ。
  エラー処理の実装、try-catchブロックの確認、障害対応パターンの検討時に使用。
metadata:
  author: your-team
  version: "1.0"
---

# エラーハンドリング標準

## コア原則（譲歩不可）

1. **沈黙する失敗は受け入れない** — 空のcatchブロック禁止
2. **ユーザーに実行可能なフィードバックを返す** — "エラーが発生しました"は不可
3. **catchは特定的にする** — `catch (e)` ではなく具体的なエラー型を捕捉
4. **フォールバックは明示的かつ正当化する** — なぜフォールバックするのかコメント必須

## 重大度レベル

| レベル | 例 | 対応 |
|--------|-----|------|
| CRITICAL | 空のcatchブロック、ブロードcatch | 即修正 |
| HIGH | `console.log("error")` のみ | 修正推奨 |
| MEDIUM | エラーの原因コンテキスト不足 | 改善提案 |

## 推奨パターン

- Result型パターン（`{ success: true, data } | { success: false, error }`）
- カスタムエラークラスの使用
- エラーバウンダリによる局所化
- 構造化ログでのエラー記録
```

---

## Skills vs Agents の使い分け

GitHub Copilotには3つのカスタマイズ手段があります。それぞれ役割が異なるため、適切に使い分けましょう。

### 3つのカスタマイズ手段

| 手段 | ファイル | 目的 | ロード方式 |
|------|---------|------|-----------|
| Custom Instructions | `.github/copilot-instructions.md` | 常時適用のコーディング基準 | 常に自動 |
| Agent Skills | `.github/skills/*/SKILL.md` | タスク固有の手順書 | プロンプト合致で自動 |
| Custom Agents | `.github/agents/*.agent.md` | 名前付き専門家 | `@名前` で明示的 |

### どう組み合わせるか

```text
Custom Instructions（常に読み込み）
  └→ 「TypeScriptのstrictモードを使用」「PRは日本語で書く」

Agent Skills（自動的にロード）
  └→ 「テストはこのパターンで書く」「レビューはこの基準で行う」

Custom Agents（@で呼び出し）
  └→ 「@security-agent セキュリティ観点でレビューして」
```

**比喩で説明すると**:

- **Custom Instructions** = チームの「暗黙のルール」を明文化したもの
- **Agent Skills** = チームの「プレイブック（手順書）」
- **Custom Agents** = チームの「専門家」（呼べば来てくれる）

### Skills と Agents の判断基準

| 判断基準 | Skills を使う | Agents を使う |
|---------|-------------|-------------|
| 呼び出し方 | 自動（AIが判断） | 手動（`@名前`） |
| 内容の性質 | 手順・基準 | 分析・判断 |
| 再利用性 | ツール横断（オープンスタンダード） | GitHub Copilot専用 |
| 例 | テストパターン、レビュー基準 | セキュリティ分析、型設計評価 |

**原則**: まずSkillsで定義できないか検討し、Skillsでは表現しきれない「専門的な分析・判断」が必要な場合にAgentsを使います。

---

## カスタムエージェント

Skills だけでは表現しきれない、**専門的な分析・判断**を行うタスクにはカスタムエージェントを使います。

### エージェントの作成方法

`.github/agents/` ディレクトリに `*.agent.md` ファイルを作成します。

```markdown
---
description: エージェントの目的や役割の説明
tools:
  - "*"
---

# エージェント名

## 役割
エージェントの役割を説明

## 確認観点
- チェックポイント1
- チェックポイント2

## 出力形式
期待する出力フォーマット
```

### 仕様駆動開発向けエージェント（6種）

以下は、Claude Codeのpr-review-toolkitと同等の機能を実現するためのエージェントテンプレートです。

| エージェント | ファイル名 | 役割 |
|------------|-----------|------|
| Code Reviewer | `code-reviewer.agent.md` | ガイドラインへの準拠チェック |
| Error Handler Hunter | `error-handler-hunter.agent.md` | 沈黙する失敗の検出 |
| Test Analyzer | `test-analyzer.agent.md` | テストカバレッジの品質分析 |
| Code Simplifier | `code-simplifier.agent.md` | 不要な複雑性の排除 |
| Comment Analyzer | `comment-analyzer.agent.md` | コメントの正確性検証 |
| Type Design Analyzer | `type-design-analyzer.agent.md` | 型設計の品質と不変性分析 |

> **Tip**: これらのエージェントの詳細なテンプレートは、本書のGitHubリポジトリで公開しています。本文では紙面の都合上、代表的な1つを示します。

### エージェントテンプレート例: code-reviewer

```markdown
---
description: >
  プロジェクトガイドラインへの準拠をチェックし、
  バグ、スタイル違反、コード品質問題を検出するコードレビューエージェント
tools:
  - "*"
---

# Code Reviewer

## 役割

- CLAUDE.md、README.md、その他のガイドラインとの照合
- バグ検出とスタイル違反の特定
- コード品質問題の発見

## 分析プロセス

1. プロジェクトのガイドラインファイルを読み込む
2. 変更されたファイルを特定する（git diff）
3. 各変更をガイドラインと照合する
4. 問題に信頼度スコア（0-100）を付与する

## 報告ルール

信頼度80以上の問題のみ報告する。

| スコア | 意味 | アクション |
|--------|------|-----------|
| 80-90 | 重要な問題 | 報告する |
| 91-100 | クリティカル | 必ず報告 |
| 80未満 | マイナーまたは推測 | 報告しない |
```

### エージェントの呼び出し方

VS CodeのCopilot Chatで `@` に続けてエージェント名を入力します。

```text
@code-reviewer このPRをレビューして
@test-analyzer テストカバレッジを分析して
@error-handler-hunter エラーハンドリングを検査して
```

---

## 推奨ワークフロー

Skills と Agents を組み合わせた推奨ワークフローです。

**日常のコーディング中**（Skills が自動的に動作）:

- テスト作成 → `test-patterns` スキルが自動ロード
- エラー処理の実装 → `error-handling-standards` スキルが自動ロード

**コミット前**（Agents を明示的に呼び出し）:

```text
@code-reviewer
@error-handler-hunter
```

**PR作成前**（Agents で総合チェック）:

```text
@code-reviewer
@test-analyzer
@error-handler-hunter
@comment-analyzer
```

**新しい型を追加した場合**:

```text
@type-design-analyzer
```

> **ポイント**: Skillsは「やり方」を定義し、Agentsは「チェック」を実行します。Skillsが充実していれば、Agentsの指摘は自然と減っていきます。

---

## Premium Requestsとコスト

GitHub Copilotのエージェント機能は **Premium Requests** を消費します（2025年12月時点）。

| モデル | 消費量 |
|--------|--------|
| GPT-4o / GPT-4.1 | 無料 |
| Claude Haiku 4.5 | 0.33倍 |
| Claude Sonnet 4 / 4.5 | 1倍 |
| Claude Opus 4.5 | 3倍 |

コストを抑えたい場合は、GPT-4oを使用することで無料でエージェントを実行できます。

> **注**: Premium Requestsの詳細な料金体系は[GitHub Docs](https://docs.github.com/en/copilot/concepts/billing/copilot-requests)を参照してください。

---

## Claude Code vs GitHub Copilot 比較

### 基本比較

| 観点 | Claude Code | GitHub Copilot |
|------|-------------|----------------|
| 実行環境 | CLI | VS Code / GitHub.com |
| スキル共有 | `.claude/skills/` | `.github/skills/`（相互参照可） |
| エージェント | plugin.json + commands/ | `.github/agents/*.agent.md` |
| Git連携 | Bash経由 | ネイティブ（worktree, PR作成） |
| 並列実行 | 順次 | Background/Sub-Agents |
| コスト | サブスクリプション | Premium Requests |
| 公式プラグイン | pr-review-toolkit等あり | なし（自作が必要） |

### レビュー機能対応表

| 目的 | Claude Code (pr-review-toolkit) | GitHub Copilot Agent |
|------|--------------------------------|---------------------|
| コードレビュー | code-reviewer | @code-reviewer |
| サイレント失敗検出 | silent-failure-hunter | @error-handler-hunter |
| コード簡素化 | code-simplifier | @code-simplifier |
| コメント分析 | comment-analyzer | @comment-analyzer |
| テスト分析 | pr-test-analyzer | @test-analyzer |
| 型設計評価 | type-design-analyzer | @type-design-analyzer |

### 最大の違い: Skills の互換性

以前はClaude CodeとGitHub Copilotで**別々にカスタマイズファイルを書く**必要がありました。

Agent Skillsの登場により、**Skills部分は1回書けば両方で動く**ようになりました。残るのはAgentsの差異だけです。

```text
共通（Skills）: .github/skills/ → Claude Code + GitHub Copilot
個別（Agents）: .github/agents/ → GitHub Copilot のみ
個別（Agents）: plugin.json     → Claude Code のみ
```

---

## 章末チェックリスト

- [ ] `.github/skills/` ディレクトリを作成する
- [ ] `code-review-standards` スキルを導入する
- [ ] `test-patterns` スキルを導入する
- [ ] `error-handling-standards` スキルを導入する
- [ ] SKILL.md の `description` に「いつ使うか」を明記する
- [ ] `.github/agents/` に必要なエージェントテンプレートを配置する
- [ ] `@code-reviewer` 等のエージェントをPR前に実行する習慣をつける
- [ ] Claude Code ユーザーは `.claude/skills/` との相互参照を確認する

---

## 🥷 AI侍道場 - Skills & Agentsの極意

![AI侍道場：Skills & Agentsの極意](../images/ch12-ai-samurai-dojo.png)

---

### 🗡️ AI侍の秘伝書

Skills と Agents を使いこなす3つの極意を授ける。

#### 秘伝その1：「手順書」と「専門家」を分けよ

**Skills**は手順書、**Agents**は専門家じゃ。

- 「テストをこう書け」→ Skills（手順）
- 「このコードの品質を判定せよ」→ Agents（判断）

手順書を充実させれば、専門家に聞く回数が減る。**Skillsを先に整備せよ**。

#### 秘伝その2：1回書けば、どのツールでも動く

Agent Skills はオープンスタンダードじゃ。

```text
.github/skills/test-patterns/SKILL.md
  → Claude Code で動く
  → GitHub Copilot で動く
  → Cursor でも動く
```

ツールのロックインを恐れるな。**仕様を書けば、ツールは後から選べる**。これこそが仕様駆動開発の真髄じゃ。

#### 秘伝その3：description が9割

Skills が自動的に呼ばれるかどうかは、`description` フィールドの書き方で決まる。

```yaml
# ダメな例
description: テスト関連のスキル

# 良い例
description: >
  プロジェクトのテスト戦略に従ってユニットテストを作成する。
  新しいファイルのテストを書く時や、テストカバレッジを改善する時に使用。
```

**何をするか**と**いつ使うか**。この2つを書けば、AIは自分で判断できる。

---
