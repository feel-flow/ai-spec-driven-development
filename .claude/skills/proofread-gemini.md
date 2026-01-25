---
name: proofread-gemini
description: Google Gemini CLIを使用したPR差分の校正レビュー
triggers:
  - "/proofread gemini"
  - "geminiでレビューして"
  - "geminiで校正して"
---

# Gemini CLI校正スキル

## 概要

Google Gemini CLI (`gemini`) を使用して、現在のブランチのPR差分を校正レビューします。

**特徴:**

- `-y` フラグで非インタラクティブ実行
- プロンプトにレビュー指示を含めて実行

## 前提条件

- Gemini CLIがインストール済み (`gemini --version` で確認)
- 認証済み
- developブランチからの変更がある状態

## 実行手順

### 1. 差分ファイルの確認

まず、developブランチからの変更ファイルを確認します。

```bash
git diff --name-only develop -- '*.md'
```

変更がない場合は、レビュー対象がないことをユーザーに伝えてください。

### 2. 変更ファイルリストの取得

```bash
CHANGED_FILES=$(git diff --name-only develop -- '*.md' | head -20)
```

### 3. Gemini CLIの実行

以下のコマンドでGemini CLIを実行します。

```bash
gemini -y "以下のファイルの校正レビューを行ってください。

【検査観点】
1. 日本語表現（誤字脱字、文法、読みやすさ）
2. 用語統一（表記揺れがないか）
3. 技術的正確性（出典の有無、事実確認）
4. 章構造（必須セクションの有無）

【出力形式】
- 🔴 重大: 修正必須の問題
- 🟡 警告: 修正推奨の問題
- 🔵 提案: 改善案

【対象ファイル】
${CHANGED_FILES}

各ファイルをレビューし、問題があれば行番号と具体的な修正案を提示してください。"
```

### 4. 結果の表示

Gemini CLIの出力をそのまま表示します。必要に応じて以下を補足：

- 修正が必要な箇所のサマリー
- 次のアクション（修正 → 再レビュー → PR作成）

## 注意事項

- Gemini CLIは `AGENTS.md` を自動で読み込まないため、プロンプトにレビュー指示を含めています
- 大量のファイルがある場合、`head -20` で最初の20ファイルに制限しています
- ファイル内容を直接渡す場合は、トークン制限に注意してください

## トラブルシューティング

### Gemini CLIが見つからない

```bash
# インストール確認
which gemini
```

インストールされていない場合は、[Gemini CLI公式リポジトリ](https://github.com/google-gemini/gemini-cli)を参照してください。

### 認証エラー

```bash
# 認証状態を確認
gemini auth status

# 再認証
gemini auth login
```

## 関連スキル

- `/proofread` - Claude Code内蔵の校正レビュー
- `/proofread codex` - Codex CLIを使用した校正レビュー
