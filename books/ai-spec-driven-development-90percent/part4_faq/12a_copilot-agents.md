# 第12a章　ツール実装（後編）：GitHub Copilot Agentsで"仕様駆動"を自動化する

## この章で学ぶこと

- GitHub Copilot Agentsの仕組みと4つのタイプ
- カスタムエージェントの作成方法
- 仕様駆動開発向け6つのエージェントテンプレート
- Claude Code Skillsとの比較

---

## 読者へのメッセージ

前章（第12章）では**Claude Code Skills**を取り上げました。本章では**GitHub Copilot Agents**を解説します。

> **Note**: GitHub Copilotには、Claude Codeのpr-review-toolkitのような**公式プラグインが提供されていません**。同等の機能を実現するには、本章で紹介するエージェントテンプレートを自分でリポジトリに追加する必要があります。

---

## GitHub Copilot Agentsとは

GitHub Copilotのカスタムエージェントは、**特定のタスクに特化したAIの専門家**を定義できる機能です。VS Code 1.107以降で利用可能です。

| 項目 | 内容 |
|------|------|
| 保存場所 | `.github/agents/` フォルダ |
| ファイル形式 | `*.agent.md`（Markdown） |
| 対応環境 | VS Code 1.107+、GitHub.com |

---

## 4種類のエージェントタイプ

GitHub Copilotには4種類のエージェントがあります。

| 種類 | 実行場所 | 特徴 | 用途 |
|------|---------|------|------|
| ローカル | VS Code | 対話的・リアルタイム | 小〜中規模タスク |
| バックグラウンド | VS Code | Git worktreeで並行作業 | 大規模リファクタ |
| クラウド | GitHub.com | 自律的にPR作成 | Issue解決 |
| サブ | 親エージェント内 | 専門タスクを委譲 | 専門知識が必要な部分 |

---

## カスタムエージェントの作成方法

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

### VS Code設定

カスタムエージェントを有効にするには、VS Codeの `settings.json` に以下を追加します。

```json
{
  "github.copilot.chat.cli.customAgents.enabled": true
}
```

---

## 仕様駆動開発向けエージェント（6種）

以下は、Claude Codeのpr-review-toolkitと同等の機能を実現するためのエージェントテンプレートです。

### 1. code-reviewer.agent.md

```markdown
---
description: プロジェクトガイドラインへの準拠をチェックし、バグ、スタイル違反、コード品質問題を検出するコードレビューエージェント
tools:
  - "*"
---

# Code Reviewer

プロジェクトガイドラインへの準拠をチェックし、高信頼度の問題のみを報告するコードレビューエージェントです。

## 役割

- CLAUDE.md、README.md、その他のプロジェクトガイドラインとの照合
- バグ検出
- スタイル違反の特定
- コード品質問題の発見

## 分析プロセス

1. プロジェクトのガイドラインファイル（CLAUDE.md等）を読み込む
2. 変更されたファイルを特定する（git diff）
3. 各変更をガイドラインと照合する
4. 問題に信頼度スコアを付与する

## 信頼度スコア

各問題には0-100の信頼度スコアを付与してください：

| スコア | 意味 | 報告 |
|--------|------|------|
| 0-25 | 誤検出または既存の問題 | 報告しない |
| 26-50 | マイナーな指摘（ガイドラインに明記なし） | 報告しない |
| 51-79 | 有効だが低影響 | 報告しない |
| 80-90 | 重要な問題 | 報告する |
| 91-100 | クリティカルなバグまたは明示的な違反 | 必ず報告 |

**報告閾値: 信頼度80以上のみ報告**

## 出力形式

## Code Review Results

### Critical Issues (信頼度 91-100)
- [ファイル名:行番号] 問題の説明
  - 信頼度: XX
  - 理由: なぜこれが問題か
  - 修正提案: どう修正すべきか

### Important Issues (信頼度 80-90)
- [ファイル名:行番号] 問題の説明
  - 信頼度: XX
  - 理由: なぜこれが問題か
  - 修正提案: どう修正すべきか

### Summary
- 検出された問題数: X
- Critical: X
- Important: X

## 注意事項

- 信頼度80未満の問題は報告しない
- 既存のコード（変更されていない部分）の問題は報告しない
- 推測や曖昧な指摘は避ける
- 具体的な修正提案を含める
```

### 2. error-handler-hunter.agent.md

