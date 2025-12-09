#!/bin/bash
# GitHub Labels セットアップスクリプト
# AI Spec-Driven Development で推奨するラベル構成を自動セットアップ

set -e

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

# GitHub CLIチェック
check_gh_cli() {
  if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) がインストールされていません"
    echo "インストール方法: https://cli.github.com/"
    exit 1
  fi
}

# GitHub認証チェック
check_gh_auth() {
  if ! gh auth status &> /dev/null; then
    print_error "GitHub CLIの認証が必要です"
    echo "以下のコマンドで認証してください:"
    echo "  gh auth login"
    exit 1
  fi
}

# ラベル作成（既存の場合はスキップ）
create_label() {
  local name="$1"
  local description="$2"
  local color="$3"

  if [[ -v "EXISTING_LABELS_MAP[$name]" ]]; then
    print_warning "ラベル '${name}' は既に存在します（スキップ）"
  else
    gh label create "$name" --description "$description" --color "$color"
    print_success "ラベル '${name}' を作成しました"
  fi
}

echo ""
echo "========================================="
echo "  GitHub Labels セットアップ"
echo "========================================="
echo ""

check_gh_cli
check_gh_auth

# 既存ラベルを一度だけ取得（パフォーマンス最適化）
print_info "既存のラベルを取得中..."
declare -A EXISTING_LABELS_MAP
while IFS= read -r label; do
  EXISTING_LABELS_MAP["$label"]=1
done < <(gh label list --json name --jq '.[].name')
print_success "既存ラベル取得完了（${#EXISTING_LABELS_MAP[@]}個）"
echo ""

print_info "GitHubラベルを設定します..."
echo ""

# ラベル構成説明
cat << 'EOF'
このスクリプトは以下のラベルを作成します：

【GitHubデフォルトラベル】
  以下は既に存在するため、そのまま使用します：
  - bug              : バグ報告・修正
  - enhancement      : 新機能・改善
  - documentation    : ドキュメント更新
  - duplicate        : 重複Issue/PR
  - good first issue : 初心者向け
  - help wanted      : ヘルプ募集
  - invalid          : 無効
  - question         : 質問
  - wontfix          : 対応しない

【カスタムラベル（追加）】
  - major   : メジャーバージョン変更（破壊的変更）
  - minor   : マイナーバージョン変更（新機能追加）
  - patch   : パッチバージョン変更（バグ修正）
  - hotfix  : 緊急修正（本番環境の重大な不具合）
  - urgent  : 緊急対応が必要

EOF

read -p "続行しますか？ (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  print_info "キャンセルしました"
  exit 0
fi

echo ""
print_info "カスタムラベルを作成中..."
echo ""

# バージョニング用ラベル
create_label "major" "メジャーバージョン変更（破壊的変更）" "D93F0B"
create_label "minor" "マイナーバージョン変更（新機能追加）" "FBCA04"
create_label "patch" "パッチバージョン変更（バグ修正）" "5FBF4A"

# 緊急度ラベル
create_label "hotfix" "緊急修正（本番環境の重大な不具合）" "E11D21"
create_label "urgent" "緊急対応が必要" "FF6B00"

echo ""
print_success "セットアップ完了！"
echo ""

print_info "現在のラベル一覧:"
gh label list

echo ""
echo "========================================="
echo "  次のステップ"
echo "========================================="
echo ""
echo "1. Release Drafterの設定を確認:"
echo "   .github/release-drafter.yml"
echo ""
echo "2. ワークフロースクリプトの確認:"
echo "   scripts/ai-workflow.sh"
echo ""
echo "3. ドキュメントの確認:"
echo "   docs-template/05-operations/deployment/git-workflow.md"
echo ""
