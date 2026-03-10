#!/usr/bin/env bash
# ============================================================================
# Multi-CLI Review Agent セットアップスクリプト
# ============================================================================
#
# 概要:
#   Multi-CLI Review Orchestrator の依存ツールを確認・インストールし、
#   動作確認まで行うセットアップスクリプト。
#
# 対応環境:
#   - macOS (Homebrew)
#   - Linux (apt / yum / pacman)
#
# 使い方:
#   bash scripts/setup-multi-review.sh [オプション]
#
# オプション:
#   --skip-install    依存ツールの自動インストールをスキップ
#   --help            ヘルプを表示
#
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Options
SKIP_INSTALL=false
TOTAL_STEPS=5

# ============================================================================
# Functions
# ============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}${BOLD}"
    echo "============================================================"
    echo "  Multi-CLI Review Agent セットアップ"
    echo "============================================================"
    echo -e "${NC}"
}

print_step() {
    local step=$1
    local message=$2
    echo ""
    echo -e "${BLUE}[${step}/${TOTAL_STEPS}] ${message}${NC}"
}

print_success() {
    echo -e "${GREEN}  ✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}  ⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}  ✗ $1${NC}"
}

print_info() {
    echo -e "  $1"
}

show_help() {
    cat << 'EOF'
使い方: bash scripts/setup-multi-review.sh [オプション]

Multi-CLI Review Orchestrator の依存ツールを確認・インストールし、
動作確認まで行います。

オプション:
  --skip-install    依存ツールの自動インストールをスキップ（確認のみ）
  --help            このヘルプを表示

前提条件:
  - Git リポジトリ内で実行すること
  - macOS: Homebrew がインストールされていること
  - Linux: apt / yum / pacman のいずれかが使えること

セットアップされるもの:
  - yq (YAMLパーサー) — review-config.yaml の読み込みに必要
  - AI CLI の検出と動作確認
  - multi-review.sh の動作確認 (--dry-run)

対応するAI CLI:
  - Claude Code (claude)      — Premium tier
  - Codex CLI (codex)         — Standard tier
  - Copilot CLI (copilot)     — Flat-rate tier
  - Gemini CLI (gemini)       — Free tier
  - Cursor Agent (cursor-agent) — Flat-rate tier

詳細: docs-template/05-operations/deployment/multi-cli-review-orchestration.md
EOF
}

# ── Step 1: Prerequisites ──

check_prerequisites() {
    print_step 1 "前提条件を確認中..."

    # Git repository check
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Git リポジトリ内で実行してください"
        exit 1
    fi
    print_success "Git リポジトリ: OK"

    # multi-review.sh exists
    if [[ -f "$REPO_ROOT/scripts/multi-review.sh" ]]; then
        print_success "multi-review.sh: OK"
    else
        print_error "scripts/multi-review.sh が見つかりません"
        exit 1
    fi

    # review-config.yaml exists
    if [[ -f "$REPO_ROOT/scripts/review-config.yaml" ]]; then
        print_success "review-config.yaml: OK"
    else
        print_warning "scripts/review-config.yaml が見つかりません（デフォルト設定で動作）"
    fi

    # Execution permission
    if [[ -x "$REPO_ROOT/scripts/multi-review.sh" ]]; then
        print_success "実行権限: OK"
    else
        chmod +x "$REPO_ROOT/scripts/multi-review.sh"
        chmod +x "$REPO_ROOT/scripts/adapters/"*.sh 2>/dev/null || true
        print_success "実行権限: 付与しました"
    fi
}

# ── Step 2: Install Dependencies ──

detect_package_manager() {
    if command -v brew &>/dev/null; then
        echo "brew"
    elif command -v apt-get &>/dev/null; then
        echo "apt"
    elif command -v yum &>/dev/null; then
        echo "yum"
    elif command -v pacman &>/dev/null; then
        echo "pacman"
    else
        echo "unknown"
    fi
}

install_yq() {
    local pkg_mgr
    pkg_mgr="$(detect_package_manager)"

    case "$pkg_mgr" in
        brew)   brew install yq ;;
        apt)    sudo apt-get update && sudo apt-get install -y yq ;;
        yum)    sudo yum install -y yq ;;
        pacman) sudo pacman -S --noconfirm yq ;;
        *)
            print_error "パッケージマネージャーが見つかりません"
            print_info "手動でインストールしてください: https://github.com/mikefarah/yq#install"
            return 1
            ;;
    esac
}

check_and_install_dependencies() {
    print_step 2 "依存ツールを確認中..."

    # yq
    if command -v yq &>/dev/null; then
        print_success "yq: $(yq --version 2>/dev/null | head -1)"
    else
        if [[ "$SKIP_INSTALL" == "true" ]]; then
            print_warning "yq が未インストール（--skip-install のためスキップ）"
            print_info "インストール: brew install yq (macOS) / apt install yq (Linux)"
        else
            print_warning "yq が未インストール — インストールを開始します..."
            if install_yq; then
                print_success "yq: インストール完了 ($(yq --version 2>/dev/null | head -1))"
            else
                print_error "yq のインストールに失敗しました"
                print_info "手動でインストールしてください: brew install yq"
            fi
        fi
    fi

    # gh (GitHub CLI) — optional but recommended
    if command -v gh &>/dev/null; then
        print_success "gh (GitHub CLI): $(gh --version 2>/dev/null | head -1)"
    else
        print_warning "gh (GitHub CLI) が未インストール（オプション）"
        print_info "PR連携に必要: brew install gh (macOS) / apt install gh (Linux)"
    fi
}

