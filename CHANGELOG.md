# Changelog

このプロジェクトの変更履歴。フォーマットは Keep a Changelog に準拠し、SemVer でバージョニングします。

## [Unreleased]

## [v0.4.0] - 2025-09-29
### Added
- Chrome DevTools MCPをAI駆動デバッグツールとして追加
  - Web開発向けリアルタイムデバッグツールとして推奨
  - DOM操作、ネットワーク監視、パフォーマンス分析機能を活用
  - Playwright MCPとの使い分けを明確化（E2Eテスト vs リアルタイムデバッグ）

### Changed
- `docs/MASTER.md`: AI駆動デバッグツールセクションを拡充
- `.cursorrules`: Chrome DevTools MCP推奨を追加
- `.github/copilot-instructions.md`: Chrome DevTools MCP推奨を追加

## [v0.3.0] - 2025-09-25
### Added
- ナレッジ蓄積システム（08-knowledge/フォルダ）の追加
  - `LESSONS_LEARNED.md`: 開発過程で得た知見・解決策の記録
  - `TROUBLESHOOTING.md`: よくある問題と解決策の集約
  - `BEST_PRACTICES.md`: プロジェクト固有のベストプラクティス集
  - `FAQ.md`: よくある質問と回答
- AIエージェント向けガイドシステムの構築
  - `AGENTS.md`: 全AIエージェント向け統一ガイド
  - `CLAUDE.md`: Claude Code専用ガイド（MASTER.md参照必須化）
  - `.cursorrules`: Cursor用設定ファイル
  - `.github/copilot-instructions.md`: GitHub Copilot用設定ファイル
- 初期・成長フェーズでのナレッジ管理の重要性を文書化
- AI駆動開発におけるナレッジ活用の説明を追加

### Changed
- `docs/MASTER.md`: 関連ドキュメントのパスを正しい階層構造に修正
- `ai_spec_driven_development.md`: ナレッジ蓄積の重要性とフォルダ構造を追加
- `README.md`: AIエージェント向けガイドセクションを追加
- 実装ロードマップにナレッジ管理の要素を組み込み

### Fixed
- ドキュメント間のリンクの整合性を向上
- AIエージェントがMASTER.mdを必ず参照する仕組みを構築

## [v0.2.0] - 2025-09-14
### Added
- Quickstart への導線整備（README・MASTERのリンク）
- リリース自動化（Release Drafter + タグでGitHub Release作成のActions）
- CHANGELOG 初版

### Changed
- README の「始め方」を Quickstart 起点に更新
- README.md を DRY原則に基づき簡潔化（68行→45行、33%削減）
  - 7文書構造の詳細説明を ai_spec_driven_development.md へ集約
  - エントリーポイント機能に特化（ナビゲーション中心）
  - 重複情報を排除し、完全ガイドへの参照を強化

## [v0.1.0] - 2025-08-29
### Added
- `docs/GETTING_STARTED.md`: AI駆動（ドキュメント基準）開発 Quickstart
- Quickstart 前提（AI優先・一次情報での検証・時間は目安）

[Unreleased]: https://github.com/feel-flow/ai-spec-driven-development/compare/v0.4.0...HEAD
[v0.4.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v0.4.0
[v0.3.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v0.3.0
[v0.2.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v0.2.0
[v0.1.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v0.1.0