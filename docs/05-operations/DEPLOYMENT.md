# DEPLOYMENT.md - デプロイメント・運用ガイド

## 1. AI仕様駆動Git Workflow

### 1.1 ブランチ戦略（Git Flow準拠）

本プロジェクトではGit Flowをベースとした、AI開発ツールに最適化されたワークフローを採用します。

```
main/master    ← 本番リリース用（常時デプロイ可能な状態）
  ↑
develop       ← 開発統合ブランチ（次期リリース候補）
  ↑
feature/*     ← 機能開発ブランチ（Issueベース）
hotfix/*      ← 緊急修正ブランチ（mainから分岐）
release/*     ← リリース準備ブランチ（developから分岐）
```

**ブランチ命名規則**:
- `feature/{issue-number}-{short-description}` 例: `feature/123-user-auth`
- `hotfix/{issue-number}-{short-description}` 例: `hotfix/456-security-patch`
- `release/{version}` 例: `release/1.2.0`

### 1.2 AI駆動開発フロー

**基本サイクル**: Issue → Branch → Commit → PR → Review → Merge → Cleanup → Next Task

#### ステップ1: Issue作成とブランチ作成

```bash
# GitHub CLIでIssueを作成し、そのURLを取得
ISSUE_URL=$(gh issue create \
  --title "feat: ユーザー認証機能を実装" \
  --body "## 概要
- JWTベースの認証実装
- ログイン/ログアウトエンドポイント

## 受入基準
- [ ] ログインAPIが正常動作
- [ ] トークン検証が機能
- [ ] テストカバレッジ80%以上" \
  --label "feature" \
  --assignee "@me")

# URLからIssue番号を抽出（複数人が同時にIssueを作成した場合の競合を回避）
ISSUE_NUM=$(echo "$ISSUE_URL" | grep -oE '[0-9]+$')

# ブランチ作成
git checkout develop
git pull origin develop
git checkout -b "feature/${ISSUE_NUM}-user-auth"
```

#### ステップ2: AI駆動開発とコミット

```bash
# AIツール（Claude Code等）で実装
# - MASTER.mdの仕様を参照
# - PATTERNS.mdのコーディング規約に従う
# - TESTING.mdのテスト戦略を適用

# AI生成のコミットメッセージ例
git add .
git commit -m "feat: ユーザー認証機能を実装

- JWTベースの認証ミドルウェアを追加
- ログイン/ログアウトエンドポイントを実装
- リフレッシュトークン機構を組み込み
- 認証関連の単体テストを追加（カバレッジ85%）

参照:
- docs/MASTER.md:29 (認証方式)
- docs/PATTERNS.md:145 (エラーハンドリング)

Closes #${ISSUE_NUM}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

#### ステップ3: Pull Request作成

```bash
# developブランチへのPR作成
git push -u origin "feature/${ISSUE_NUM}-user-auth"

gh pr create \
  --base develop \
  --title "feat: ユーザー認証機能を実装" \
  --body "$(cat <<'EOF'
## 概要
ユーザー認証機能をJWTベースで実装しました。

## 変更内容
- 認証ミドルウェアの追加 (src/middleware/auth.ts:1-85)
- ログイン/ログアウトAPI実装 (src/routes/auth.ts:12-156)
- リフレッシュトークン機構 (src/services/token.ts:45-120)
- 認証テスト追加 (tests/auth.test.ts:1-340)

## テスト結果
- 単体テスト: 42件 全てパス
- カバレッジ: 85.3%
- E2Eテスト: 12シナリオ 全て成功

## チェックリスト
- [x] MASTER.mdのコード生成ルールに準拠
- [x] マジックナンバー禁止ルールを遵守
- [x] 型安全性を確保
- [x] エラーハンドリングを実装
- [x] テストカバレッジ80%以上達成

## 関連Issue
Closes #${ISSUE_NUM}

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)" \
  --label "feature" \
  --reviewer "team-lead"
```

#### ステップ4: AI支援レビュー対応

```bash
# PR上の指摘コメントを取得（AIが自動読み取り）
gh pr view ${PR_NUMBER} --comments

# AIが指摘内容を分析し、以下を実行:
# 1. 修正が必要な箇所を特定
# 2. 修正案を提示
# 3. 自動修正可能な場合は実装
# 4. レビューコメントに返信

# レビュー指摘への返信例（AIが自動生成）
gh pr comment ${PR_NUMBER} --body "指摘ありがとうございます。

\`validateToken\` 関数のエラーハンドリングを改善しました:
- 期限切れトークンの明示的な区別を追加
- カスタムエラークラスで詳細情報を提供
- ログ出力を構造化

変更: src/services/token.ts:67-89

🤖 Claude Code"
```

#### ステップ4.1: AIレビュースレッドへの返信（重要）

**AIレビューツールからの指摘には、スレッド形式で返信し、再レビューをリクエストします。**

##### 方法1: GitHub GraphQL APIを使用（推奨）

```bash
# 1. 未解決のレビュースレッドを確認
gh api graphql -f query='
query {
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviewThreads(first: 20) {
        nodes {
          id
          isResolved
          comments(first: 3) {
            nodes {
              author { login }
              body
            }
          }
        }
      }
    }
  }
}' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)'

# 2. スレッドに返信（修正内容を説明）
cat > /tmp/reply.txt << 'EOF'
指摘ありがとうございます。

修正しました:

## 変更内容
- [具体的な修正内容]

変更: [ファイル名:行番号]

/gemini review

🤖 Claude Code
EOF

# 3. スレッドIDを指定して返信
THREAD_ID="PRRT_xxxxx"  # 上記のqueryで取得したid
BODY=$(cat /tmp/reply.txt)

gh api graphql -F body="$BODY" -f query='
mutation($body: String!) {
  addPullRequestReviewThreadReply(input: {
    pullRequestReviewThreadId: "'"$THREAD_ID"'"
    body: $body
  }) {
    comment { id }
  }
}'
```

