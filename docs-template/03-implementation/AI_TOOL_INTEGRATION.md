---
title: "AI_TOOL_INTEGRATION"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "2026-10-15"
updated: "2026-10-15"
---

# AI_TOOL_INTEGRATION.md - AI開発ツール統合ガイド

Claude Code / GitHub Copilot / Cursor から本プロジェクトの仕様文書を参照させるための設定例。ツールごとの導入手順は `docs/SETUP_CLAUDE_CODE.md`・`docs/SETUP_GITHUB_COPILOT.md`・`docs/SETUP_CURSOR.md` を参照する（本文書は INTEGRATIONS.md から分離した。外部サービス統合とは関心が異なるため）。

## 1. Claude Skills統合

Claude Code を使用している場合、AI仕様駆動開発専用のスキルをインストールすることで、ドキュメント管理を自動化できます。

### スキルのインストール

Claude Codeで以下のプロンプトを実行することで、AI仕様駆動開発スキルが自動生成されます：

```
Claude Code用のスキルを作成したいです。

【目的】
AI仕様駆動開発の方法論に基づいて、プロジェクトのドキュメント構造を自動管理するスキルを作成

【参考資料】
- 公式リポジトリ: https://github.com/feel-flow/ai-spec-driven-development
- 方法論ドキュメント: https://github.com/feel-flow/ai-spec-driven-development/blob/develop/ai_spec_driven_development.md

【実装してほしい機能】
1. プロジェクト初期化（フォルダ構造の自動生成）
2. ドキュメント構造の検証と自動補修
3. 新規ドキュメントの適切な配置支援
4. ドキュメント更新時の影響度評価
5. MASTER.md索引の自動更新
6. Frontmatterメタデータの自動挿入
7. 用語集・決定記録の管理
8. コミット前の検証チェックリスト実行
```

### スキルの機能

インストール後、以下の機能が自動的に利用可能になります：

| 機能                 | トリガープロンプト                           | 実行内容                                                         |
| -------------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| プロジェクト初期化   | 「AI仕様駆動開発を導入したい」               | docs/フォルダ構造とMASTER.mdなど必須ファイルを自動生成           |
| 新規ドキュメント追加 | 「[トピック]のドキュメントを追加したい」     | Decision Matrixに基づき適切なフォルダに配置、Frontmatter自動挿入 |
| ドキュメント更新     | 「[ファイル名]を変更したい」                 | 影響度評価、バージョン更新、CHANGELOG連携を自動実行              |
| 構造検証             | 「コミット前にドキュメントをチェックしたい」 | フォルダ完全性、命名規約、メタデータ、リンク整合性を検証         |
| 用語管理             | 「GLOSSARYに[用語]を追加したい」             | 統一フォーマットで用語定義を追加、重複チェック                   |
| 決定記録             | 「[決定内容]をDECISIONSに記録したい」        | ADRフォーマットで決定記録を追加                                  |

### 導入メリット

- **手作業ゼロ**: フォルダ構造、Frontmatter、索引更新などを自動化
- **一貫性保証**: Decision Matrixと命名規約を常に適用
- **影響度評価**: 変更時の影響度を自動判定、CHANGELOG連携
- **検証自動化**: コミット前の構造検証をワンコマンドで実行
- **チーム標準化**: スキルを共有することでチーム全体の標準化を実現

### 使用例

```bash
# プロジェクト初期化
Claude: 「このプロジェクトにAI仕様駆動開発を導入したい」

# 出力例:
# ✓ docs/フォルダ構造を生成
# ✓ docs/MASTER.md 作成
# ✓ docs/01-context/PROJECT.md 作成
# ✓ 必須8文書を生成
# ✓ Frontmatter挿入完了

# 新規ドキュメント追加
Claude: 「データベース設計のドキュメントを追加したい」

# 出力例:
# Decision Matrixを適用...
# → 「設計/構造」に該当: 02-design/
# ✓ docs/02-design/DATABASE.md 作成
# ✓ Frontmatter挿入（id: database-design, version: 1.0.0）
# ✓ MASTER.md索引を更新

# コミット前検証
Claude: 「コミット前にドキュメントをチェックしたい」

# 出力例:
# [完全性チェック] ✓ 8フォルダ存在
# [必須ファイル] ✓ 8文書存在
# [メタデータ] ✓ Frontmatter正常
# [命名規約] ✓ 違反なし
# [整合性] ⚠ GLOSSARY未定義用語: 3件
# 検証結果: ⚠ WARNING（コミット可能）
```

### トラブルシューティング

| 問題                    | 解決方法                                       |
| ----------------------- | ---------------------------------------------- |
| スキルが起動しない      | プロンプトに「AI仕様駆動開発」を明示的に含める |
| Decision Matrixが不正確 | 「Decision Matrixで判断してください」と明示    |
| Frontmatter欠落         | Frontmatterの形式を明示的に指定                |
| 影響度評価が不正確      | 「changeImpact: high」など影響度を明示         |

詳細なガイドとトラブルシューティングについては、[Claude Skills完全ガイド](https://github.com/feel-flow/flow-note-ai/blob/main/CLAUDE_SKILLS_SETUP_GUIDE.md)を参照してください。

---

## 2. GitHub Copilot統合

GitHub Copilotを使用する場合は、MASTER.mdをワークスペースルートに配置し、以下の設定を `.github/copilot-instructions.md` に追加します：

```markdown
# Copilot Instructions

このプロジェクトはAI仕様駆動開発方法論に従っています。

## 必須参照ドキュメント

コード生成前に以下を参照してください：

1. docs/MASTER.md - プロジェクト全体のルールと技術スタック
2. docs/01-context/PROJECT.md - ビジョンと要件
3. docs/02-design/ARCHITECTURE.md - システム設計
4. docs/03-implementation/PATTERNS.md - 実装パターン

## コード生成ルール

- マジックナンバー禁止（定数化または設定注入）
- 型安全性の徹底
- エラーハンドリングパターンの適用
- テストコードの同時生成

詳細は docs/MASTER.md を参照してください。
```

---

## 3. Cursor統合

Cursorを使用する場合は、`.cursorrules` ファイルを作成し、以下を追加します：

```
# AI仕様駆動開発ルール

このプロジェクトはAI仕様駆動開発方法論に従っています。

## 必須読み込みドキュメント

@docs/MASTER.md
@docs/01-context/PROJECT.md
@docs/02-design/ARCHITECTURE.md
@docs/03-implementation/PATTERNS.md

## コード生成制約

- マジックナンバー/ハードコード禁止
- 型安全性の徹底
- ERRORS.md のエラー型と正規化パターンを適用
- テストコードを同時生成

## 命名規則

- 変数: camelCase
- 定数: UPPER_SNAKE_CASE
- 型/インターフェース: PascalCase
- ファイル: コンポーネントはPascalCase、それ以外はcamelCase
```
