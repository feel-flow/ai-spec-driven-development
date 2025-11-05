# GitHub Copilot セットアップガイド

## 概要

このガイドでは、GitHub CopilotをAI仕様駆動開発で使うための完全な初期設定を説明します。

**推奨所要時間**: 合計30分

## クイックスタート（6ステップ）

### STEP 1: インストール（15分）
GitHub Copilotのサブスクリプション購入とVS Code拡張機能のインストール

**詳細**: [setup-guides/github-copilot/installation.md](./setup-guides/github-copilot/installation.md)

### STEP 2: copilot-instructions.md設定（5-10分）
`.github/copilot-instructions.md`の作成 - AIプロンプトで自動生成（推奨）

**詳細**: [setup-guides/github-copilot/copilot-instructions.md](./setup-guides/github-copilot/copilot-instructions.md)

### STEP 3: VS Code設定（5分）
エディタ設定のカスタマイズ

**詳細**: [setup-guides/github-copilot/configuration.md](./setup-guides/github-copilot/configuration.md)

### STEP 4: 動作確認（5分）
基本的なコード補完とCopilot Chatのテスト

**詳細**: [setup-guides/github-copilot/configuration.md#動作確認](./setup-guides/github-copilot/configuration.md#動作確認)

### STEP 5: 効果的な使い方（5分）
ベストプラクティスの確認

**詳細**: [setup-guides/github-copilot/best-practices.md](./setup-guides/github-copilot/best-practices.md)

### STEP 6: チーム共有
設定ファイルのリポジトリへのコミット

**詳細**: [setup-guides/github-copilot/best-practices.md#チーム開発での設定共有](./setup-guides/github-copilot/best-practices.md#チーム開発での設定共有)

---

## セットアップ完了チェックリスト

- [ ] **STEP 1**: GitHub Copilotをインストール
- [ ] **STEP 2**: `.github/copilot-instructions.md`を作成
- [ ] **STEP 3**: VS Code設定を完了
- [ ] **STEP 4**: 動作確認とテスト
- [ ] **STEP 5**: ベストプラクティスを確認
- [ ] **STEP 6**: チームメンバーと共有

---

## クイックリファレンス

### 主要なショートカット

| 操作 | macOS | Windows/Linux |
|------|-------|---------------|
| Copilot Chat | `Cmd + I` | `Ctrl + I` |
| 拡張機能 | `Cmd + Shift + X` | `Ctrl + Shift + X` |
| 候補を受け入れ | `Tab` | `Tab` |
| 次の候補 | `Option + ]` | `Alt + ]` |
| 前の候補 | `Option + [` | `Alt + ]` |

### 主要なコマンド

```bash
# プロジェクトディレクトリの作成
mkdir -p .github

# AIプロンプトで生成した内容を保存
cat > .github/copilot-instructions.md << 'EOF'
[AIが生成した内容]
EOF

# チーム共有のためのコミット
git add .github/
git commit -m "Add GitHub Copilot instructions"
git push
```

### 推奨されるAIプロンプトテンプレート

```
以下のプロジェクト情報に基づいて、GitHub Copilot用の .github/copilot-instructions.md を生成してください。

# プロジェクト情報
- プロジェクト名: [あなたのプロジェクト名]
- 技術スタック: [例: TypeScript, React, Node.js, PostgreSQL]
- アーキテクチャ: [例: Clean Architecture, Microservices]

# 必須制約（docs-template/MASTER.mdより）
[ここに MASTER.md の「コード生成ルール」セクションをコピペ]

# プロジェクト固有のルール
[あなたのプロジェクト固有のルールがあれば記入]

# 出力形式
- Markdown形式で出力
- セクション構成:
  1. プロジェクト概要
  2. 技術スタック
  3. コード生成ルール
  4. 命名規則
  5. 禁止事項
  6. アーキテクチャパターン
  7. セキュリティ要件
  8. パフォーマンス目標
  9. ドキュメント参照
  10. コードレビューチェックリスト

# 制約
- MASTER.mdの内容を必ず反映すること
- マジックナンバー禁止を明記
- any型禁止を明記
- エラーハンドリング（Result pattern）を明記
- テストカバレッジ80%以上を明記

# 🚨 重要: 情報不足時の確認ルール
情報が不足している場合、推論で埋めずに必ず確認を求めること。

詳細は docs-template/MASTER.md の「情報不足時の必須確認プロトコル」を参照。
```

---

## 主要ファイル構成

セットアップ後のファイル構成：

```
your-project/
├── .github/
│   ├── copilot-instructions.md     # GitHub Copilot用の指示ファイル
│   └── .copilotignore              # (オプション) 学習除外ファイル
├── .vscode/
│   └── settings.json               # VS Code設定
└── docs-template/
    └── MASTER.md                   # プロジェクト全体のルール（参照元）
```

---

## トラブルシューティング

### Copilotが提案してくれない

1. GitHubアカウント連携を確認
2. サブスクリプションがアクティブか確認
3. VS Codeを再起動
4. 拡張機能を再インストール

**詳細**: [setup-guides/github-copilot/best-practices.md#トラブルシューティング](./setup-guides/github-copilot/best-practices.md#トラブルシューティング)

### MASTER.mdのルールが反映されない

1. `.github/copilot-instructions.md`の内容を確認
2. Copilot Chatで明示的に指示
3. VS Codeを再起動

**詳細**: [setup-guides/github-copilot/best-practices.md#トラブルシューティング](./setup-guides/github-copilot/best-practices.md#トラブルシューティング)

---

## 詳細ガイド

各ステップの詳細は以下のドキュメントを参照してください：

1. **[installation.md](./setup-guides/github-copilot/installation.md)**
   - サブスクリプション購入
   - VS Code拡張機能のインストール
   - GitHubアカウントとの連携

2. **[copilot-instructions.md](./setup-guides/github-copilot/copilot-instructions.md)**
   - `.github/copilot-instructions.md`の作成方法
   - AIプロンプトでの自動生成（推奨）
   - MASTER.md統合
   - プロジェクト固有のカスタマイズ

3. **[configuration.md](./setup-guides/github-copilot/configuration.md)**
   - VS Code設定のカスタマイズ
   - 言語ごとの有効/無効設定
   - 動作確認とテスト

4. **[best-practices.md](./setup-guides/github-copilot/best-practices.md)**
   - 効果的な使い方
   - コメント駆動開発
   - Copilot Chatの活用
   - チーム開発での共有
   - トラブルシューティング

---

## 参考リンク

- [GitHub Copilot公式ドキュメント](https://docs.github.com/ja/copilot)
- [GitHub Copilot Chat](https://docs.github.com/ja/copilot/github-copilot-chat)
- [VS Code拡張機能](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)
- [MASTER.md](./MASTER.md) - プロジェクト全体のルール
- [PATTERNS.md](./03-implementation/PATTERNS.md) - 実装パターン

---

## 次のステップ

セットアップ完了後は、以下のドキュメントも参照してください：

- [GETTING_STARTED_NEW_PROJECT.md](./GETTING_STARTED_NEW_PROJECT.md) - プロジェクト開始ガイド
- [SETUP_CLAUDE_CODE.md](./SETUP_CLAUDE_CODE.md) - Claude Code セットアップ
- [SETUP_CURSOR.md](./SETUP_CURSOR.md) - Cursor セットアップ

---

**セットアップ完了おめでとうございます！**

GitHub Copilotを使って、効率的なAI駆動開発を楽しんでください！