**AIツール別の再レビューリクエストコマンド**:

| AIツール | コマンド | 説明 |
|---|---|---|
| **Gemini Code Assist** | `/gemini review` | 返信の最後に記載 |
| **GitHub Copilot** | `@githubcopilot review` | 返信の最後に記載 |
| **その他** | 手動でレビュー依頼 | PRコメントで依頼 |

##### 方法2: 自動化スクリプト使用（より簡単）

**コマンド形式**:
```bash
./scripts/ai-workflow.sh reply-review <PR番号> <スレッドID> <返信ファイル> [ai-tool]
```

**パラメータ**:
- `<PR番号>`: 数値のみ（例: `6`）
- `<スレッドID>`: `PRRT_` で始まるID（例: `PRRT_kwDOPT5Iqs5elVTu`）
- `<返信ファイル>`: 返信内容を記載したテキストファイルのパス
- `[ai-tool]`: オプション。`gemini`（デフォルト）または `copilot`

**ステップ1: スレッドIDを取得**

```bash
# 未解決スレッドの一覧を表示
./scripts/ai-workflow.sh list-unresolved 8

# 出力例:
# {
#   "id": "PRRT_kwDOPT5Iqs5elpv8",
#   "path": "scripts/ai-workflow.sh",
#   "line": 470,
#   "author": "gemini-code-assist",
#   "preview": "The GraphQL API call in the `reply_review` function lacks error handling..."
# }
```

**ステップ2: 返信内容ファイルを作成**

```bash
# 返信内容をファイルに記載
cat > /tmp/my-reply.txt << 'EOF'
指摘ありがとうございます。

## 修正内容
- GraphQL API呼び出しにエラーハンドリングを追加
- try-catchでネットワークエラーをキャッチ
- わかりやすいエラーメッセージを表示

## 変更箇所
- scripts/ai-workflow.sh:470-483

参照: scripts/ai-workflow.sh:470
EOF
```

**ステップ3: スレッドに返信**

```bash
# Gemini Code Assistの場合（デフォルト）
./scripts/ai-workflow.sh reply-review 8 "PRRT_kwDOPT5Iqs5elpv8" /tmp/my-reply.txt

# GitHub Copilotの場合
./scripts/ai-workflow.sh reply-review 8 "PRRT_kwDOPT5Iqs5elpv8" /tmp/my-reply.txt copilot
```

スクリプトが自動的に以下を実行します:
1. 返信内容ファイルを読み込み
2. AIツール別の再レビューコマンドを追加（`/gemini review` または `@githubcopilot review`）
3. `🤖 Claude Code` サフィックスを追加
4. GraphQL APIでスレッドに返信投稿
5. エラーハンドリング（API失敗時はエラーメッセージ表示）

##### レビュー対応の完全なサイクル

```bash
# 1. レビュー指摘を確認
gh pr view <PR番号> --comments

# 2. 未解決スレッドを取得
./scripts/ai-workflow.sh list-unresolved <PR番号>

# 3. 修正実装
# (AIツールで実装)

# 4. コミット＆Push
git add .
git commit -m "fix: [レビュー指摘対応]"
git push

# 5. スレッドに返信（修正完了を報告）
# 方法1: 手動でGraphQL API使用
# 方法2: 自動化スクリプト使用（推奨）

# 6. AIによる再レビューを待つ
# （スレッド返信に /gemini review または @githubcopilot review を含めているため自動実行）
```

##### 実践例（PR #6での対応）

```bash
# 1. 未解決スレッドを確認
gh api graphql -f query='...' | jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)'

# 結果: 5つの未解決スレッド発見

# 2. 各スレッドに返信
for thread_id in "PRRT_kwDOPT5Iqs5elVTu" "PRRT_kwDOPT5Iqs5elZVb" "PRRT_kwDOPT5Iqs5elZVk" "PRRT_kwDOPT5Iqs5elZVp"; do
  # 修正内容をファイルに記載
  cat > /tmp/reply_${thread_id}.txt << 'EOF'
指摘ありがとうございます。
[修正内容の詳細]
/gemini review
🤖 Claude Code
EOF

  # スレッドに返信
  BODY=$(cat /tmp/reply_${thread_id}.txt)
  gh api graphql -F body="$BODY" -f query='
  mutation($body: String!) {
    addPullRequestReviewThreadReply(input: {
      pullRequestReviewThreadId: "'"$thread_id"'"
      body: $body
    }) {
      comment { id }
    }
  }'
done

# 3. 全スレッドに返信完了
# → Geminiが自動的に再レビューを実行
# → 修正が承認されればスレッドが解決済みになる
```

##### 注意事項

- **必ずスレッド形式で返信**: 一般コメントではなく、該当スレッドに返信
- **再レビューコマンドを忘れずに**: `/gemini review` または `@githubcopilot review`
- **修正内容を明確に**: 何をどう修正したかを具体的に記載
- **ファイル名・行番号を含める**: レビュワーが確認しやすくする

#### ステップ5: マージとクリーンアップ

```bash
# レビュー承認後、マージ（Squash推奨）
gh pr merge ${PR_NUMBER} \
  --squash \
  --delete-branch \
  --body "All checks passed. Merging to develop."

# developブランチに戻る
git checkout develop
git pull origin develop

# ローカルブランチ削除
git branch -d "feature/${ISSUE_NUM}-user-auth"

# 完了報告（AIが自動生成）
echo "✅ Issue #${ISSUE_NUM} 完了
- PR #${PR_NUMBER} がdevelopにマージされました
- ブランチ削除完了
- 次のタスクを確認中..."
```

#### ステップ6: タスク更新と次タスク選定

