#!/bin/bash
# AI仕様駆動Git Workflow - GitHub CLI自動化ヘルパースクリプト
#
# このスクリプトは、AI開発ツール（Claude Code等）と組み合わせて使用することで、
# Issue → Branch → Commit → PR → Review → Merge のワークフローを効率化します。

set -e

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ヘルプ表示
function show_help() {
  cat << EOF
AI仕様駆動Git Workflow - 自動化ヘルパースクリプト

使用方法:
  ./ai-workflow.sh <command> [options]

コマンド:
  start-feature <title> <description>  新しい機能開発を開始（Issue作成 → ブランチ作成）
  start-hotfix <title> <description>   緊急修正を開始（mainから分岐）
  create-pr                            PRを作成（AI生成の本文テンプレート使用）
  review-comments <pr-number>          PRのレビューコメントを表示（AI読み取り用）
  merge-pr <pr-number>                 PRをマージしてクリーンアップ
  next-task                            次の優先タスクを表示
  status                               現在の作業状況を表示

例:
  ./ai-workflow.sh start-feature "ユーザー認証" "JWTベースの認証を実装"
  ./ai-workflow.sh create-pr
  ./ai-workflow.sh review-comments 123
  ./ai-workflow.sh merge-pr 123
  ./ai-workflow.sh next-task

EOF
}

# エラーメッセージ
function error() {
  echo -e "${RED}Error: $1${NC}" >&2
  exit 1
}

# 成功メッセージ
function success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# 情報メッセージ
function info() {
  echo -e "${BLUE}→ $1${NC}"
}

# 警告メッセージ
function warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# GitHub CLIがインストールされているか確認
function check_gh_cli() {
  if ! command -v gh &> /dev/null; then
    error "GitHub CLI (gh) がインストールされていません。https://cli.github.com/ からインストールしてください。"
  fi
}

# 認証確認
function check_gh_auth() {
  if ! gh auth status &> /dev/null; then
    error "GitHub CLI の認証が必要です。'gh auth login' を実行してください。"
  fi
}

# 現在のブランチを取得
function get_current_branch() {
  git branch --show-current
}

# developブランチの存在確認
function check_develop_branch() {
  if ! git show-ref --verify --quiet refs/heads/develop; then
    warning "developブランチが存在しません。mainブランチを使用します。"
    echo "main"
  else
    echo "develop"
  fi
}

