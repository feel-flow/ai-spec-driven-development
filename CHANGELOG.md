# Changelog

このプロジェクトの変更履歴。フォーマットは Keep a Changelog に準拠し、SemVer でバージョニングします。

## [Unreleased]

## [v2.0.0] - 2025-10-16
### Added
- 新ドキュメント運用仕様書 `ai_spec_driven_development.md` (再構築後版): フロントマター標準・分類マトリクス・更新ポリシー・AIエージェント操作チェックリストを追加
- 変更インパクトレベル (low/medium/high) と差分分類ルール
- MUSTコマンド群によるAI自動化前提の運用フロー定義

### Changed
- 旧 `ai_spec_driven_development.md` の長文ナラティブ構成を撤廃し、< 1画面単位で把握可能なセクション化された運用仕様へ再編 (High Impact)
- 文書間参照の正規化 (MASTER.md / ARCHITECTURE.md / DOMAIN.md との明示的 References)
- バージョンを 0.x 系から 2.0.0 へメジャーアップ (構造的破壊的変更)

### Removed
- 冗長な歴史的説明・概念重複ブロック (>2000行) を削除し検索ノイズを解消

### Security
- ドキュメント変更時の補助チェックリストに「機密情報/シークレット流出防止」項目を追加 (セキュリティゲート強化)

### Performance
- AIエージェントのドキュメント読込ステップ短縮 (推定: 初期解析時間 ~60% 削減) に寄与する構造化 (定量計測予定)

### Migration Notes
- 旧構造参照している README 内リンクは自動/手動検証後に更新が必要 (Unreleased タスク)
- 追加された差分分類 (HIGH/MEDIUM/LOW) を以後のドキュメントPRテンプレートへ反映予定

### Impact
- High Impact: 他AIエージェント文書参照順序/自動化フローに影響。CHANGELOG/ADR/LESSONS_LEARNED 更新必須。

### Follow-up (Unreleased)
- [ ] PRテンプレートへ Impact Level / 文書分類チェック項目を追加
- [ ] docs/04-quality/VALIDATION.md にドキュメント構造検証手順を統合

## [v0.3.0] - 2025-09-25

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

[Unreleased]: https://github.com/feel-flow/ai-spec-driven-development/compare/v2.0.0...HEAD
[v2.0.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v2.0.0
[v0.3.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v0.3.0
[v0.2.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v0.2.0
[v0.1.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v0.1.0