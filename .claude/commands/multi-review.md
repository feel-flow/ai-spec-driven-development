# /multi-review — Multi-CLI Review Orchestrator

5つのAI CLI（Claude Code / Codex / Copilot / Gemini / Cursor）を並列実行し、異なる観点からコードレビューを実行します。

## 引数

- `$ARGUMENTS` — multi-review.sh に渡すオプション（省略時はデフォルト設定で実行）
  - 例: `--cli codex-cli --cli copilot-cli`（特定CLIのみ）
  - 例: `--strategy minimize_cost`（コスト最小化）
  - 例: `--perspective code-review`（特定パースペクティブのみ）
  - 例: `--mode cross-model --perspective code-review`（クロスモデル比較）

## 手順

### Phase 1: プラン確認（--dry-run）

まず実行プランを表示し、ユーザーに確認を求めます:

```bash
bash scripts/multi-review.sh --dry-run $ARGUMENTS
```

出力を確認し、以下をユーザーに報告:
- 検出されたCLI一覧（✅/❌）
- 各CLIに割り当てられたパースペクティブ
- モード・戦略・タイムアウト設定

ユーザーに「このプランで実行してよいか」を確認してください。

### Phase 2: レビュー実行

ユーザーが承認したら、実際のレビューを実行します:

```bash
bash scripts/multi-review.sh $ARGUMENTS
```

**注意**: 実行には各CLIのAPIコストが発生します。タイムアウトはデフォルト300秒/CLIです。

実行中は進捗状況を監視し、完了を待ちます。

### Phase 3: 結果分析と修正提案

レビュー結果は `.review-results/` ディレクトリに出力されます。

#### 3-1. 結果ファイルの読み込み

```bash
# 出力ディレクトリの内容を確認
ls -la .review-results/
```

各CLIの結果ファイルを読み込みます:
- `.review-results/{cli-name}/{perspective}.md`

#### 3-2. 重大度別の分類

全CLIの結果を統合し、以下の重大度で分類します:

| 重大度 | 対応 |
|--------|------|
| **Critical** | 必ず修正（自動対応） |
| **Warning** | 必ず修正（自動対応） |
| **Suggestion** | 妥当なものは修正 |
| **Info** | 報告のみ |

#### 3-3. 重複排除（デデュプリケーション）

複数のCLIが同じ問題を指摘している場合、重複を排除してまとめます。
同じファイル・同じ行番号・同じ種類の指摘は1つにまとめ、検出したCLI名を併記します。

#### 3-4. 統合レポートの出力

以下の形式でユーザーに報告します:

```markdown
## Multi-CLI Review 統合レポート

### Critical Issues (X件)
- [CLI名] ファイル:行番号 — 問題の説明

### Warning Issues (X件)
- [CLI名] ファイル:行番号 — 問題の説明

### Suggestions (X件)
- [CLI名] ファイル:行番号 — 提案内容

### クロスモデル検出（複数CLIが指摘）
- [CLI-A, CLI-B] ファイル:行番号 — 問題の説明（信頼度: 高）

### Summary
| CLI | Critical | Warning | Suggestion | Info |
|-----|----------|---------|------------|------|
| claude-code | X | X | X | X |
| codex-cli | X | X | X | X |
| ... | ... | ... | ... | ... |
```

#### 3-5. 自動修正の実行

PR Review Response Policy に従い、Critical と Warning を自動修正します:

1. Critical/Warning の修正対象をリストアップ
2. 各問題に対して修正を実施
3. 修正内容をユーザーに報告
4. Suggestion は妥当なもののみ対応

修正完了後:
```bash
git diff  # 修正内容の確認
```

## 注意事項

- 各CLIのAPI利用にはコストが発生します（特にClaude/Codexはトークン課金）
- `--strategy minimize_cost` で固定料金/無料CLIを優先できます
- CLI未インストールの場合は fallback 設定に従って自動再分配されます
- 結果は `.review-results/` に保存され、後から参照できます
- `scripts/review-config.yaml` で設定をカスタマイズできます
