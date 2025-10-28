# AI Spec-Driven Development

AI開発ツール（Claude Code、GitHub Copilot、Cursor）に最適化された7文書構造によるドキュメント戦略。

## 📚 完全ガイド

**→ [`ai_spec_driven_development.md`](./ai_spec_driven_development.md) - 理論と実践の包括的解説**

## 🚀 Quick Start

### 🌟 完全初心者の方へ
**何も決まっていない状態から始める**: [`docs-template/GETTING_STARTED_ABSOLUTE_BEGINNER.md`](./docs-template/GETTING_STARTED_ABSOLUTE_BEGINNER.md)
- 環境準備からアイデア発想まで完全サポート（所要時間: 約4.5時間）
- AIツールの初期設定ガイド付き

### 新規プロジェクトを始める場合
1. **企画から始める**: [`docs-template/GETTING_STARTED_NEW_PROJECT.md`](./docs-template/GETTING_STARTED_NEW_PROJECT.md) - ゼロから完全ガイド（8-12時間）
2. **企画書を作成**: [`docs-template/00-planning/PLANNING_TEMPLATE.md`](./docs-template/00-planning/PLANNING_TEMPLATE.md) - アイデア→要件定義

### 既存プロジェクトに導入する場合
1. **理論を学ぶ**: [`ai_spec_driven_development.md`](./ai_spec_driven_development.md) - なぜ7文書構造が最適なのか
2. **実装を始める**: [`docs-template/GETTING_STARTED.md`](./docs-template/GETTING_STARTED.md) - ステップバイステップガイド
3. **テンプレート活用**: [`docs-template/`](./docs-template/) - すぐに使える7文書テンプレート

### AIツール初期設定ガイド
- **GitHub Copilot**: [`docs-template/SETUP_GITHUB_COPILOT.md`](./docs-template/SETUP_GITHUB_COPILOT.md) - copilot-instructions.md設定（約30分）
- **Claude Code**: [`docs-template/SETUP_CLAUDE_CODE.md`](./docs-template/SETUP_CLAUDE_CODE.md) - CLAUDE.md設定（約40分）
- **Cursor**: [`docs-template/SETUP_CURSOR.md`](./docs-template/SETUP_CURSOR.md) - .cursorrules設定（約60分）

## 💡 中核概念

従来の60+文書から**7つの必須文書**への革新的転換：

1. **MASTER.md** - プロジェクト中央管理
2. **PROJECT.md** - ビジョンと要件
3. **ARCHITECTURE.md** - システム設計
4. **DOMAIN.md** - ビジネスロジック
5. **PATTERNS.md** - 実装パターン
6. **TESTING.md** - テスト戦略
7. **DEPLOYMENT.md** - 運用手順

詳細な説明と実装例は[完全ガイド](./ai_spec_driven_development.md#2-ai駆動開発に最適化されたドキュメント構造)を参照。

## 🤖 AIエージェント向けガイド

### 🚨 重要: 作業開始前に必ずMASTER.mdを参照

すべてのAIエージェントは、このプロジェクトで作業を開始する前に **`docs-template/MASTER.md`** を必ず読み込んでください。

### エージェント別設定

- **Claude Code**: [`CLAUDE.md`](./CLAUDE.md) - Claude Code専用ガイド
- **GitHub Copilot**: [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) - Copilot設定
- **Cursor**: [`.cursorrules`](./.cursorrules) - Cursor設定
- **その他AIエージェント**: [`AGENTS.md`](./AGENTS.md) - 統一ガイド

### 必須手順

1. **MASTER.mdを読み込む** - プロジェクトの技術スタック、コーディング規約、制約事項を理解
2. **関連文書を確認** - アーキテクチャ、ドメイン、パターン文書を参照
3. **コード生成** - MASTER.mdのルールに従って実装
4. **品質確認** - マジックナンバー禁止、型安全性、エラーハンドリング等をチェック

### MCPサーバー

AIエージェント連携の設定: [`mcp/README.md`](./mcp/README.md)

## ライセンス

このプロジェクトは[MITライセンス](./LICENSE)の下で公開されています。

## リリース/変更履歴

- 変更履歴: [CHANGELOG.md](./CHANGELOG.md)
- リリース一覧: https://github.com/feel-flow/ai-spec-driven-development/releases

---

**プロジェクト管理者**: FEEL-FLOW  
**最終更新**: 2025年9月25日  
**お問い合わせ**: [https://feelflow.co.jp](https://feelflow.co.jp) のお問い合わせフォームへ