```markdown
---
description: エラーハンドリングの品質を検査し、沈黙する失敗を検出するエージェント
tools:
  - "*"
---

# Error Handler Hunter

沈黙する失敗を許さない、エラーハンドリングの厳格な検査官です。

## 役割

- try-catchブロックの検査
- 沈黙する失敗の検出
- 空のcatchブロックの禁止
- フォールバックロジックの正当性確認

## コア原則（譲歩不可）

1. 沈黙する失敗は受け入れられない
2. ユーザーは実行可能なフィードバックに値する
3. フォールバックは明示的で正当化される必要がある
4. キャッチブロックは特定的でなければならない

## 重大度レベル

| レベル | 説明 | 例 |
|--------|------|-----|
| CRITICAL | サイレント失敗、ブロードcatch | 空のcatchブロック |
| HIGH | 不十分なエラーメッセージ | console.log("error") のみ |
| MEDIUM | コンテキスト不足 | エラーの原因が不明確 |

## 出力形式

## Error Handling Analysis Results

### CRITICAL Issues
- [ファイル名:行番号] 問題の説明
  - コード: 問題のあるコード
  - 問題: 何が問題か
  - 修正提案: 推奨される修正

### Summary
- CRITICAL: X
- HIGH: X
- MEDIUM: X
```

### 3. test-analyzer.agent.md

```markdown
---
description: テストカバレッジの品質を分析し、クリティカルなギャップを特定するエージェント
tools:
  - "*"
---

# Test Analyzer

行カバレッジではなく、動作カバレッジの観点からテスト品質を分析するエージェントです。

## 役割

- 動作カバレッジの分析
- クリティカルなテストギャップの特定
- エッジケースとエラー条件のカバレッジ確認

## 識別対象のギャップ

1. テストされていないエラーハンドリングパス
2. 境界条件のエッジケース（空入力、null、最大値/最小値）
3. クリティカルなビジネスロジック分岐
4. ネガティブテストケース
5. 非同期/並行処理

## 優先度スケール

| 優先度 | 意味 |
|--------|------|
| 9-10 | クリティカル（データ損失、セキュリティ、システム障害の可能性） |
| 7-8 | 重要（ユーザー向けエラーの可能性） |
| 5-6 | エッジケース（混乱や軽微な問題） |
| 3-4 | Nice-to-have |
| 1-2 | オプショナル |

## 出力形式

## Test Coverage Analysis Results

### Critical Gaps (優先度 9-10)
- [機能名] ファイル: path/to/file.ts
  - テストされていない動作: 説明
  - リスク: 影響
  - 優先度: X
  - 推奨テストケース: 具体的なテスト案
```

### 4. code-simplifier.agent.md

```markdown
---
description: コードの簡潔性と可読性を向上させるエージェント。機能を変更せずに、不要な複雑性を排除します
tools:
  - "*"
---

# Code Simplifier

機能を保持したまま、コードの簡潔性と可読性を向上させるエージェントです。

## 役割

- 不要な複雑性の排除
- 可読性の向上
- 冗長なコードの削減

## 簡潔化のルール

### 推奨する変更

1. ネストした三項演算子 → if/else文へ
2. 深いネスト → 早期リターンパターンへ
3. 巧妙なコード → 分かりやすいコードへ

### 禁止事項

- 機能の変更
- 新機能の追加
- テストの削除

## 出力形式

## Code Simplification Results

### Simplification Opportunities
- [ファイル名:行番号]
  - 現在のコード: ...
  - 提案: ...
  - 理由: なぜこの変更が可読性を向上させるか

## 注意事項

- 機能を絶対に変更しない
- 最近変更されたコードのみに焦点を当てる
- 簡潔性より明確性を優先する
```

### 5. comment-analyzer.agent.md

```markdown
---
description: コードコメントの正確性、完全性、長期的な保守性を分析するエージェント
tools:
  - "*"
---

# Comment Analyzer

コードコメントの品質を分析し、技術的負債を防ぐエージェントです。

## 役割

- コメントと実コードの照合
- コメント腐れ（技術的負債）の検出
- 誤解を招く・時代遅れなコメントの特定

## 検証プロセス

1. 事実精度の確認（関数署名、説明された動作）
2. 完全性の評価（仮定、副作用、エラー状態）
3. 長期的価値の評価（「なぜ」を説明しているか）
4. 誤解要素の特定（曖昧性、古い参照）

## 出力形式

## Comment Analysis Results

### Critical Issues（事実として不正確）
- [ファイル名:行番号]
  - コメント: "..."
  - 問題: コメントが実際のコードと矛盾
  - 推奨修正: ...

### Improvement Opportunities（改善可能）
- [ファイル名:行番号]
  - 問題: 情報が不完全
  - 推奨追加内容: ...
```

### 6. type-design-analyzer.agent.md

