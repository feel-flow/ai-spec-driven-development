# /multi-explore — 複数AIによるコードベース探索

5つのAI CLI（Claude Code / Codex / Copilot / Gemini / Cursor）を並列実行し、異なる観点からコードベースを探索・分析します。

## 前提

- git リポジトリで作業中であること
- `scripts/multi-agent.sh` が存在すること
- 少なくとも1つのAI CLIがインストールされていること
- `yq` がインストールされていること（`brew install yq`）

## 引数

- `$ARGUMENTS` — 探索対象の説明（必須）+ multi-agent.sh に渡すオプション
  - 例: `認証フローの仕組みを調査`
  - 例: `プロジェクト構造の概要 --cli codex-cli`（特定CLIのみ）
  - 例: `API エンドポイントの一覧 --strategy minimize_cost`（コスト最小化）
  - 全オプションは `bash scripts/multi-agent.sh --help` で確認できます

## 手順

### 1. 引数の解析

`$ARGUMENTS` の最初の部分（`--` で始まらない部分）を探索対象の説明として取得します。
残りのオプションは multi-agent.sh に渡します。

### 2. プラン確認（--dry-run）

まず実行プランを表示し、ユーザーに確認を求めます:

```bash
bash scripts/multi-agent.sh --task explore --description "<探索対象>" --dry-run $OPTIONS
```

出力を確認し、以下をユーザーに報告:
- 検出されたCLI一覧（✅/❌）
- 各CLIに割り当てられたパースペクティブ
- モード・戦略・タイムアウト設定

ユーザーに「このプランで実行してよいか」を確認してください。

### 3. 探索実行

ユーザーが承認したら、実際の探索を実行します:

```bash
bash scripts/multi-agent.sh --task explore --description "<探索対象>" $OPTIONS
```

**注意**: explore タスクは read-only です。コードの変更は行いません。

実行中は進捗状況を監視し、完了を待ちます。

### 4. 結果分析と統合レポート

探索結果は `.explore-results/` ディレクトリに出力されます。

#### 4-1. 結果ファイルの読み込み

```bash
cat .explore-results/integrated-report.md
ls -la .explore-results/
```

#### 4-2. カテゴリ別統合

複数CLIの結果をカテゴリ別にまとめます:

```markdown
## Multi-CLI Explore 統合レポート

### アーキテクチャ分析
- [CLI名] 発見事項の説明

### 依存関係マッピング
- [CLI名] 発見事項の説明

### パターン検出
- [CLI名] 発見事項の説明

### クロスモデル検出（複数CLIが一致）
- [CLI-A, CLI-B] 発見事項（信頼度: 高）

### Summary
| CLI | Perspective | 主要発見事項数 |
|-----|------------|--------------|
| claude-code | architecture-analysis | X |
| codex-cli | dependency-mapping | X |
| ... | ... | ... |
```

#### 4-3. 信頼度評価

複数のCLIが同じ発見をしている場合、信頼度を「高」として報告します。
1つのCLIのみの発見は信頼度「中」として報告します。

## 重要ルール

- ステップ2の dry-run 確認なしにステップ3を実行しないこと
- 探索は read-only — コードの変更は一切行わないこと
- 結果は `.explore-results/` に保存され、後から参照できます
- `scripts/agent-config.yaml` で設定をカスタマイズできます