# 機能開発を開始
function start_feature() {
  local title="$1"
  local description="$2"

  if [ -z "$title" ]; then
    error "タイトルを指定してください。"
  fi

  check_gh_cli
  check_gh_auth

  local base_branch=$(check_develop_branch)

  info "Issue を作成中..."
  local issue_url=$(gh issue create \
    --title "feat: $title" \
    --body "## 概要
$description

## 受入基準
- [ ] 機能が正常動作する
- [ ] テストが追加されている
- [ ] ドキュメントが更新されている
- [ ] テストカバレッジ80%以上

## 参照ドキュメント
- docs/MASTER.md
- docs/PATTERNS.md
- docs/TESTING.md" \
    --label "feature" \
    --assignee "@me")

  local issue_number=$(echo "$issue_url" | grep -oE '[0-9]+$')
  success "Issue #$issue_number を作成しました: $issue_url"

  info "ブランチを作成中..."
  git checkout "$base_branch"
  git pull origin "$base_branch"

  local branch_name="feature/${issue_number}-$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed -e 's/[^a-z0-9]/-/g' -e 's/-\{1,\}/-/g' -e 's/-\|$//g')"
  git checkout -b "$branch_name"

  success "ブランチ '$branch_name' を作成しました"
  info "Issue #$issue_number の作業を開始できます"

  echo ""
  echo -e "${BLUE}次のステップ:${NC}"
  echo "1. AI開発ツールで実装を進める"
  echo "2. git add . && git commit でコミット"
  echo "3. ./ai-workflow.sh create-pr でPR作成"
}

# 緊急修正を開始
function start_hotfix() {
  local title="$1"
  local description="$2"

  if [ -z "$title" ]; then
    error "タイトルを指定してください。"
  fi

  check_gh_cli
  check_gh_auth

  info "Hotfix Issue を作成中..."
  local issue_url=$(gh issue create \
    --title "hotfix: $title" \
    --body "## 緊急修正内容
$description

## 影響範囲
- [ ] 本番環境への影響を確認済み
- [ ] ロールバック手順を準備済み

## 参照ドキュメント
- docs/DEPLOYMENT.md (セクション1.4)" \
    --label "hotfix,urgent" \
    --assignee "@me")

  local issue_number=$(echo "$issue_url" | grep -oE '[0-9]+$')
  success "Hotfix Issue #$issue_number を作成しました: $issue_url"

  info "mainブランチから緊急修正ブランチを作成中..."
  git checkout main
  git pull origin main

  local branch_name="hotfix/${issue_number}-$(echo "$title" | sed 's/ /-/g' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]//g')"
  git checkout -b "$branch_name"

  success "ブランチ '$branch_name' を作成しました"
  warning "これは緊急修正です。最小限の変更で対応してください。"
}

# PR作成
function create_pr() {
  check_gh_cli
  check_gh_auth

  local current_branch=$(get_current_branch)

  if [ "$current_branch" = "main" ] || [ "$current_branch" = "develop" ]; then
    error "main/developブランチからはPRを作成できません。feature/*またはhotfix/*ブランチに移動してください。"
  fi

  # ブランチ名からIssue番号を抽出
  local issue_number=$(echo "$current_branch" | grep -oE '^[^/]+/([0-9]+)' | grep -oE '[0-9]+')

  # ベースブランチを決定
  local base_branch="develop"
  if [[ "$current_branch" == hotfix/* ]]; then
    base_branch="main"
  fi

  info "変更をpush中..."
  git push -u origin "$current_branch"

  info "PR作成中（ベースブランチ: $base_branch）..."

  local pr_body="## 概要
この変更の概要をここに記載してください。

## 変更内容
- 主要な変更点1
- 主要な変更点2

## テスト結果
- 単体テスト: ✓ 全てパス
- カバレッジ: XX%
- E2Eテスト: ✓ 全てパス

## チェックリスト
- [ ] MASTER.mdのコード生成ルールに準拠
- [ ] マジックナンバー禁止ルールを遵守
- [ ] 型安全性を確保
- [ ] エラーハンドリングを実装
- [ ] テストカバレッジ80%以上達成
- [ ] ドキュメントを更新

## 関連Issue"

  if [ -n "$issue_number" ]; then
    pr_body="${pr_body}
Closes #${issue_number}"
  fi

  pr_body="${pr_body}

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

  local pr_url=$(gh pr create \
    --base "$base_branch" \
    --fill \
    --body "$pr_body")

  success "PR を作成しました: $pr_url"

  echo ""
  echo -e "${BLUE}次のステップ:${NC}"
  echo "1. PRの本文を編集して詳細を追加"
  echo "2. レビュワーを指定"
  echo "3. レビュー指摘があれば ./ai-workflow.sh review-comments <PR番号> で確認"
}

# レビューコメント表示
function review_comments() {
  local pr_number="$1"

  if [ -z "$pr_number" ]; then
    error "PR番号を指定してください。"
  fi

  check_gh_cli
  check_gh_auth

  info "PR #$pr_number のレビューコメントを取得中..."

  echo ""
  echo ""
  echo -e "${BLUE}========== PRとレビューコメント ==========${NC}"
  gh pr view "$pr_number" --comments

  echo ""
  info "AIツールに上記のコメントを読み込ませて、修正提案を受けてください。"
}

# PRマージとクリーンアップ
function merge_pr() {
  local pr_number="$1"

  if [ -z "$pr_number" ]; then
    error "PR番号を指定してください。"
  fi

  check_gh_cli
  check_gh_auth

  info "PR #$pr_number をマージ中..."

  gh pr merge "$pr_number" \
    --squash \
    --delete-branch \
    --body "All checks passed. Merging."

  success "PR #$pr_number をマージしました"

  local base_branch=$(gh pr view "$pr_number" --json baseRefName -q .baseRefName)

  info "${base_branch}ブランチに戻ります..."
  git checkout "$base_branch"
  git pull origin "$base_branch"

  success "クリーンアップ完了"

  echo ""
  echo -e "${GREEN}✅ タスク完了${NC}"
  echo ""
  echo -e "${BLUE}次のステップ:${NC}"
  echo "1. ./ai-workflow.sh next-task で次のタスクを確認"
  echo "2. ロードマップを更新（docs/07-project-management/TASKS.md）"
}

# 次のタスク表示
function next_task() {
  check_gh_cli
  check_gh_auth

  info "次の優先タスクを取得中..."

  echo ""
  echo -e "${BLUE}========== 優先度順タスク（上位5件）==========${NC}"
  gh issue list \
    --label "ready" \
    --limit 5 \
    --json number,title,labels,updatedAt \
    --template '{{range .}}#{{.number}} {{.title}}
  Labels: {{range .labels}}{{.name}} {{end}}
  Updated: {{.updatedAt}}
{{end}}'

  echo ""
  echo -e "${BLUE}========== 全てのオープンIssue ==========${NC}"
  gh issue list --limit 10

  echo ""
  info "次のタスクを開始するには: ./ai-workflow.sh start-feature \"タイトル\" \"説明\""
}

# 作業状況表示
function show_status() {
  check_gh_cli

  local current_branch=$(get_current_branch)

  echo -e "${BLUE}========== Git 状態 ==========${NC}"
  echo "現在のブランチ: $current_branch"
  git status --short

  echo ""
  echo -e "${BLUE}========== 自分が担当中のIssue ==========${NC}"
  gh issue list --assignee "@me" --limit 5

  echo ""
  echo -e "${BLUE}========== 自分が作成したPR ==========${NC}"
  gh pr list --author "@me" --limit 5
}

# メイン処理
case "${1:-}" in
  start-feature)
    start_feature "$2" "$3"
    ;;
  start-hotfix)
    start_hotfix "$2" "$3"
    ;;
  create-pr)
    create_pr
    ;;
  review-comments)
    review_comments "$2"
    ;;
  merge-pr)
    merge_pr "$2"
    ;;
  next-task)
    next_task
    ;;
  status)
    show_status
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    show_help
    exit 1
    ;;
esac