# ── Step 3: Detect AI CLIs ──

detect_ai_clis() {
    print_step 3 "AI CLI を検出中..."

    local found=0
    local total=5

    # CLI definitions: name command tier
    local clis="claude-code:claude:Premium
codex-cli:codex:Standard
copilot-cli:copilot:Flat-rate
gemini-cli:gemini:Free-tier
cursor-cli:cursor-agent:Flat-rate"

    while IFS=: read -r name cmd tier; do
        if command -v "$cmd" &>/dev/null; then
            local path
            path="$(which "$cmd")"
            print_success "$name ($cmd) — $tier [$path]"
            found=$((found + 1))
        else
            print_warning "$name ($cmd) — 未インストール"
        fi
    done <<< "$clis"

    echo ""
    if [[ $found -eq 0 ]]; then
        print_error "AI CLI が1つもインストールされていません"
        echo ""
        print_info "以下のいずれかをインストールしてください:"
        print_info "  Claude Code:  npm install -g @anthropic-ai/claude-code"
        print_info "  Codex CLI:    npm install -g @openai/codex"
        print_info "  Copilot CLI:  gh extension install github/gh-copilot"
        print_info "  Gemini CLI:   npm install -g @google/gemini-cli"
        print_info "  Cursor Agent: https://docs.cursor.com/cli"
        exit 1
    else
        print_success "${found}/${total} の AI CLI が利用可能です"
        if [[ $found -lt $total ]]; then
            echo ""
            print_info "未インストールの CLI はフォールバック設定で他の CLI に再分配されます"
        fi
    fi
}

# ── Step 4: Show Install Guides ──

show_install_guides() {
    print_step 4 "未インストール CLI のインストールガイド..."

    local all_installed=true

    # Check each CLI and show install guide if missing
    if ! command -v claude &>/dev/null; then
        all_installed=false
        echo ""
        echo -e "  ${BOLD}Claude Code (Premium tier — 高度な分析に最適)${NC}"
        print_info "  npm install -g @anthropic-ai/claude-code"
        print_info "  https://claude.ai/code"
    fi

    if ! command -v codex &>/dev/null; then
        all_installed=false
        echo ""
        echo -e "  ${BOLD}Codex CLI (Standard tier — クロスモデルレビューに最適)${NC}"
        print_info "  npm install -g @openai/codex"
        print_info "  https://github.com/openai/codex"
    fi

    if ! command -v copilot &>/dev/null; then
        all_installed=false
        echo ""
        echo -e "  ${BOLD}Copilot CLI (Flat-rate — 月額固定で何度でも実行可能)${NC}"
        print_info "  gh extension install github/gh-copilot"
        print_info "  https://docs.github.com/en/copilot/github-copilot-in-the-cli"
    fi

    if ! command -v gemini &>/dev/null; then
        all_installed=false
        echo ""
        echo -e "  ${BOLD}Gemini CLI (Free tier — 無料枠でセキュリティスキャンに最適)${NC}"
        print_info "  npm install -g @google/gemini-cli"
        print_info "  https://github.com/google-gemini/gemini-cli"
    fi

    if ! command -v cursor-agent &>/dev/null; then
        all_installed=false
        echo ""
        echo -e "  ${BOLD}Cursor Agent (Flat-rate — エディタ連携でコード簡素化に最適)${NC}"
        print_info "  https://docs.cursor.com/cli"
    fi

    if [[ "$all_installed" == "true" ]]; then
        print_success "全5つの AI CLI がインストール済みです！"
    fi
}

# ── Step 5: Verification ──

run_verification() {
    print_step 5 "動作確認 (--dry-run)..."

    echo ""
    if bash "$REPO_ROOT/scripts/multi-review.sh" --dry-run 2>&1; then
        echo ""
        print_success "セットアップ完了！Multi-CLI Review Agent が使えます"
    else
        echo ""
        print_error "動作確認に失敗しました"
        print_info "エラーを確認し、依存ツールが正しくインストールされているか確認してください"
        exit 1
    fi
}

# ── Summary ──

print_summary() {
    echo ""
    echo -e "${CYAN}${BOLD}"
    echo "============================================================"
    echo "  セットアップ完了"
    echo "============================================================"
    echo -e "${NC}"
    echo "使い方:"
    echo ""
    echo "  # Claude Code から（スラッシュコマンド）"
    echo "  /multi-review"
    echo ""
    echo "  # ターミナルから直接"
    echo "  bash scripts/multi-review.sh --dry-run    # プラン確認"
    echo "  bash scripts/multi-review.sh              # 全CLI並列レビュー"
    echo "  bash scripts/multi-review.sh --strategy minimize_cost"
    echo ""
    echo "  # 設定カスタマイズ"
    echo "  vim scripts/review-config.yaml"
    echo ""
    echo "詳細: docs-template/05-operations/deployment/multi-cli-review-orchestration.md"
    echo ""
}

# ============================================================================
# Main
# ============================================================================

main() {
    # Parse arguments
    for arg in "$@"; do
        case "$arg" in
            --skip-install) SKIP_INSTALL=true ;;
            --help|-h)      show_help; exit 0 ;;
            *)
                echo "Unknown option: $arg" >&2
                echo "Run with --help for usage" >&2
                exit 1
                ;;
        esac
    done

    print_header
    check_prerequisites
    check_and_install_dependencies
    detect_ai_clis
    show_install_guides
    run_verification
    print_summary
}

main "$@"