```bash
# ロードマップ/タスク更新（AIが自動実行）
# - docs/07-project-management/TASKS.mdを更新
# - 完了タスクをチェック
# - 次の優先タスクを提案

# AIによる次タスク提案
gh issue list \
  --label "ready" \
  --sort "updated" \
  --limit 5 \
  --json number,title,labels

# 次のタスク開始
# → ステップ1に戻る
```

### 1.3 AI自動化のポイント

#### レビュー指摘の自動読み取り
AIツールは以下を自動的に実行:
- PR上の最新コメントをモニタリング
- 指摘内容の意図を解析
- 修正箇所と修正方針を提案
- 可能な場合は自動修正を実施
- 修正内容をレビュワーにコメント

#### コミットメッセージの品質保証
```
形式: <type>: <subject>

<body>

参照:
- <file>:<line> (<reason>)

Closes #<issue>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**type**: feat, fix, docs, style, refactor, test, chore, hotfix, release

#### ブランチ保護ルール
```yaml
# .github/branch-protection.yml
branches:
  main:
    required_reviews: 2
    require_codeowner_review: true
    dismiss_stale_reviews: true
    required_status_checks:
      - "test"
      - "lint"
      - "build"
    enforce_admins: true

  develop:
    required_reviews: 1
    required_status_checks:
      - "test"
      - "lint"
```

### 1.3.1 各AIツールでの自動化設定

#### Claude Code（推奨設定）

Claude Codeは標準でGitワークフローをサポートしています。以下の設定で自動化を強化できます。

**1. プロジェクトルートにCLAUDE.mdを配置**

```markdown
# CLAUDE.md

## Git Workflow自動化ルール

このプロジェクトでは「AI仕様駆動Git Workflow」を採用しています。

### 必須動作
1. **コミット時**: 必ず `docs/MASTER.md` の仕様に準拠し、コミットメッセージにドキュメント参照を含める
2. **PR作成時**: `scripts/ai-workflow.sh create-pr` を使用、または手動で構造化されたPR本文を生成
3. **レビュー対応時**: `gh pr view <PR番号> --comments` でコメントを読み取り、自動的に修正提案を行う
4. **マージ後**: 次のタスクを `docs/07-project-management/TASKS.md` から提案

### 参照ドキュメント
- Git Workflow詳細: docs/05-operations/DEPLOYMENT.md (セクション1)
- コーディング規約: docs/MASTER.md
- 自動化スクリプト: scripts/ai-workflow.sh
```

**2. Claude Code設定ファイル（.claude/settings.local.json）**

```json
{
  "hooks": {
    "pre_commit": {
      "enabled": true,
      "command": "echo 'コミット前チェック: MASTER.mdの規約に準拠していることを確認してください'"
    }
  },
  "git": {
    "auto_read_pr_comments": true,
    "commit_message_template": "feat|fix|docs|style|refactor|test|chore: <subject>\n\n<body>\n\n参照:\n- docs/MASTER.md:<line>\n\nCloses #<issue>\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>"
  }
}
```

**3. カスタムスラッシュコマンド（.claude/commands/）**

`.claude/commands/workflow.md`:
```markdown
---
description: AI仕様駆動Git Workflowのステータスと次のアクションを提案
---

現在のGitワークフローの状態を確認し、次に実行すべきアクションを提案してください。

1. 現在のブランチを確認
2. 未コミットの変更があれば表示
3. 関連するIssue/PRを確認
4. 次のステップを提案（コミット/PR作成/レビュー対応/マージ）

参照: docs/05-operations/DEPLOYMENT.md (セクション1)
```

使用方法: `/workflow` と入力するだけでワークフロー状態を確認

#### GitHub Copilot（VS Code/JetBrains）

GitHub Copilotは直接的なGitワークフロー自動化機能は限定的ですが、以下の方法で補完できます。

**1. VS Code設定（.vscode/settings.json）**

```json
{
  "github.copilot.enable": {
    "*": true
  },
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "text": "このプロジェクトでは「AI仕様駆動Git Workflow」を採用しています。",
      "file": "docs/MASTER.md"
    },
    {
      "text": "コミットメッセージは必ずConventional Commits形式で、ドキュメント参照を含めること。",
      "file": "docs/05-operations/DEPLOYMENT.md"
    }
  ],
  "git.inputValidation": "always",
  "git.inputValidationLength": 72,
  "git.inputValidationSubjectLength": 50
}
```

**2. VS Code Tasksでスクリプト統合（.vscode/tasks.json）**

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "AI Workflow: Start Feature",
      "type": "shell",
      "command": "./scripts/ai-workflow.sh",
      "args": ["start-feature", "${input:featureTitle}", "${input:featureDescription}"],
      "problemMatcher": []
    },
    {
      "label": "AI Workflow: Create PR",
      "type": "shell",
      "command": "./scripts/ai-workflow.sh",
      "args": ["create-pr"],
      "problemMatcher": []
    },
    {
      "label": "AI Workflow: Next Task",
      "type": "shell",
      "command": "./scripts/ai-workflow.sh",
      "args": ["next-task"],
      "problemMatcher": []
    }
  ],
  "inputs": [
    {
      "id": "featureTitle",
      "type": "promptString",
      "description": "機能のタイトル"
    },
    {
      "id": "featureDescription",
      "type": "promptString",
      "description": "機能の説明"
    }
  ]
}
```

使用方法: `Cmd+Shift+P` → "Tasks: Run Task" → タスク選択

**3. GitHub Copilot Chat用カスタムインストラクション**

VS Codeの設定で以下を追加:

```
Settings → GitHub Copilot → Chat: Code Generation Instructions
```

追加内容:
```
プロジェクトルートのdocs/MASTER.mdとdocs/05-operations/DEPLOYMENT.mdを参照し、AI仕様駆動Git Workflowに従ってコード生成・コミットメッセージ作成を行うこと。特に：
- マジックナンバー禁止
- コミットメッセージにドキュメント参照を含める
- Issue番号を必ず参照
```

