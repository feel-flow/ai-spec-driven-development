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
通常リリース:  feature/#123-xxx ──(Squash merge)──▶ develop ──(Merge commit)──▶ main（本番公開）
緊急修正:      hotfix/#456      ──(Merge commit)──▶ main    ──(Merge commit)──▶ develop（バックマージ）
```

### 最も多い落とし穴: マージ方式を混同しない

- **`feature/* → develop`**: **Squash merge** を推奨（1 PR = 1 コミットで履歴を簡潔に保つ）。
- **`develop → main`**: GitHub PR 経由の運用では **Merge commit（`--merge`）** に統一する。
  - `develop → main` を Squash merge すると、両ブランチの共通祖先がずれて次回以降のリリース PR でコンフリクトや既反映差分の再出現が起き続けます。
  - GitHub PR UI には Fast-forward merge（`--ff-only`）が存在せず、類似の **Rebase and merge** はコミッター情報を書き換えて新しい SHA を生成するため、Squash と同様に共通祖先がずれます。Fast-forward は保護された自動化ジョブ等からバイパス設計付きで `--ff-only` 直 push する特殊な運用に限ります。
- **`hotfix/* → main` とバックマージ**: 緊急修正を `main` へマージしたら、必ず **`main → develop` のバックマージ PR を作成し、こちらも Merge commit（`--merge`）でマージ**します（`main → develop` を Squash merge すると同じ履歴乖離が再発します）。

---

## 3. 人の注意力に頼らず徹底する 4 層ガード

口頭ルールやドキュメントだけでは、人間もうっかり `main` へ PR を出し、AI エージェントも既定設定で `main` を対象にしてしまいます。以下の 4 層を組み合わせて仕組み化します。

### 層 1: GitHub リポジトリ設定（サーバー側強制）

1. **Default branch を `develop` に変更する**
   - `Settings → General → Default branch` を `develop` に設定すると、Web UI や `gh pr create` の既定ベースが `develop` になります。
2. **`main` に厳格な Ruleset を設定する**（`Settings → Rules → Rulesets`）
   - Require a pull request before merging（Direct push 禁止）
   - **Allowed merge methods を Merge commit のみに限定**（Squash / Rebase を無効化し、設定ミスや操作ミスによる祖先ずれを物理的に防ぐ）
   - **Require linear history は無効のままにする**（Merge commit を許可するため）
   - Block force pushes / Restrict deletions
   - Require status checks to pass（CI および下のソースブランチ検証ジョブ）
   - チーム運用なら Require approvals（1 名以上）
   - **Bypass list は原則空にする**（管理者も含めて例外を塞ぐ）
3. **`develop` にも保護 Ruleset を設定する**
   - Require a pull request before merging + Block force pushes / Restrict deletions
   - **Allowed merge methods は Squash と Merge commit の両方を許可**（`feature/* → develop` は Squash、`main → develop` のバックマージは Merge commit を使うため）
   - 基本チェック（lint / test）の必須化
   - ※ 知見ファイル等の自動直 push（例: ACE Playbook の自動コミット）を併用する場合は、`develop` への直 push 禁止と衝突するため、知見専用ブランチからの PR 経由（例: `chore/ace-from-pr-*`）へ切り替えるか、バイパス対象を明示設計します。

### 層 2: `main` へのソースブランチを限定する

GitHub の Ruleset 単体では「`develop` からの PR のみ許可」を指定できないため、運用方針（GitHub Actions の有無）に合わせて次を選びます。

#### A. GitHub Actions を使う構成（自動強制・public リポジトリ等）

以下のワークフローをまず `main` ブランチへ取り込み、ジョブ `check-source-branch` を **`main` Ruleset の Required status checks に登録**します。

```yaml
# .github/workflows/enforce-main-source.yml
name: Enforce Main Source Branch

on:
  pull_request_target:
    branches: [main]
    types: [opened, synchronize, reopened, edited]

permissions: {}

jobs:
  check-source-branch:
    runs-on: ubuntu-latest
    steps:
      # pull_request_target を使い checkout を行わないことで、PR 側が
      # ワークフロー定義自体を書き換えてバイパスする経路と任意コード実行を防ぐ
      - name: Allow only same-repo develop or hotfix/* into main
        env:
          HEAD_REPO: ${{ github.event.pull_request.head.repo.full_name }}
          BASE_REPO: ${{ github.repository }}
          HEAD_REF: ${{ github.head_ref }}
        run: |
          if [[ -z "$HEAD_REPO" || "$HEAD_REPO" != "$BASE_REPO" ]]; then
            echo "::error::fork リポジトリからの PR は main へ直接マージできません（head: ${HEAD_REPO:-unknown}）"
            exit 1
          fi
          if [[ "$HEAD_REF" != "develop" && "$HEAD_REF" != hotfix/* ]]; then
            echo "::error::main への PR は develop または hotfix/* からのみ許可されています（現在: ${HEAD_REF}）"
            exit 1
          fi
```

- [AI駆動 Git Workflow](./AI_GIT_WORKFLOW.md#ブランチ戦略git-flow準拠) の `release/*` ブランチを併用するプロジェクトでは、許可条件に `&& "$HEAD_REF" != release/*` も追加してください。
- ジョブの `if:` で条件を絞ると失敗時にスキップ扱いとなり Required status check が完了しないため、必ずステップ内で `exit 1` を返します。

#### B. GitHub Actions を使わない構成（private リポジトリ等のローカル品質ゲート運用）

Actions の分数課金を避ける `private` リポジトリ運用（[NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md §0](./NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md#scope-public-private)。なお `public` リポジトリでは Actions を併用する方針です）では Actions による自動ブロックを行わないため、以下を組み合わせて代替します。

- Default branch を `develop` に固定する
- `main` の Ruleset で **Direct push 禁止 + 人間による承認必須 + Allowed merge methods: Merge commit のみ** を有効にする
- **承認時の必須確認（人のゲート）**: 承認者はマージ承認前に (1) 同一リポジトリからの PR であること、(2) ソースブランチが `develop`（または許可された `hotfix/*` / `release/*`）であること、(3) マージ方式が Merge commit であることを目視で確認する（確認を省くと `feature/* → main` の PR も承認で通過します）
- **切替時の注意**: A 案から B 案へ移行する場合や Actions を停止する場合は、`main` Ruleset の Required status checks から `check-source-branch` 等の Actions 由来チェックを外します（残したままだと未報告待ちでマージできなくなります）
- 下の「層 3（デプロイ境界の固定）」と「層 4（AI ルール）」を必ず併用する

### 層 3: 本番デプロイ権限を `main` に一本化する

`main` を経由せずに本番反映できる抜け道を塞ぎます。

- **GitHub Environments (`production`)**（GitHub Actions でデプロイする場合）:
  - `Deployment branches and tags` を **Selected branches and tags** に設定し、原則 **`main` ブランチのみ** に制限する。
  - `v*` タグをトリガーに本番デプロイする場合は、Tag Ruleset でタグの作成・更新権限を絞るだけでは他ブランチ上のコミットへのタグ付けを止められないため、`environment: production` を持つデプロイジョブの前段（シークレットを持たない検証ジョブ）で `git merge-base --is-ancestor "$GITHUB_SHA" origin/main` 等により **タグの指すコミットが `main` の履歴に含まれることを検証**してから本番権限を付与する。
  - 本番用シークレット / OIDC 認証情報は `production` Environment にのみ紐づけ、必要に応じ `Required reviewers` でデプロイ前承認を挟む。
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

検証済みコミットとタグ対象が後続コミットでずれないよう、PR head SHA とマージ commit SHA を固定して実行します。

```bash
# 1. develop の最新化とローカル品質ゲート・Staging 確認
git checkout develop && git pull origin develop
# （ここでプロジェクトのテスト / ビルド / Staging 動作確認を完了させる）

# 2. develop → main のリリース PR を作成
gh pr create --base main --head develop \
  --title "release: vX.Y.Z" \
  --body "Staging 確認済みの変更を本番反映します。"

# 3. 検証済みの PR head SHA を取得し、CI・承認を確認して Merge commit でマージ
#    （※ --squash や --delete-branch は使わない）
HEAD_SHA="$(gh pr view <PR番号> --json headRefOid --jq .headRefOid)"
gh pr merge <PR番号> --merge --match-head-commit "$HEAD_SHA"

# 4. 当該 PR のマージ commit SHA を取得し、main 上のその SHA に対してタグ・GitHub Release を作成
MERGE_SHA="$(gh pr view <PR番号> --json mergeCommit --jq .mergeCommit.oid)"
gh release create vX.Y.Z --target "$MERGE_SHA" --generate-notes
```

---

## 5. 導入チェックリスト

- [ ] Default branch が `develop` になっている
- [ ] `main` の Ruleset で Direct push / Force push / 削除が禁止され、Allowed merge methods が Merge commit のみ（Linear history 無効）・Bypass list 確認済みになっている
- [ ] `develop` の Ruleset で Allowed merge methods に Squash と Merge commit（バックマージ用）の両方が許可されている
- [ ] （A 案: Actions 利用時）`enforce-main-source.yml` が `main` の Required status check（`check-source-branch`）に登録されている／（B 案: Actions 非利用時）承認時の出所・マージ方式確認が運用化されている
- [ ] `develop → main` および `main → develop` バックマージのマージ方式が Merge commit に統一されている
- [ ] 本番デプロイ先（Environment の `main` 限定 / ホスティング設定）が `main` のみに限定されている
- [ ] `AGENTS.md` / `CLAUDE.md` に `develop` ベース運用と `main` 保護の方針を明記した

---

## 関連ドキュメント

- [AI駆動 Git Workflow](./AI_GIT_WORKFLOW.md) - AI 仕様駆動開発の全体ワークフロー
- [NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md](./NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md) - GitHub Actions 非依存運用の設計
- [github-setup.md](../docs-template/05-operations/deployment/github-setup.md) - ラベル・Release Drafter の初期設定テンプレート
