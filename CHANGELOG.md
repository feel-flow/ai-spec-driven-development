# Changelog

このプロジェクトの変更履歴。フォーマットは Keep a Changelog に準拠し、SemVer でバージョニングします。

## [Unreleased]

## [v2.1.0] - 2025-10-28
### Added
- **ドキュメント構造の大幅改善**
  - `docs/` を `docs-template/` にリネーム（テンプレートとして明確化）
  - 企画フェーズのサポート追加
    - `docs-template/00-planning/PLANNING_TEMPLATE.md`: アイデア→要件定義の企画書テンプレート（9セクション構成）

- **完全初心者向けオンボーディング体系**
  - `docs-template/GETTING_STARTED_ABSOLUTE_BEGINNER.md`: 何も決まっていない状態からの完全ガイド（4.5時間）
    - 環境準備（1時間）
    - アイデア発想（30分）
    - AIツールへの相談（1時間）
    - 技術選定（1時間）
    - 実装準備（1時間）
  - `docs-template/GETTING_STARTED_NEW_PROJECT.md`: 新規プロジェクト完全ガイド（8-12時間）
    - Phase 0: 企画（2-3時間）
    - Phase 1: 要件定義（2-3時間）
    - Phase 2: 技術選定（1-2時間）
    - Phase 3: システム設計（2-3時間）
    - Phase 4: 実装準備（1時間）

- **AIツールセットアップガイド3種**
  - `docs-template/SETUP_GITHUB_COPILOT.md`: GitHub Copilot完全セットアップ（30分）
    - **AIプロンプトで自動生成機能**: copilot-instructions.md を5-10分で自動生成
    - プロジェクト固有のカスタマイズ例（React、Node.js、Next.js）
    - 高度なプロンプトテンプレート集（既存コードベース学習、チーム規約変換等）
  - `docs-template/SETUP_CLAUDE_CODE.md`: Claude Code完全セットアップ（40分）
    - CLAUDE.md 設定ガイド
    - マルチターン対話、大規模コンテキスト活用法
    - プロンプトテンプレート集
  - `docs-template/SETUP_CURSOR.md`: Cursor完全セットアップ（60分）
    - .cursorrules 設定ガイド
    - AI Chat、Command K、Composer モード活用法
    - VS Code互換設定

- **情報不足時の必須確認プロトコル**（🚨 重要な追加機能）
  - `docs-template/MASTER.md`: 「AIツール向け重要ルール」セクション新設
    - 情報不足時の必須確認プロトコル定義
    - 必須確認事項チェックリスト（プロジェクト基本、技術的詳細、ビジネス要件）
    - 確認の出力形式テンプレート
    - 推論が許容される範囲の明示
    - 段階的確認の推奨フロー
    - 人間の検証タイミング（MASTER.md生成後、ARCHITECTURE.md生成後、コード生成後、デプロイ前）
  - すべてのAIツールセットアップガイドに確認ルール追加
    - AGENTS.md、CLAUDE.md、SETUP_*.md に統一フォーマットで実装
    - AIが推論で埋めず、必ず確認を求める仕組み
  - 実践例とプロンプトテンプレート追加
    - 良い例・悪い例の具体的な比較
    - データベース選択、認証方式選択等の実例

- **ドキュメントファイル命名規則の明確化**
  - `docs-template/MASTER.md`: コード命名規則とドキュメント命名規則を分離
    - ディレクトリ: `数字-英語小文字（ハイフン区切り）` (例: `01-context`, `02-design`)
    - ファイル: `英語大文字.md`（AI識別性優先）(例: `MASTER.md`, `ARCHITECTURE.md`)
    - 禁止事項: 日本語、スペース、アンダースコア、ファイル名への番号プレフィックス
  - `docs-template/03-implementation/CONVENTIONS.md`: 「0. ドキュメント命名規則」セクション新設
    - ディレクトリ構造の実例
    - 正しい例・間違い例の詳細ガイド
    - 命名ガイドライン（いつディレクトリを作るか、いつ大文字を使うか）
    - プロジェクト全体の構造例
  - 全AIツールガイドに命名規則参照を追加