#### Cursor IDE

Cursorは `.cursorrules` ファイルでプロジェクト固有のルールを設定できます。

**1. .cursorrulesファイル作成**

```
# AI仕様駆動Git Workflow

## プロジェクト概要
このプロジェクトは「AI Spec Driven Development」のドキュメント戦略テンプレートです。

## Git Workflow
- すべての作業はIssueから開始
- ブランチ名: feature/{issue-number}-{description}
- コミットメッセージ形式: <type>: <subject>
  必ずドキュメント参照を含める（例: docs/MASTER.md:29）
- PR作成時はscripts/ai-workflow.sh create-prを使用

## 必須参照ドキュメント
1. docs/MASTER.md - コーディング規約とプロジェクト識別情報
2. docs/05-operations/DEPLOYMENT.md - Git Workflowの詳細
3. docs/PATTERNS.md - 実装パターン

## 禁止事項
- マジックナンバーの使用
- any型の使用（理由なき場合）
- ドキュメント参照のないコミット

## コミット時の自動チェック
コミットメッセージに以下が含まれているか確認:
- Conventional Commits形式（feat:, fix:など）
- ドキュメント参照（docs/XXX.md:行番号）
- Issue番号（Closes #XX）

## 自動化スクリプト
scripts/ai-workflow.shを活用してワークフローを効率化
- start-feature: 新規機能開発開始
- create-pr: PR作成
- review-comments: レビュー対応
- merge-pr: マージとクリーンアップ
- next-task: 次タスク提案
```

**2. Cursor設定（.cursor/settings.json）**

```json
{
  "cursor.ai.enableCodeActions": true,
  "cursor.ai.enableInlineCompletions": true,
  "cursor.chat.contextFiles": [
    "docs/MASTER.md",
    "docs/05-operations/DEPLOYMENT.md",
    "docs/PATTERNS.md",
    ".cursorrules"
  ],
  "cursor.git.commitMessageTemplate": "{{type}}: {{subject}}\n\n{{body}}\n\n参照:\n- docs/MASTER.md:{{line}}\n\nCloses #{{issue}}\n\n🤖 Generated with Cursor AI\n\nCo-Authored-By: AI Assistant"
}
```

#### 共通: Git Hooks設定（全AIツール対応）

**1. Huskyのインストールとセットアップ**

```bash
npm install --save-dev husky @commitlint/cli @commitlint/config-conventional

# Huskyの初期化
npx husky init
```

**2. コミットメッセージ検証（.husky/commit-msg）**

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Conventional Commits形式チェック
npx --no-install commitlint --edit "$1"

# ドキュメント参照チェック
if ! grep -iqE "参照:" "$1"; then
  echo "エラー: コミットメッセージにドキュメント参照が含まれていません"
  echo "例: 参照: docs/MASTER.md:29"
  exit 1
fi
```

**3. commitlint設定（commitlint.config.js）**

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'hotfix', 'release']
    ],
    'subject-case': [2, 'never', ['upper-case']],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0, 'always', Infinity]
  }
};
```

#### GitHub Actions統合（CI/CDでの自動化）

**注意: GitHub Actionsの利用制限**

GitHub Actionsは以下の無料枠があります：
- **パブリックリポジトリ**: 無制限（無料）
- **プライベートリポジトリ**:
  - Free/Pro: 2,000分/月まで無料
  - Team: 3,000分/月まで無料
  - Enterprise: 50,000分/月まで無料

無料枠を超えると課金されるため、プライベートリポジトリで使用する場合は以下の対策を推奨：
1. **必要最小限のワークフロー**のみ有効化
2. **手動トリガー**（workflow_dispatch）を活用
3. **Huskyなどローカルフック**を優先使用
4. 無料枠の範囲内で運用計画を立てる

詳細: https://docs.github.com/ja/billing/managing-billing-for-github-actions/about-billing-for-github-actions

**代替案（完全無料）**:
- Git Hooks（Husky）のみで運用
- ローカルスクリプト（scripts/ai-workflow.sh）による手動実行
- AIツール（Claude Code等）のビルトイン機能を活用

---

**1. ワークフロー定義（.github/workflows/ai-workflow.yml）**

※このセクションはオプションです。パブリックリポジトリ、または無料枠内で運用できる場合のみ使用してください。

```yaml
name: AI Workflow Assistant

on:
  pull_request:
    types: [opened, synchronize, reopened]
  issue_comment:
    types: [created]

jobs:
  # PR作成時に自動チェックリスト追加
  add-checklist:
    if: github.event_name == 'pull_request' && github.event.action == 'opened'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Add AI Workflow Checklist
        uses: actions/github-script@v6
        with:
          script: |
            const body = context.payload.pull_request.body || '';
            if (!body.includes('MASTER.mdのコード生成ルールに準拠')) {
              const checklist = `

              ## AI仕様駆動開発チェックリスト
              - [ ] MASTER.mdのコード生成ルールに準拠
              - [ ] マジックナンバー禁止ルールを遵守
              - [ ] 型安全性を確保
              - [ ] エラーハンドリングを実装
              - [ ] テストカバレッジ80%以上達成
              - [ ] ドキュメントを更新
              `;

              await github.rest.issues.update({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.payload.pull_request.number,
                body: body + checklist
              });
            }

  # コミットメッセージ検証（各コミットを個別に検証）
  validate-commits:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install commitlint
        run: |
          npm install --save-dev @commitlint/cli @commitlint/config-conventional

      - name: Validate each commit with commitlint
        uses: wagoid/commitlint-github-action@v5
        with:
          configFile: commitlint.config.js

      - name: Check for documentation references (custom rule)
        run: |
          # 各コミットメッセージを個別に検証
          git log --format=%H origin/${{ github.base_ref }}..HEAD | while read commit_hash; do
            commit_msg=$(git log -1 --format=%B "$commit_hash")
            commit_subject=$(git log -1 --format=%s "$commit_hash")

            # ドキュメント参照チェック（警告のみ）
            if ! echo "$commit_msg" | grep -qE "参照:|参照:"; then
              echo "⚠️  警告: コミット $commit_hash にドキュメント参照が含まれていません"
              echo "   件名: $commit_subject"
            fi
          done

  # レビューコメント通知（AIツールに通知）
  notify-review-comments:
    if: github.event_name == 'issue_comment' && github.event.issue.pull_request
    runs-on: ubuntu-latest
    steps:
      - name: Notify New Comment
        run: |
          echo "新しいレビューコメントが追加されました"
          echo "PR #${{ github.event.issue.number }}"
          echo "AIツールで 'gh pr view ${{ github.event.issue.number }} --comments' を実行して確認してください"
```

