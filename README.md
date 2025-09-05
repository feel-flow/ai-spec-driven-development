# AI駆動開発ドキュメント戦略

AI時代の開発に最適化されたドキュメント構造とその実践方法についてまとめたプロジェクトです。

## 概要

従来の人間中心のドキュメント体系から、AI開発ツール（Claude Code、GitHub Copilot、Cursorなど）に最適化された効率的なドキュメント戦略への転換を提案しています。

## 主要な内容

- **AI駆動開発の基本概念**：なぜ従来のドキュメント構造では不十分なのか
- **7文書構造**：AI開発に最適化された軽量なドキュメント体系
- **実践ガイド**：具体的な実装例とテンプレート
- **移行戦略**：既存プロジェクトからの段階的移行方法

## ドキュメント構成

| ファイル | 内容 |
|---------|------|
| [`ai_spec_driven_development.md`](./ai_spec_driven_development.md) | メインドキュメント（全体の理論と実践） |
| [`docs/GETTING_STARTED.md`](./docs/GETTING_STARTED.md) | Quickstart（AI駆動・ドキュメント基準の始め方） |
| [`docs/MASTER.md`](./docs/MASTER.md) | プロジェクト全体の中心となるマスタードキュメント |
| [`docs/01-context/PROJECT.md`](./docs/01-context/PROJECT.md) | ビジョンと要件の統合 |
| [`docs/02-design/ARCHITECTURE.md`](./docs/02-design/ARCHITECTURE.md) | システム設計の中核 |
| [`docs/02-design/DOMAIN.md`](./docs/02-design/DOMAIN.md) | ビジネスロジックの集約 |
| [`docs/03-implementation/PATTERNS.md`](./docs/03-implementation/PATTERNS.md) | 実装パターンガイド |
| [`docs/04-quality/TESTING.md`](./docs/04-quality/TESTING.md) | AI駆動テスト戦略 |
| [`docs/05-operations/DEPLOYMENT.md`](./docs/05-operations/DEPLOYMENT.md) | 配布とリリース戦略 |

## MCPサーバー（AIエージェント連携）

このリポジトリ内のドキュメントをAIエージェントから安全に参照できるMCPサーバーを提供しています。セットアップとクライアント設定は [mcp/README.md](./mcp/README.md) を参照してください。

## 対象者

- AI開発ツールを活用したい開発チーム
- プロジェクトドキュメントの効率化を目指すエンジニア
- AI時代の開発手法に興味がある技術者

## 特徴

- ✨ **軽量**：必要最小限の7つのドキュメントのみ
- 🤖 **AI最適化**：AI開発ツールが理解しやすい構造
- 📈 **実証済み**：実際のプロジェクトでの効果を検証済み
- 🔄 **移行可能**：既存プロジェクトからの段階的移行をサポート

## 始め方

1. まずは [`docs/GETTING_STARTED.md`](./docs/GETTING_STARTED.md) でAI優先の進め方と読み順を確認
2. [`docs/MASTER.md`](./docs/MASTER.md) をベースにプロジェクト識別・方針を整備（SSOT明確化）
3. [`docs/01-context/PROJECT.md`](./docs/01-context/PROJECT.md) と [`docs/02-design/ARCHITECTURE.md`](./docs/02-design/ARCHITECTURE.md) を最小セットで充足
4. テスト方針は [`docs/04-quality/TESTING.md`](./docs/04-quality/TESTING.md) を参照し、機能と同時にテスト生成
5. 不足は生成物から逆引きで補完（Quickstart参照）

## ライセンス

このプロジェクトは[MITライセンス](./LICENSE)の下で公開されています。

## リリース/変更履歴

- 変更履歴: [CHANGELOG.md](./CHANGELOG.md)
- リリース一覧: https://github.com/feel-flow/ai-spec-driven-development/releases

---

**プロジェクト管理者**: FEEL-FLOW  
**最終更新**: 2025年8月29日  
**お問い合わせ**: [https://feelflow.co.jp](https://feelflow.co.jp) のお問い合わせフォームへ