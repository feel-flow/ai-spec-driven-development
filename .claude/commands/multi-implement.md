# /multi-implement — 複数AIによる並列実装

5つのAI CLI（Claude Code / Codex / Copilot / Gemini / Cursor）を並列実行し、異なる観点から実装タスクを分担します。

## 前提

- git リポジトリで作業中であること
- `scripts/multi-agent.sh` が存在すること
- 少なくとも1つのAI CLIがインストールされていること
- `yq` がインストールされていること（`brew install yq`）

## 引数

- `$ARGUMENTS` — 実装タスクの説明（必須）+ multi-agent.sh に渡すオプション
  - 例: `新しいバリデーション関数を追加`
  - 例: `ユーザー認証ミドルウェアのリファクタリング --cli claude-code --cli codex-cli`
  - 例: `テストコードの拡充 --include-diff`（現在の差分も含める）
  - 全オプションは `bash scripts/multi-agent.sh --help` で確認できます

## 手順

### 1. 引数の解析

`$ARGUMENTS` の最初の部分（`--` で始まらない部分）を実装タスクの説明として取得します。
残りのオプションは multi-agent.sh に渡します。

### 2. プラン確認（--dry-run）

まず実行プランを表示し、ユーザーに確認を求めます:

```bash
bash scripts/multi-agent.sh --task implement --description "<タスク説明>" --dry-run $OPTIONS
```

出力を確認し、以下をユーザーに報告:
- 検出されたCLI一覧（✅/❌）
- 各CLIに割り当てられたパースペクティブ（実装/テスト/ドキュメント/リファクタ/マイグレーション）
- モード・戦略・タイムアウト設定

ユーザーに「このプランで実行してよいか」を確認してください。

### 3. 実装実行

ユーザーが承認したら、実装を実行します:

```bash
bash scripts/multi-agent.sh --task implement --description "<タスク説明>" $OPTIONS
```

**重要**: 実装結果は `.implement-results/` ステージングディレクトリに出力されます。
ワーキングツリーには直接書き込みません。

実行中は進捗状況を監視し、完了を待ちます。

### 4. 結果分析と適用承認

#### 4-1. 結果ファイルの読み込み

```bash
cat .implement-results/integrated-report.md
ls -la .implement-results/
```

#### 4-2. 統合レポートの出力

以下の形式でユーザーに報告します:

```markdown
## Multi-CLI Implement 統合レポート

### 実装成果物
| CLI | Perspective | 生成ファイル | ステータス |
|-----|------------|-------------|----------|
| claude-code | feature-implementation | src/... | 新規作成 |
| codex-cli | refactoring | src/... | 変更 |
| copilot-cli | test-writing | tests/... | 新規作成 |
| gemini-cli | documentation | docs/... | 新規作成 |

### 競合チェック
- 同一ファイルを複数CLIが変更している場合は警告

### 適用推奨順序
1. コア実装 (feature-implementation)
2. リファクタリング (refactoring)
3. テスト (test-writing)
4. ドキュメント (documentation)
5. マイグレーション (migration)
```

#### 4-3. ワーキングツリーへの適用

ユーザーに適用の承認を求めます:
- 各CLIの結果を個別に確認
- 競合がある場合は手動マージの提案
- 承認された成果物のみをワーキングツリーに適用

適用後:
```bash
git diff  # 適用内容の確認
```

## 重要ルール

- ステップ2の dry-run 確認なしにステップ3を実行しないこと
- 実装結果はステージングディレクトリに出力 — ワーキングツリーに直接書き込まない
- ワーキングツリーへの適用前にユーザー承認を得ること
- 結果は `.implement-results/` に保存され、後から参照できます
- `scripts/agent-config.yaml` で設定をカスタマイズできます