**2. 自動ラベリング（.github/workflows/auto-label.yml）**

```yaml
name: Auto Label

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/labeler@v4
        with:
          configuration-path: .github/labeler.yml
```

**3. ラベル設定（.github/labeler.yml）**

```yaml
feature:
  - 'feature/**'
  - 'feat/**'

hotfix:
  - 'hotfix/**'

release:
  - 'release/**'

documentation:
  - 'docs/**'
  - '**/*.md'

scripts:
  - 'scripts/**'
```

**補足: AI生成コードの識別**

`actions/labeler`はファイルパスベースのラベリングのみサポートしており、コミットメッセージに基づいたラベリングはできません。AI生成コードを識別したい場合は、以下の代替手段があります：

**方法1: PRタイトル/本文ベースのラベリング**

```yaml
# .github/workflows/ai-label.yml
name: AI Label

on:
  pull_request:
    types: [opened, edited]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v6
        with:
          script: |
            const prBody = context.payload.pull_request.body || '';
            const prTitle = context.payload.pull_request.title || '';

            // 🤖 絵文字またはClaude Code署名があればai-generatedラベルを追加
            if (prBody.includes('🤖') || prBody.includes('Claude Code') || prTitle.includes('🤖')) {
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.payload.pull_request.number,
                labels: ['ai-generated']
              });
            }
```

**方法2: 手動ラベリング**

AIツールを使用した場合は、PR作成時に明示的に`--label ai-generated`を指定：

```bash
gh pr create --base develop --title "..." --body "..." --label ai-generated
```

### 1.4 完全無料で実現する推奨構成

以下の構成であれば、**追加コストなし**でAI仕様駆動Git Workflowを実現できます：

#### 推奨構成（無料）

1. **AIツール**: Claude Code（無料版）またはCursor（無料版）
2. **自動化**:
   - `scripts/ai-workflow.sh` による手動スクリプト実行
   - Git Hooks（Husky）によるローカル検証
3. **GitHub機能**:
   - Issue/PR（無料）
   - GitHub CLI（無料）
   - ブランチ保護ルール（無料）

#### コスト比較

| 機能 | 無料プラン | 有料プラン | 推奨 |
|---|---|---|---|
| **Claude Code** | 基本機能利用可 | Pro: $20/月 | 無料版で十分 |
| **GitHub Copilot** | ❌ | $10/月（個人） | オプション |
| **Cursor** | 基本機能利用可 | Pro: $20/月 | 無料版で十分 |
| **GitHub Actions** | 2,000分/月（Private） | 超過分課金 | Huskyで代替 |
| **GitHub CLI** | ✅ 完全無料 | - | 必須 |
| **Git Hooks** | ✅ 完全無料 | - | 必須 |

#### 無料版での制限事項と対応策

| 制限 | 対応策 |
|---|---|
| GitHub Actions実行時間制限 | ローカルスクリプト（ai-workflow.sh）を使用 |
| AI応答回数制限（無料版） | 重要なタスクに絞って使用 |
| 高度な自動化機能 | 手動スクリプト実行で補完 |

#### 最小構成セットアップ手順（5分）

```bash
# 1. GitHub CLIインストール（Macの場合）
brew install gh
gh auth login

# 2. 自動化スクリプトに実行権限付与
chmod +x scripts/ai-workflow.sh

# 3. Git Hooks設定（オプション、推奨）
npm install --save-dev husky @commitlint/cli @commitlint/config-conventional
npx husky init

# 4. 動作確認
./scripts/ai-workflow.sh status
```

これだけで、AI仕様駆動Git Workflowが利用可能になります。

### 1.5 AIツール選択ガイド

| 特徴 | Claude Code | GitHub Copilot | Cursor |
|---|---|---|---|
| **Git統合度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **カスタム設定** | CLAUDE.md, .claude/ | .vscode/settings.json | .cursorrules |
| **PR自動化** | ネイティブサポート | VS Code Tasks必要 | 手動スクリプト実行 |
| **ドキュメント参照** | 自動読み込み | 手動指定 | contextFiles設定 |
| **無料版の充実度** | ⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ |
| **コスト** | 無料/Pro $20 | $10/月 | 無料/Pro $20 |
| **推奨ユースケース** | フルワークフロー自動化 | コード補完重視 | コード生成重視 |

**推奨構成（予算別）**:

- **完全無料**: Claude Code（無料版） + scripts/ai-workflow.sh + Husky
- **月$10予算**: Claude Code（無料版） + GitHub Copilot
- **月$20予算**: Claude Code Pro または Cursor Pro
- **月$30予算**: Claude Code Pro + GitHub Copilot

**最もコスパが良い構成**: Claude Code（無料版）+ 手動スクリプト
- 追加コスト: $0
- 機能性: ⭐⭐⭐⭐（十分実用的）

### 1.6 緊急対応フロー（Hotfix）

