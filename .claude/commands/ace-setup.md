# /ace-setup — ACE フレームワーク セットアップ

プロジェクトに ACE (Agentic Context Engineering) フレームワークをセットアップします。
対話形式で配置先やAIツールの設定を確認しながら進めます。

## 前提

- git リポジトリで作業中であること
- `docs/` ディレクトリが存在すること（`/init-docs` 済み推奨）

## 手順

ACE_SETUP.md の対話フローに従って実行してください。

### 参照ドキュメント

セットアップの詳細手順は以下を参照:

- セットアップガイド: このリポジトリの `docs/ACE_SETUP.md`
  - GitHub URL: <https://github.com/feel-flow/ai-spec-driven-development/blob/develop/docs/ACE_SETUP.md>

### テンプレートファイルの参照先

以下のファイルをテンプレートとして使用:

- PLAYBOOK.md テンプレート: `docs-template/08-knowledge/PLAYBOOK.md`
- ACEサイクル運用手順: `docs-template/05-operations/deployment/ace-cycle.md`
- ace-curate コマンド: `.claude/commands/ace-curate.md`

### 実行フロー

1. `docs/ACE_SETUP.md` を読み込む（このリポジトリ内 or GitHub URL から取得）
2. ACE_SETUP.md の「対話型セットアップフロー」に従い、Step 1〜5 を順に実行
3. 各ステップでユーザーに確認を取りながら進行
4. テンプレートファイルの内容は上記の参照先から取得して配置

## 注意事項

- 既存ファイルがある場合は上書きせず、ユーザーに確認すること
- 配置先ディレクトリが存在しない場合は自動作成すること
- ace-curate.md をコピーする際は PLAYBOOK.md のパスを置換すること