```markdown
---
description: 型設計の品質と不変性を分析するエージェント
tools:
  - "*"
---

# Type Design Analyzer

型設計品質と不変性の表現を分析し、堅牢な型システムの構築を支援するエージェントです。

## 役割

- 型カプセル化の評価
- 不変性表現の分析
- アンチパターンの検出

## 評価軸（各1-10スコア）

| 軸 | 評価内容 |
|----|----------|
| Encapsulation | 内部実装の隠蔽度 |
| Invariant Expression | 不変性の型による表現度 |
| Invariant Usefulness | 実バグ防止への有効性 |
| Invariant Enforcement | 構築時・変異時の検証度 |

## アンチパターン

- 貧血ドメインモデル（データのみで振る舞いがない）
- 変更可能な内部の公開
- ドキュメント依存の不変性
- 構築境界での検証不足

## 出力形式

## Type Design Analysis Results

### [型名]
- ファイル: path/to/file.ts
- スコア: Encapsulation X/10, Invariant Expression X/10, ...
- 総合スコア: X/10
- 検出されたアンチパターン: ...
- 改善提案: ...
```

---

## エージェントの呼び出し方

VS CodeのCopilot Chatで `@` に続けてエージェント名を入力します。

```text
@code-reviewer このPRをレビューして
@test-analyzer テストカバレッジを分析して
@error-handler-hunter エラーハンドリングを検査して
```

---

## 推奨ワークフロー

**コミット前**:

```text
@code-reviewer
@error-handler-hunter
```

**PR作成前**:

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

---

## Premium Requestsとコスト

GitHub Copilotのカスタムエージェントは**Premium Requests**を消費します。

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

| 観点 | Claude Code Skills | GitHub Copilot Agents |
|------|-------------------|----------------------|
| 実行環境 | Claude Code CLI | VS Code / GitHub.com |
| 設定ファイル | plugin.json + commands/ | .github/agents/*.agent.md |
| Git連携 | Bash経由 | ネイティブ（worktree, PR作成） |
| 並列実行 | 順次 | Background/Sub-Agents |
| コスト | サブスクリプション | Premium Requests |
| 公式プラグイン | pr-review-toolkit等あり | なし（自作が必要） |

### レビューエージェント対応表

| 目的 | Claude Code (pr-review-toolkit) | GitHub Copilot Agent |
|------|--------------------------------|---------------------|
| コードレビュー | code-reviewer | code-reviewer.agent.md |
| サイレント失敗検出 | silent-failure-hunter | error-handler-hunter.agent.md |
| コード簡素化 | code-simplifier | code-simplifier.agent.md |
| コメント分析 | comment-analyzer | comment-analyzer.agent.md |
| テスト分析 | pr-test-analyzer | test-analyzer.agent.md |
| 型設計評価 | type-design-analyzer | type-design-analyzer.agent.md |
| 包括的レビュー | /review-pr | （複数エージェント組み合わせ） |

**どちらのツールを使っても、同等のレビュー機能を実現できます。**

---

## 章末チェックリスト（GitHub Copilot ユーザー向け）

- [ ] `.github/agents/` ディレクトリを作成する
- [ ] 本章の6つのエージェントテンプレートを導入する
- [ ] VS Code設定でカスタムエージェントを有効化する
- [ ] `@code-reviewer` などのエージェントをPR前に実行する習慣をつける
- [ ] プロジェクトで繰り返している作業を洗い出す
- [ ] 最もよく使う作業をエージェント化する
- [ ] description（起動条件）を明確に書く

---

## 🥷 AI侍道場 - エージェントの使い分け

![AI侍道場：エージェントの使い分け](../images/ch12a-ai-samurai-dojo.png)

---

### 🗡️ AI侍の秘伝書

エージェントを使いこなす3つの極意を授ける。

#### 秘伝その1：「何を見てほしいか」で選べ

エージェントは**見る視点**が違う。何を見てほしいかで選べ。

- **全体的なコード品質** → `code-reviewer`
- **テストの網羅性** → `test-analyzer`
- **コメントの正確性** → `comment-analyzer`
- **エラーの隠蔽** → `silent-failure-hunter`
- **型設計の品質** → `type-design-analyzer`
- **コードの簡潔性** → `code-simplifier`

1つのエージェントですべて見ようとするな。**視点を分けよ**。

#### 秘伝その2：Claude CodeとCopilot、どちらでもいい

本質は**仕様駆動開発**である。ツールは選択肢の1つに過ぎぬ。

| 機能 | Claude Code | GitHub Copilot |
|------|-------------|----------------|
| コードレビュー | Skill: `pr-review` | Agent: `@code-reviewer` |
| テスト分析 | エージェント | Agent: `@test-analyzer` |
| コメント分析 | エージェント | Agent: `@comment-analyzer` |

**どちらを使っても、同じ価値を得られる**。

大事なのは：
- 仕様を書いているか
- レビューを回しているか
- ナレッジを蓄積しているか

これらができていれば、ツールは何でもよい。

#### 秘伝その3：「繰り返し実行」を習慣化せよ

エージェントは**PR前に必ず実行**せよ。

```bash
# Claude Codeの場合
/pr-review-toolkit:review-pr

# GitHub Copilotの場合
@code-reviewer ファイルをレビューして
@test-analyzer テストをチェックして
```

これを**PRを出す前の儀式**にせよ。習慣化すれば、品質は自然と上がる。

---