```bash
# 本番障害発生時の緊急対応

# 1. mainから緊急修正ブランチ作成
git checkout main
git pull origin main
git checkout -b "hotfix/999-critical-security-patch"

# 2. 修正実装（最小限の変更）
# AIツールで迅速に修正

# 3. 緊急PR作成
gh pr create \
  --base main \
  --title "hotfix: 緊急セキュリティパッチ" \
  --label "hotfix,urgent" \
  --reviewer "security-team"

# 4. 承認後、即座にマージ＆リリース
gh pr merge --squash
git tag -a "v1.2.1" -m "Hotfix: Security patch"
git push origin v1.2.1

# 5. developへもマージ
git checkout develop
git merge main
git push origin develop
```

### 1.7 定期リリースフロー

```bash
# リリース準備

# 1. developからリリースブランチ作成
git checkout develop
git pull origin develop
git checkout -b "release/1.3.0"

# 2. バージョン更新、最終調整
npm version 1.3.0
# CHANGELOGの更新、ドキュメント整備

# 3. リリースPR作成（develop → main）
gh pr create \
  --base main \
  --title "release: v1.3.0" \
  --label "release"

# 4. 承認後マージ＆タグ作成
gh pr merge --merge
git tag -a "v1.3.0" -m "Release v1.3.0"
git push origin v1.3.0

# 5. mainの変更をdevelopに反映
git checkout develop
git merge main
git push origin develop
```

## 2. デプロイメント戦略

### 環境構成
| 環境 | 用途 | URL | インフラ |
|---|---|---|---|
| Development | 開発環境 | https://dev.example.com | AWS ECS (1 instance) |
| Staging | ステージング環境 | https://staging.example.com | AWS ECS (2 instances) |
| Production | 本番環境 | https://app.example.com | AWS ECS (4+ instances) |

### デプロイメント方式
- **Blue-Green Deployment**: 本番環境
- **Rolling Update**: ステージング環境
- **Direct Deployment**: 開発環境

## 2. CI/CDパイプライン

### GitHub Actions設定
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches:
      - main
      - develop
  release:
    types: [published]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: dist/

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: dist/
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: app-staging
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster staging-cluster \
            --service app-service \
            --force-new-deployment

  deploy-production:
    needs: test
    if: github.event_name == 'release'
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          # Blue-Green deployment script
          ./scripts/deploy-production.sh ${{ github.event.release.tag_name }}
```

### Dockerfile
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production

# Build
COPY . .
RUN npm run build

# Runtime
FROM node:18-alpine

WORKDIR /app

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["node", "dist/index.js"]
```

## 3. インフラストラクチャ as Code

### Terraform設定
```hcl
# infrastructure/main.tf
terraform {
  required_version = ">= 1.0"
  
  backend "s3" {
    bucket = "terraform-state-bucket"
    key    = "production/terraform.tfstate"
    region = "ap-northeast-1"
  }
}

# VPC
module "vpc" {
  source = "./modules/vpc"
  
  cidr_block = "10.0.0.0/16"
  availability_zones = ["ap-northeast-1a", "ap-northeast-1c"]
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.environment}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "app-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.app_count
  launch_type     = "FARGATE"
  
  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }
  
  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = module.vpc.private_subnet_ids
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_alb_target_group.app.id
    container_name   = "app"
    container_port   = 3000
  }
}

# Auto Scaling
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

## 4. デプロイメントスクリプト

### Blue-Greenデプロイメント
```bash
#!/bin/bash
# scripts/deploy-production.sh

set -e

VERSION=$1
CLUSTER="production-cluster"
SERVICE="app-service"
TASK_DEFINITION="app-production"

echo "Starting Blue-Green deployment for version ${VERSION}"

# 1. 新しいタスク定義を登録
aws ecs register-task-definition \
  --family ${TASK_DEFINITION} \
  --cli-input-json file://task-definition.json

