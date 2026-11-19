---
id: release-branch-guide
title: develop → main 本番公開運用ガイド（参考）
version: 1.0.0
status: active
created: 2026-11-19
updated: 2026-11-19
owner: feel-flow
phase: mvp
tags: [git, github, release, branch-protection, deployment]
references:
  - docs/AI_GIT_WORKFLOW.md
  - docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md
  - docs-template/05-operations/deployment/github-setup.md
changeImpact: low
visibility: public
---

# develop → main 本番公開運用ガイド（参考）

> **このガイドの位置づけ（任意・参考）**: 本ガイドは必須ルールではありません。ASDD 2.0 はプロジェクトの規模や既存の組織ルールに合わせた運用を前提としており、単一ブランチ運用やトランクベース開発を否定しません。「`develop` で統合検証し、`main` へのマージでのみ本番公開する運用」を採用・徹底したいプロジェクト向けの参考レシピです。

## 1. 採用判断（使う / 使わない）

| プロジェクトの性格                                           | 推奨                         | 理由                                                       |
| ------------------------------------------------------------ | ---------------------------- | ---------------------------------------------------------- |
| Staging と本番が分かれた Web アプリ・API・継続運用プロダクト | **採用を推奨**               | 検証済みの変更だけをまとめて本番へ昇格でき、誤反映を防げる |
| PoC・市民開発・ドキュメント中心リポジトリ                    | **不要（単一ブランチで可）** | ブランチ昇格の手間が効果を上回りやすい                     |
| すでにトランクベース開発・別リリース戦略があるチーム         | **既存ルールを優先**         | 組織の標準運用と二重管理にしない                           |

---

## 2. ブランチの流れとマージ方式の使い分け

```text
feature/#123-xxx ──(Squash merge)──▶ develop ──(Merge commit / FF)──▶ main（本番公開）
                                       ▲                                │
                                       └──(バックマージ)── hotfix/#456 ──┘
```

### 最も多い落とし穴: マージ方式を混同しない

- **`feature/* → develop`**: **Squash merge** を推奨（1 PR = 1 コミットで履歴を簡潔に保つ）。
- **`develop → main`**: **Merge commit（または Fast-forward）** を使う。
  - `develop → main` を Squash merge すると、両ブランチの共通祖先がずれて次回以降のリリース PR でコンフリクトや過去差分の再出現が起き続けます。
- **`hotfix/* → main`**: 本番緊急修正を `main` へマージしたら、必ず **`main → develop` へバックマージ**して差分を解消します。

---

## 3. 人の注意力に頼らず徹底する 4 層ガード

口頭ルールやドキュメントだけでは、人間もうっかり `main` へ PR を出し、AI エージェントも既定設定で `main` を対象にしてしまいます。以下の 4 層を組み合わせて仕組み化します。

### 層 1: GitHub リポジトリ設定（サーバー側強制）

1. **Default branch を `develop` に変更する**
   - `Settings → General → Default branch` を `develop` に設定すると、Web UI や `gh pr create` の既定ベースが `develop` になります。
2. **`main` に厳格な Ruleset を設定する**（`Settings → Rules → Rulesets`）
   - Require a pull request before merging（Direct push 禁止）
   - Block force pushes / Restrict deletions
   - Require status checks to pass（CI および下のソースブランチ検証ジョブ）
   - チーム運用なら Require approvals（1 名以上）
   - **Bypass list は原則空にする**（管理者も含めて例外を塞ぐ）
3. **`develop` にも保護 Ruleset を設定する**
   - Block force pushes / Restrict deletions
   - PR 経由必須 + 基本チェック（lint / test）
   - ※ 知見ファイル等の自動直 push（例: ACE Playbook の自動コミット）を併用する場合は、`develop` への直 push 禁止と衝突するため、知見専用ブランチ経由へ逃がすかバイパス対象を明示設計します。

### 層 2: `main` へのソースブランチを限定する

GitHub の Ruleset 単体では「`develop` からの PR のみ許可」を指定できないため、運用方針（GitHub Actions の有無）に合わせて次を選びます。

#### A. GitHub Actions を使う構成（推奨・自動強制）

以下のワークフローを配置し、ジョブ `check-source-branch` を **`main` Ruleset の Required status checks に登録**します。

