# ACE Setup — 対話型セットアップ機能の設計仕様

## 概要

ACE (Agentic Context Engineering) フレームワークを、URLを渡すだけ or コマンド一発でプロジェクトにセットアップできるようにする。Claude Code と GitHub Copilot の両方に対応する。

## 対象ユーザー

`ai-spec-driven-development` フレームワークを使って自分のプロジェクトにACEを導入したい人。`/init-docs` で7文書構造をセットアップ済みの前提。

## 要件

1. **URLベースのセットアップ**: ACE_FRAMEWORK.md の URL を渡して「ACEをセットアップして」と言うだけで、AIが対話的にセットアップを実行できる
2. **コマンドベースのセットアップ**: Claude Code の `/ace-setup` でも同等のセットアップが可能
3. **GitHub Copilot 対応**: Copilot用の専用指示ファイルを用意し、`/ace-curate` 相当の品質で ACE サイクルを回せる
4. **対話型**: 各ステップでユーザーに確認を取りながらステップバイステップで進行

## 作成・変更ファイル一覧

| ファイル | 種別 | 説明 |
|---------|------|------|
| `docs/ACE_SETUP.md` | 新規 | 対話型セットアップガイド（AIツール共通） |
| `docs/ACE_FRAMEWORK.md` | 変更 | 末尾にACE_SETUP.mdへのリンク追加 |
| `.claude/commands/ace-setup.md` | 新規 | Claude Code用 `/ace-setup` コマンド |
| `.github/copilot-instructions-ace.md` | 新規 | Copilot用ACE専用カスタム指示 |

## 詳細設計

### 1. `docs/ACE_SETUP.md` — 対話型セットアップガイド

AIツールが読んで対話フローを理解し、ユーザーと対話しながらセットアップを実行するためのドキュメント。

#### 構造

- Frontmatter（id, title, version, status, etc.）
- 概要（このドキュメントの目的）
- 前提条件
- 対話型セットアップフロー（5ステップ）
- テンプレート参照情報
- トラブルシューティング

#### 対話フロー

**Step 1: 前提確認**
- AIが自動チェックする項目:
  - `docs/` ディレクトリが存在するか
  - 7文書構造（MASTER.md等）があるか
  - 既にPLAYBOOK.mdが存在しないか
- 問題がある場合はユーザーに報告し、対応を確認

**Step 2: 配置先の確認**（ユーザーに質問）
- Playbookの配置先を確認
  - デフォルト: `docs/08-knowledge/PLAYBOOK.md`
  - カスタムパスも許可
- ACEサイクル手順の配置先を確認
  - デフォルト: `docs/05-operations/deployment/ace-cycle.md`
  - カスタムパスも許可

**Step 3: ファイル配置**
- テンプレートリポジトリ（`feel-flow/ai-spec-driven-development`）の以下を参照:
  - `docs-template/08-knowledge/PLAYBOOK.md` → PLAYBOOK.mdテンプレート
  - `docs-template/05-operations/deployment/ace-cycle.md` → 運用手順
- テンプレート内容をユーザーが指定したパスに配置
- PLAYBOOK.md のエントリ一覧は空（コメントのテンプレート例のみ残す）
- Frontmatter のプレースホルダーをプロジェクト情報で置換

**Step 4: AIツール固有の設定**（ユーザーに質問）
- 使用AIツールを確認:
  - (a) Claude Code のみ
  - (b) GitHub Copilot のみ
  - (c) 両方
- Claude Code の場合:
  - `.claude/commands/ace-curate.md` を配置（テンプレートからコピー）
  - ace-curate コマンド内の PLAYBOOK.md パスを Step 2 の回答で調整
- GitHub Copilot の場合:
  - `.github/copilot-instructions-ace.md` を配置
  - 既存の `.github/copilot-instructions.md` があれば、ACEファイルへの参照を追記

**Step 5: 完了確認**
- 配置したファイルの一覧を表示
- 各ファイルの役割を簡潔に説明
- 最初のACEサイクルの実行方法を案内:
  - Claude Code: `/ace-curate` を実行
  - Copilot: 「ACEサイクルを実行して」と指示

### 2. `.claude/commands/ace-setup.md` — Claude Code コマンド

- ACE_SETUP.md の手順に従って対話的にセットアップを実行する
- 各ステップで AskUserQuestion を使ってユーザーに確認
- テンプレートはこのリポジトリの `docs-template/` から参照
- ace-curate.md も自動配置

### 3. `.github/copilot-instructions-ace.md` — Copilot用指示

Claude Code の `/ace-curate` コマンドと同等の品質で ACE サイクルを回せる詳細な指示:

- PLAYBOOK.md の構造とエントリフォーマット
- ACEサイクル（Generate → Reflect → Curate）の完全な実行手順
- 末尾追記ルール
- カウンター運用ルール
- Frontmatter 更新ルール
- コミットメッセージ規則（`knowledge: ACE-XXX [category] [summary]`）
- 既存エントリとの照合手順
- 評価マトリクス（汎用性・再現性・影響度・新規性）

### 4. `docs/ACE_FRAMEWORK.md` — 変更

- 目次に「8. セットアップ」を追加
- Changelog の直前に新セクション追加:

```markdown
## 8. セットアップ

ACE フレームワークをプロジェクトに導入する手順は [ACE_SETUP.md](./ACE_SETUP.md) を参照してください。

### クイックスタート

- **Claude Code**: `/ace-setup` コマンドを実行
- **GitHub Copilot / その他のAIツール**: このドキュメントの URL を渡して「ACEをセットアップしてください」と指示
- **手動**: [ACE_SETUP.md](./ACE_SETUP.md) の手順に従う
```

## 設計判断

### なぜ ACE_SETUP.md を分離するのか

- ACE_FRAMEWORK.md は既に300行超の概念説明文書として完結している
- セットアップ手順を混ぜると「概念を知りたい人」と「セットアップしたい人」の両方にとって読みにくくなる
- 関心の分離により、各ファイルがコンパクトで目的が明確になる

### なぜ Copilot用に別ファイルを作るのか

- `.github/copilot-instructions.md` は全体のプロジェクト指示で、ACE以外の指示も含む可能性がある
- ACE専用ファイルとして分離することで、セットアップ時に「追記」ではなく「配置」で済む
- ユーザーが既存の copilot-instructions.md を持っている場合のコンフリクトを避けられる

### URLベースセットアップの仕組み

- ACE_FRAMEWORK.md のセットアップセクションから ACE_SETUP.md への明確なリンクがある
- ACE_SETUP.md 自体が「AIが読んで対話フローを理解できる」構造になっている
- AIツールは URL → ACE_FRAMEWORK.md → ACE_SETUP.md のリンクを辿って手順を把握する
- または直接 ACE_SETUP.md の URL を渡してもよい

## テスト計画

1. Claude Code で `/ace-setup` を実行し、対話フローが正しく動作するか確認
2. ACE_FRAMEWORK.md の GitHub URL を渡して「ACEをセットアップして」と指示し、AIがACE_SETUP.mdに辿り着いてセットアップを開始するか確認
3. 生成された PLAYBOOK.md、ace-cycle.md が正しいテンプレートになっているか確認
4. `/ace-curate` コマンドが生成されたファイル構造で正常動作するか確認
5. Copilot用指示ファイルの内容が ace-curate コマンドと同等の情報を含むか確認