# 2. 新しいターゲットグループを作成
NEW_TARGET_GROUP=$(aws elbv2 create-target-group \
  --name "app-tg-${VERSION}" \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --health-check-path /health \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# 3. 新しいサービスをGreenとしてデプロイ
aws ecs create-service \
  --cluster ${CLUSTER} \
  --service-name "app-green-${VERSION}" \
  --task-definition ${TASK_DEFINITION} \
  --desired-count 4 \
  --target-group-arn ${NEW_TARGET_GROUP}

# 4. ヘルスチェック待機
echo "Waiting for health checks..."
sleep 60

# 5. トラフィックを切り替え
aws elbv2 modify-listener \
  --listener-arn arn:aws:elasticloadbalancing:xxx \
  --default-actions Type=forward,TargetGroupArn=${NEW_TARGET_GROUP}

# 6. 旧バージョンを削除
echo "Cleaning up old version..."
aws ecs update-service \
  --cluster ${CLUSTER} \
  --service app-blue \
  --desired-count 0

echo "Deployment completed successfully"
```

## 5. 環境設定管理

### 環境変数管理
```typescript
// config/index.ts
interface Config {
  app: {
    port: number;
    env: string;
    name: string;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  redis: {
    host: string;
    port: number;
  };
  aws: {
    region: string;
    s3Bucket: string;
  };
}

const config: Config = {
  app: {
    port: parseInt(process.env.PORT || '3000'),
    env: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'MyApp'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'myapp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  aws: {
    region: process.env.AWS_REGION || 'ap-northeast-1',
    s3Bucket: process.env.S3_BUCKET || ''
  }
};

// 環境別検証
function validateConfig(): void {
  if (config.app.env === 'production') {
    if (!config.database.password) {
      throw new Error('Database password is required in production');
    }
    if (!config.aws.s3Bucket) {
      throw new Error('S3 bucket is required in production');
    }
  }
}

export { config, validateConfig };
```

### Secrets管理
```yaml
# AWS Secrets Manager
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  database-password: <base64-encoded>
  jwt-secret: <base64-encoded>
  api-keys: <base64-encoded>
```

## 6. ロールバック戦略

### 自動ロールバック
```typescript
// rollback.ts
class RollbackManager {
  async checkDeploymentHealth(deploymentId: string): Promise<boolean> {
    const metrics = await this.getMetrics(deploymentId);
    
    // エラー率チェック
    if (metrics.errorRate > 0.05) { // 5%以上
      logger.error('High error rate detected', { errorRate: metrics.errorRate });
      return false;
    }
    
    // レスポンスタイムチェック
    if (metrics.p99ResponseTime > 1000) { // 1秒以上
      logger.error('High response time detected', { p99: metrics.p99ResponseTime });
      return false;
    }
    
    // メモリ使用率チェック
    if (metrics.memoryUsage > 0.9) { // 90%以上
      logger.error('High memory usage detected', { usage: metrics.memoryUsage });
      return false;
    }
    
    return true;
  }
  
  async performRollback(deploymentId: string): Promise<void> {
    logger.info('Starting rollback', { deploymentId });
    
    // 1. 前バージョンのタスク定義を取得
    const previousVersion = await this.getPreviousVersion();
    
    // 2. サービスを前バージョンに更新
    await this.ecs.updateService({
      cluster: 'production-cluster',
      service: 'app-service',
      taskDefinition: previousVersion
    });
    
    // 3. 通知
    await this.notificationService.send({
      channel: 'deployments',
      message: `Rollback initiated for deployment ${deploymentId}`
    });
  }
}
```

## 7. モニタリング設定

### CloudWatch Alarms
```typescript
// monitoring/alarms.ts
const alarms = [
  {
    name: 'HighCPUUtilization',
    metric: 'CPUUtilization',
    threshold: 80,
    evaluationPeriods: 2,
    action: 'scale-up'
  },
  {
    name: 'HighErrorRate',
    metric: 'HTTPCode_Target_5XX_Count',
    threshold: 10,
    evaluationPeriods: 1,
    action: 'alert'
  },
  {
    name: 'LowHealthyHosts',
    metric: 'HealthyHostCount',
    threshold: 1,
    comparisonOperator: 'LessThanThreshold',
    action: 'critical-alert'
  }
];
```

## 8. デプロイメントチェックリスト

### Pre-Deployment
- [ ] すべてのテストが成功している
- [ ] コードレビューが完了している
- [ ] セキュリティスキャンが完了している
- [ ] データベースマイグレーションの準備ができている
- [ ] ロールバック計画が準備されている
- [ ] 関係者への通知が完了している

### During Deployment
- [ ] デプロイメントログを監視
- [ ] エラー率を監視
- [ ] レスポンスタイムを監視
- [ ] リソース使用率を監視

### Post-Deployment
- [ ] スモークテストの実行
- [ ] 主要機能の動作確認
- [ ] パフォーマンスメトリクスの確認
- [ ] エラーログの確認
- [ ] ユーザーフィードバックの監視
- [ ] デプロイメント記録の更新

## 9. 災害復旧

### バックアップ戦略
```yaml
# backup-policy.yml
backup_policy:
  database:
    frequency: daily
    retention: 30_days
    point_in_time_recovery: enabled
    
  application_data:
    frequency: hourly
    retention: 7_days
    
  configurations:
    frequency: on_change
    retention: 90_days
```

### 復旧手順
```bash
#!/bin/bash
# disaster-recovery.sh

# 1. 最新のバックアップを特定
LATEST_BACKUP=$(aws rds describe-db-snapshots \
  --query 'DBSnapshots[0].DBSnapshotIdentifier' \
  --output text)

# 2. バックアップから復元
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "restored-db" \
  --db-snapshot-identifier ${LATEST_BACKUP}

# 3. アプリケーションを再デプロイ
./scripts/deploy-production.sh disaster-recovery

# 4. DNSを切り替え
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://dns-failover.json
```

## 10. 運用手順書

### 定期メンテナンス
| タスク | 頻度 | 手順 | 担当 |
|---|---|---|---|
| セキュリティパッチ | 月次 | patch-update.sh | DevOps |
| 証明書更新 | 3ヶ月 | cert-renewal.sh | DevOps |
| ログローテーション | 週次 | 自動 | - |
| バックアップ検証 | 月次 | backup-verify.sh | DevOps |

### トラブルシューティング
```bash
# 一般的な問題の対処

# 1. サービスが起動しない
aws ecs describe-tasks --cluster production --tasks <task-arn>
aws logs get-log-events --log-group-name /ecs/app

# 2. メモリリーク
aws ecs update-service --cluster production --service app --force-new-deployment

# 3. データベース接続エラー
aws rds describe-db-instances --db-instance-identifier production-db
telnet <db-host> 5432
```

---

## 11. 開発環境の最適化

### Claude Code SessionStart Hook設定

PRマージ後のブランチ切り替え忘れを防ぐため、Claude Codeのセッション開始時に自動的にブランチ状態をチェックし、必要に応じて警告を表示します。

#### 実装目的
- PRマージ後のブランチ切り替え忘れを防止
- 開発ブランチ（develop）での作業開始を保証
- Gitワークフローの品質向上

#### 設定手順

**1. ブランチチェックスクリプトの作成**

プロジェクトルートに `.claude/hooks/` ディレクトリを作成し、以下のスクリプトを配置します：

```bash
# .claude/hooks/check-branch-status.sh
#!/bin/bash

# =============================================================================
# Claude Code SessionStart Hook: ブランチ状態チェック
# =============================================================================
# 目的: PRマージ後のブランチ切り替え忘れを防ぐ
# 実行タイミング: Claude Codeセッション開始時（SessionStart）
#
# 動作:
# 1. リモートにブランチが存在しない場合 → PRマージ済みの可能性を警告
# 2. mainブランチより大幅に遅れている場合 → rebaseを推奨
# =============================================================================

# 設定: メインブランチ名（プロジェクトに合わせて変更してください）
MAIN_BRANCH="${MAIN_BRANCH:-develop}"

# 設定: 警告を出すコミット数の閾値
BEHIND_THRESHOLD="${BEHIND_THRESHOLD:-10}"

# 現在のブランチを取得
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# Gitリポジトリでない場合はスキップ
if [ $? -ne 0 ]; then
  exit 0
fi

# developブランチにいる場合はチェック不要
if [ "$CURRENT_BRANCH" = "$MAIN_BRANCH" ]; then
  exit 0
fi

# リモートの最新情報を取得（タイムアウト付き）
# ネットワーク遅延を考慮して短時間で完了させる
timeout 5s git fetch origin "$MAIN_BRANCH" 2>/dev/null || true

# =============================================================================
# チェック1: 現在のブランチがリモートに存在するか
# =============================================================================
if ! git ls-remote --heads origin "$CURRENT_BRANCH" 2>/dev/null | grep -q "$CURRENT_BRANCH"; then
  echo ""
  echo "⚠️  WARNING: 現在のブランチ '$CURRENT_BRANCH' はリモートに存在しません。"
  echo "   PRがマージ済みの可能性があります。"
  echo ""
  echo "   以下のコマンドで $MAIN_BRANCH ブランチに戻ることを推奨します："
  echo ""
  echo "   git checkout $MAIN_BRANCH"
  echo "   git pull origin $MAIN_BRANCH"
  echo "   git branch -d $CURRENT_BRANCH"
  echo ""
  exit 0
fi

# =============================================================================
# チェック2: 現在のブランチがmainブランチより大幅に遅れていないか
# =============================================================================
BEHIND=$(git rev-list --count HEAD..origin/$MAIN_BRANCH 2>/dev/null)

if [ ! -z "$BEHIND" ] && [ "$BEHIND" -gt "$BEHIND_THRESHOLD" ]; then
  echo ""
  echo "ℹ️  INFO: 現在のブランチは $MAIN_BRANCH から $BEHIND コミット遅れています。"
  echo "   最新の変更を取り込むことを検討してください："
  echo ""
  echo "   git checkout $MAIN_BRANCH"
  echo "   git pull origin $MAIN_BRANCH"
  echo "   git checkout $CURRENT_BRANCH"
  echo "   git rebase $MAIN_BRANCH"
  echo ""
fi

exit 0
```

**2. スクリプトに実行権限を付与**

```bash
chmod +x .claude/hooks/check-branch-status.sh
```

**3. Claude Code設定ファイルへの追加**

`.claude/settings.json` または `.claude/settings.local.json` に以下を追加：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": ".claude/hooks/check-branch-status.sh",
        "description": "Check git branch status and warn if needed"
      }
    ]
  }
}
```

**4. 環境変数でのカスタマイズ（オプション）**

メインブランチ名や警告の閾値は、環境変数で変更できます：

```bash
# シェル設定ファイル（~/.bashrc, ~/.zshrc など）に追加

# メインブランチ名を変更（デフォルト: develop）
export MAIN_BRANCH="main"

# 警告を出すコミット数の閾値を変更（デフォルト: 10）
export BEHIND_THRESHOLD="20"
```

設定を反映：
```bash
# シェルをリロード
source ~/.zshrc  # または source ~/.bashrc
```

#### 動作例

Claude Codeセッション開始時に以下のような警告が表示されます：

```
⚠️  WARNING: 現在のブランチ 'feature/#123-add-feature' はリモートに存在しません。
   PRがマージ済みの可能性があります。
   以下のコマンドで develop ブランチに戻ることを推奨します：

   git checkout develop
   git pull origin develop
   git branch -d feature/#123-add-feature
```

#### カスタマイズ例

**1. より詳細なチェック**

```bash
# マージ済みブランチをすべて表示
git branch --merged $MAIN_BRANCH | grep -v "^*" | grep -v "$MAIN_BRANCH"
```

**2. 自動切り替え（慎重に使用）**

```bash
# PRマージ後に自動的にdevelopに切り替え（オプション）
if ! git ls-remote --heads origin "$CURRENT_BRANCH" | grep -q "$CURRENT_BRANCH"; then
  echo "自動的に $MAIN_BRANCH ブランチに切り替えます..."
  git checkout "$MAIN_BRANCH"
  git pull origin "$MAIN_BRANCH"
  git branch -d "$CURRENT_BRANCH" 2>/dev/null || true
fi
```

**3. Slack/Teams通知（オプション）**

```bash
# Webhook URLを環境変数で設定
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
  curl -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"⚠️ Branch $CURRENT_BRANCH may be merged. Please check.\"}"
fi
```

#### 注意事項

- スクリプトはタイムアウト付きで実行されるため、ネットワーク遅延による影響を最小化
- `git fetch` は短時間で完了するよう設計（5秒タイムアウト）
- 自動切り替えオプションは慎重に使用（未コミットの変更が失われる可能性）
- チーム全体で統一したブランチ運用ルールを確立することを推奨

#### トラブルシューティング

**問題**: Hookが実行されない
```bash
# 実行権限を確認
ls -la .claude/hooks/check-branch-status.sh

# Claude Code設定を確認
cat .claude/settings.json | jq '.hooks'
```

**問題**: Git fetchが遅い
```bash
# タイムアウト時間を短縮
timeout 3s git fetch origin "$MAIN_BRANCH" 2>/dev/null || true
```

**問題**: 誤検知が多い
```bash
# チェック条件を調整（例: 20コミット以上遅れている場合のみ警告）
if [ "$BEHIND" -gt 20 ]; then
  echo "WARNING: ..."
fi
```