```yaml
# .github/workflows/enforce-main-source.yml
name: Enforce Main Source Branch

on:
  pull_request:
    branches: [main]

jobs:
  check-source-branch:
    runs-on: ubuntu-latest
    steps:
      - name: Allow only develop or hotfix/* into main
        run: |
          HEAD_REF="${{ github.head_ref }}"
          if [[ "$HEAD_REF" != "develop" && "$HEAD_REF" != hotfix/* ]]; then
            echo "::error::main への PR は develop または hotfix/* からのみ許可されています（現在: ${HEAD_REF}）"
            exit 1
          fi
```

#### B. GitHub Actions を使わない構成

ローカル品質ゲート運用（[NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md](./NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md)）では Actions による自動ブロックを行わないため、以下を組み合わせて代替します。

- Default branch を `develop` に固定する
- `main` の Ruleset で **Direct push 禁止 + 人間による承認必須（または手動マージ限定）** を有効にする
- 下の「層 3（デプロイ境界の固定）」と「層 4（AI ルール）」を必ず併用する

### 層 3: 本番デプロイ権限を `main` に一本化する

`main` を経由せずに本番反映できる抜け道を塞ぎます。

- **GitHub Environments (`production`)**:
  - `Deployment branches and tags` を **Selected branches: `main` のみ**（または保護タグ `v*` のみ）に制限する。
  - 本番用シークレット / OIDC 認証情報は `production` Environment にのみ紐づける。
  - 必要に応じ `Required reviewers` でデプロイ前承認を挟む。
- **ホスティング / PaaS（例: Vercel / Cloudflare / AWS 等のクラウド環境）**:
  - どのサービスを使う場合でも、Production branch = `main`、Staging / Preview = `develop`（および PR）に固定する。
  - 開発者 PC からの本番直デプロイコマンド（例: `vercel --prod` 等）は原則禁止とし、CI または本番ブランチ連携に一本化する。

### 層 4: AI エージェント向けルール（`AGENTS.md` / `CLAUDE.md`）

採用したプロジェクトでは、AI 入口ファイル（`AGENTS.md` / `CLAUDE.md`）に次の 3 点を明記しておくと誤操作を防げます。

```markdown
## ブランチ・リリース運用

- 通常開発の作業ブランチは `develop` から分岐し、PR の base は必ず `develop` にする。
- `main` への直接 push・通常 PR 作成・自動マージは行わない。
- 本番公開（`develop → main`）は明示的なリリース指示時のみ、Merge commit で実施する。
```

---

## 4. リリース手順の例（`develop → main`）

```bash
# 1. develop の最新化とローカル品質ゲート確認
git checkout develop && git pull origin develop
# （ここでプロジェクトのテスト / ビルド / Staging 動作確認を完了させる）

# 2. develop → main のリリース PR を作成
gh pr create --base main --head develop \
  --title "release: vX.Y.Z" \
  --body "Staging 確認済みの変更を本番反映します。"

# 3. CI / 承認を確認後、Merge commit でマージ（--squash は使わない）
gh pr merge --merge <PR番号>

# 4. 必要に応じ main 上でタグ・GitHub Release を作成
git fetch origin main
gh release create vX.Y.Z --target main --generate-notes
```

---

## 5. 導入チェックリスト

- [ ] Default branch が `develop` になっている
- [ ] `main` の Ruleset で Direct push / Force push / 削除が禁止され、Bypass list を確認した
- [ ] （GitHub Actions 利用時）`enforce-main-source.yml` が `main` の Required status check に登録されている
- [ ] `develop → main` のマージ方式が Merge commit（または FF）に統一されている
- [ ] 本番デプロイ先（Environment / ホスティング設定）が `main` のみに限定されている
- [ ] `AGENTS.md` / `CLAUDE.md` に `develop` ベース運用と `main` 保護の方針を明記した

---

## 関連ドキュメント

- [AI駆動 Git Workflow](./AI_GIT_WORKFLOW.md) - AI 仕様駆動開発の全体ワークフロー
- [NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md](./NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md) - GitHub Actions 非依存運用の設計
- [github-setup.md](../docs-template/05-operations/deployment/github-setup.md) - ラベル・Release Drafter の初期設定テンプレート
