---
name: proofread-codex
description: OpenAI Codex CLIを使用したPR差分の校正レビュー
triggers:
  - "/proofread codex"
  - "codexでレビューして"
  - "codexで校正して"
---

# Codex CLI校正スキル

## 概要

OpenAI Codex CLI (`codex`) を使用して、現在のブランチのPR差分を校正レビューします。

**特徴:**

- Codex CLIは `AGENTS.md` を自動的に読み込むため、プロジェクト固有のレビュー指示が適用されます
- `codex review --base develop` コマンドで非インタラクティブにレビューを実行

## 前提条件

- Codex CLIがインストール済み (`codex --version` で確認)
- 認証済み (`codex auth` で確認)
- developブランチからの変更がある状態

## 実行手順

### 1. 差分ファイルの確認

まず、developブランチからの変更ファイルを確認します。

```bash
git diff --name-only develop -- '*.md'
```

変更がない場合は、レビュー対象がないことをユーザーに伝えてください。

### 2. Codex CLIの実行

以下のコマンドでCodex CLIを実行します。

```bash
codex review --base develop "AGENTS.mdの校正レビュー指示に従い、PR差分の日本語技術書を校正してください。誤字脱字、用語統一、構造をチェックし、重要度別（重大/警告/提案）にレポートしてください。"
```

### 3. 結果の表示

Codex CLIの出力をそのまま表示します。必要に応じて以下を補足：

- 修正が必要な箇所のサマリー
- 次のアクション（修正 → 再レビュー → PR作成）

## 注意事項

- Codex CLIは `AGENTS.md` の「📝 校正レビュー指示」セクションを参照します
- 大量のファイルがある場合、処理に時間がかかることがあります
- エラーが発生した場合は `codex --version` と `codex auth` で環境を確認してください

## トラブルシューティング

### Codex CLIが見つからない

```bash
# インストール確認
which codex
```

インストールされていない場合は、[OpenAI Codex CLI公式リポジトリ](https://github.com/openai/codex)を参照してください。

### 認証エラー

```bash
# 認証状態を確認
codex auth

# 再認証
codex auth login
```

## 関連スキル

- `/proofread` - Claude Code内蔵の校正レビュー
- `/proofread gemini` - Gemini CLIを使用した校正レビュー