- **Claude Skills統合ガイド**
  - `ai_spec_driven_development.md`: 新セクション「12. Claude Skillsによる実践的活用」
    - スキルの概要と特徴（モデル起動型、再利用可能性、拡張性）
    - 5分で完了する自動生成手順
    - 4つの自動化機能（プロジェクト初期化、新規ドキュメント追加、影響度評価、コミット前検証）
    - プロジェクトライフサイクル全体での実践例（Week 1-4）
    - チーム導入のベストプラクティス（スキル共有、標準プロンプト集、トラブルシューティング）
    - 測定可能な成果（92-90%の時間削減、100%の一貫性向上）
  - `docs-template/03-implementation/INTEGRATIONS.md`: AI開発ツール統合セクションを新設
    - 1.1 Claude Skills統合（インストール、機能、使用例、トラブルシューティング）
    - 1.2 GitHub Copilot統合（.github/copilot-instructions.md の設定例）
    - 1.3 Cursor統合（.cursorrules ファイルの設定例）

### Changed
- **ドキュメント構造の再編成**
  - 24ファイルをリネーム: `docs/` → `docs-template/`
  - すべてのドキュメント参照パスを更新（README.md、AGENTS.md、CLAUDE.md、MCP等）
  - `docs-template/GETTING_STARTED.md`: テンプレート使用に関する注記追加

- **README.md の Quick Start セクション強化**
  - 完全初心者向けガイドを最上位に配置
  - 新規プロジェクト、既存プロジェクト、AIツール設定の3つのパスを明確化
  - 所要時間を明記（完全初心者: 4.5時間、新規プロジェクト: 8-12時間、AIツール設定: 30-60分）

- **MASTER.md の関連ドキュメントセクション再構成**
  - 初心者・新規プロジェクト向け（3ガイド）
  - AIツール初期設定ガイド（3ガイド）
  - 既存プロジェクト向け（1ガイド）
  - コア7文書（6文書）
  - ナレッジベース（4文書）
  - 合計17文書への明確な導線

- **AIツール向けガイドの統一**
  - AGENTS.md に情報確認ルール追加
  - CLAUDE.md に Information Verification Protocol 追加
  - すべてのセットアップガイドに確認ルールを統合

- **MCP サーバー設定の更新**
  - `mcp/index.mjs`: docsRoot を "docs" から "docs-template" に変更
  - `mcp/README.md`: Glossary パス更新
  - 説明文の例を最新のディレクトリ構造に合わせて更新

- 既存のセクション「12. まとめ：パラダイムシフトの必要性」をセクション13に変更（Claude Skillsセクション追加に伴う構造調整）
- 目次を更新し、新セクション12とサブセクション（12.1-12.5）を追加

### Impact
- **High Impact**: プロジェクト全体の構造変更
  - すべてのドキュメントパスが変更（`docs/` → `docs-template/`）
  - 外部からのリンクは引き続き機能（GitHubが自動リダイレクト）
  - AIツールの動作に影響（確認プロトコルの追加により、より慎重な動作）
- **Medium Impact**: 
  - 新規ユーザーのオンボーディング体験が大幅に向上
  - AIツールの設定が明確化され、チーム展開が容易に
  - 情報不足による手戻りが大幅削減

### Migration Notes
- 既存プロジェクトで `docs/` フォルダを参照している場合、`docs-template/` に変更
- AIツール設定ファイル（.github/copilot-instructions.md、CLAUDE.md、.cursorrules）の更新推奨
- MASTER.md の情報不足時確認プロトコルに従って、AIとの対話を見直すことを推奨

### Breaking Changes
- `docs/` ディレクトリが `docs-template/` に変更
  - Git履歴は保持（git mv使用）
  - 既存の参照は更新が必要

### Performance
- AIツールの判断精度向上により、手戻り時間が推定60-80%削減
- ドキュメント生成時間: 5-10分に短縮（AIプロンプト自動生成機能使用時）

### Files Changed
- 37ファイルの変更
  - 24ファイルのリネーム
  - 6ファイルの新規作成
  - 7ファイルの内容更新

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

[Unreleased]: https://github.com/feel-flow/ai-spec-driven-development/compare/v2.1.0...HEAD
[v2.1.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v2.1.0
[v2.0.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v2.0.0
[v0.3.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v0.3.0
[v0.2.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v0.2.0
[v0.1.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v0.1.0