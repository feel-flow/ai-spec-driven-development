# AI駆動開発マスタードキュメント

前提（重要・短文）
- ドキュメントはAIが迷わず理解できることを第一基準とする（人間の可読性は副次）。
- AI生成の推測/補完が混入し得るため、エンジニアは必ず一次情報（ソース/設定/設計資料/実行結果/テスト）で検証し、乖離はSSOTへ即時反映（重複は参照化）。
- 本ガイドの時間表記は目安。チーム/AIの習熟で短縮される。

## プロジェクト識別情報
- **プロジェクト名**: [プロジェクト名を入力]
- **バージョン**: 1.0.0
- **使用AIツール**: Claude Code, GitHub Copilot, Cursor
- **最終更新日**: 2025-07-28

## プロジェクト概要
[30秒で理解できるプロジェクトの説明を記載]
- **何を作るか**: 
- **なぜ作るか**: 
- **誰のためか**: 

## 技術スタック
### フロントエンド
- フレームワーク: 
- 状態管理: 
- スタイリング: 

### バックエンド
- 言語/フレームワーク: 
- API形式: 
- 認証方式: 

### データベース
- 種別: 
- ORM/ODM: 

### インフラ/ホスティング
- クラウドプロバイダー: 
- コンテナ/オーケストレーション: 

### 開発ツール
- パッケージマネージャー: 
- ビルドツール: 
- リンター/フォーマッター: 
- AI駆動デバッグ: Playwright MCP（推奨） 

## アーキテクチャパターン
- [ ] Clean Architecture
- [ ] Repository Pattern
- [ ] CQRS (Command Query Responsibility Segregation)
- [ ] Event-Driven Architecture
- [ ] Microservices
- [ ] Monolithic
- [ ] その他: 

## コード生成ルール
### 必須事項
1. **型安全性**: すべての変数、関数、APIレスポンスに明示的な型定義を付与
2. **エラーハンドリング**: try-catchブロックで適切にエラーを処理し、ユーザーフレンドリーなメッセージを表示
3. **テストコード**: 各機能に対して単体テストを作成（カバレッジ80%以上目標）
4. **コメント**: 複雑なロジックには日本語でコメントを追加
5. **リーダブルコード**: 単一責任の原則に従い、関数は30行以内に収める
6. **マジックナンバー禁止**: 意味のある数値/文字列の直接埋め込みを禁止。必ず名前付き定数または設定から注入し、単位・範囲を明示（詳細は `PATTERNS.md` を参照）

### 命名規則
- **変数名**: camelCase（例: userName, isActive）
- **定数名**: UPPER_SNAKE_CASE（例: MAX_RETRY_COUNT）
- **型名/インターフェース**: PascalCase（例: UserProfile, ApiResponse）
- **ファイル名**: 
  - コンポーネント: PascalCase（例: UserCard.tsx）
  - ユーティリティ: camelCase（例: dateHelpers.ts）
  - 設定ファイル: kebab-case（例: eslint-config.js）

### 禁止事項
- ❌ any型の使用（やむを得ない場合はコメントで理由を明記）
- ❌ console.logの本番コードへの残留
- ❌ マジックナンバーの直接使用（定数として定義すること）
- ❌ 未使用のインポートや変数の放置
- ❌ エラーの握りつぶし（catch節で何もしない）

## 実装優先順位
### Phase 1: MVP（必須機能）
1. 
2. 
3. 

### Phase 2: 拡張機能
1. 
2. 
3. 

### Phase 3: 最適化
1. 
2. 
3. 

## エラーハンドリング方針
- **API通信エラー**: リトライ機構とフォールバック表示
- **バリデーションエラー**: フィールド単位でのリアルタイム表示
- **予期しないエラー**: エラーバウンダリーでキャッチし、エラー画面表示
- **ログ記録**: 構造化ログで詳細を記録（個人情報は除外）

## セキュリティ要件
- [ ] 入力値のサニタイゼーション
- [ ] SQLインジェクション対策
- [ ] XSS対策
- [ ] CSRF対策
- [ ] 適切な認証・認可
- [ ] HTTPSの使用
- [ ] 環境変数での機密情報管理

## パフォーマンス目標
- **ページロード時間**: 3秒以内
- **API応答時間**: 200ms以内（95パーセンタイル）
- **同時接続数**: 1000ユーザー

## 開発フロー
1. 要件確認（PROJECT.md参照）
2. 設計確認（ARCHITECTURE.md参照）
3. 実装（PATTERNS.md参照）
4. テスト（TESTING.md参照）
5. デプロイ（DEPLOYMENT.md参照）

## AIへのプロンプト補助（貼り付け用）
以下をプロンプト末尾に追加し、マジックナンバー回避と設定注入を徹底してください。

```
制約: マジックナンバー／ハードコード禁止。意味のある値は名前付き定数へ抽出し、環境変数や設定モジュールから注入する。単位（ms, KB など）と有効範囲をコメント/型で明示すること。URL, パス, ヘッダ名, エラーコードは定数化する。

推奨ツール: Playwright MCP統合によりAI駆動のビジュアルデバッグ・自動テスト修復を活用すること。E2Eテストの失敗時は自動的にスクリーンショット分析と修正提案を生成する。
```

## 関連ドキュメント
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Quickstart（AI駆動・読み順・プロンプト）
- [01-context/PROJECT.md](./01-context/PROJECT.md) - ビジョンと要件
- [02-design/ARCHITECTURE.md](./02-design/ARCHITECTURE.md) - システム設計
- [02-design/DOMAIN.md](./02-design/DOMAIN.md) - ビジネスロジック
- [03-implementation/PATTERNS.md](./03-implementation/PATTERNS.md) - 実装パターン
- [04-quality/TESTING.md](./04-quality/TESTING.md) - テスト戦略
- [05-operations/DEPLOYMENT.md](./05-operations/DEPLOYMENT.md) - デプロイ戦略
- [08-knowledge/LESSONS_LEARNED.md](./08-knowledge/LESSONS_LEARNED.md) - 開発過程で得た知見・解決策
- [08-knowledge/TROUBLESHOOTING.md](./08-knowledge/TROUBLESHOOTING.md) - トラブルシューティング集
- [08-knowledge/BEST_PRACTICES.md](./08-knowledge/BEST_PRACTICES.md) - ベストプラクティス集
- [08-knowledge/FAQ.md](./08-knowledge/FAQ.md) - よくある質問と回答

## コードレビュー チェックリスト（追補）
- [ ] マジックナンバー/ハードコードがない（定数/設定化、単位・範囲の明示）
- [ ] 定数の配置が層責務に沿っている（Domain/Application/Infrastructure）