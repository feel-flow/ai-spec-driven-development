#!/bin/bash

# ============================================================================
# Claude Code + Husky 自動コードレビュー セットアップスクリプト
# ============================================================================
#
# 概要:
#   pre-commit hookでClaude Codeを使った自動コードレビューを設定します。
#   コミット前にAIがコードをレビューし、問題があればコミットをブロックします。
#
# 対応環境:
#   - macOS
#   - Linux
#   - Windows (Git Bash / WSL)
#
# 前提条件:
#   - Git リポジトリ内で実行
#   - Node.js >= 18.0.0 (npm使用時)
#   - Claude Code CLI インストール済み (https://claude.ai/code)
#
# 使い方:
#   bash setup-automated-review.sh [オプション]
#
# オプション:
#   --no-npm      npmを使用せず、手動でHuskyをセットアップする場合
#   --help        ヘルプを表示
#
# ============================================================================

set -e

# Colors (ANSI escape codes - 主要な端末で動作)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
NO_NPM=false

# ============================================================================
# Functions
# ============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}${BOLD}"
    echo "============================================================"
    echo "  Claude Code + Husky 自動コードレビュー セットアップ"
    echo "============================================================"
    echo -e "${NC}"
}

print_step() {
    local step=$1
    local total=$2
    local message=$3
    echo -e "${BLUE}[${step}/${total}] ${message}${NC}"
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

show_help() {
    cat << 'EOF'
使い方: bash setup-automated-review.sh [オプション]

Claude Code + Huskyを使った自動コードレビューをセットアップします。

オプション:
  --no-npm      npmを使用しない（手動セットアップ）
  --help        このヘルプを表示

前提条件:
  - Git リポジトリ内で実行すること
  - Claude Code CLI がインストールされていること
  - Node.js >= 18.0.0 (--no-npm を指定しない場合)

作成されるファイル:
  .husky/pre-commit           Git pre-commit hook
  scripts/claude-review.sh    レビュースクリプト
  .claude/commands/code-review.md    スラッシュコマンド定義

詳細: docs/05-operations/deployment/automated-code-review.md
EOF
}

check_prerequisites() {
    print_step 1 6 "前提条件を確認中..."

    # Check if in git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Git リポジトリ内で実行してください"
        exit 1
    fi
    print_success "Git リポジトリ: OK"

    # Check Node.js (if npm mode)
    if [ "$NO_NPM" = false ]; then
        if command -v node > /dev/null 2>&1; then
            local node_version
            node_version=$(node -v | sed 's/v//' | cut -d. -f1)
            if [ "$node_version" -ge 18 ]; then
                print_success "Node.js: $(node -v)"
            else
                print_warning "Node.js バージョンが古い (>= 18推奨): $(node -v)"
            fi
        else
            print_warning "Node.js が見つかりません（手動セットアップが必要）"
            NO_NPM=true
        fi

        if command -v npm > /dev/null 2>&1; then
            print_success "npm: $(npm -v)"
        else
            print_warning "npm が見つかりません"
            NO_NPM=true
        fi
    fi

    # Check Claude CLI
    if command -v claude > /dev/null 2>&1; then
        print_success "Claude Code CLI: インストール済み"
    else
        print_warning "Claude Code CLI が見つかりません"
        echo -e "    ${YELLOW}→ https://claude.ai/code からインストールしてください${NC}"
    fi
}

create_directories() {
    print_step 2 6 "ディレクトリを作成中..."

    local project_root
    project_root="$(git rev-parse --show-toplevel)"

    mkdir -p "$project_root/.husky"
    mkdir -p "$project_root/scripts"
    mkdir -p "$project_root/.claude/commands"

    print_success "ディレクトリ作成完了"
}

create_review_script() {
    print_step 3 6 "レビュースクリプトを作成中..."

    local project_root
    project_root="$(git rev-parse --show-toplevel)"

    cat > "$project_root/scripts/claude-review.sh" << 'REVIEW_SCRIPT'
#!/bin/bash

# ============================================================================
# Claude Code Pre-Commit Review Script
# ============================================================================
# コミット前にステージされた変更をClaude Codeでレビューします。
# Criticalな問題があればコミットをブロックします。
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
REVIEW_RESULT=$(mktemp)
DIFF_FILE=$(mktemp)

# Cleanup function
cleanup() {
    rm -f "$REVIEW_RESULT" "$DIFF_FILE" 2>/dev/null || true
}
trap cleanup EXIT

# Check if claude CLI is available
if ! command -v claude > /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Claude Code CLI not found. Skipping review.${NC}"
    echo -e "${YELLOW}Install from: https://claude.ai/code${NC}"
    exit 0
fi

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR)

if [ -z "$STAGED_FILES" ]; then
    echo -e "${YELLOW}No staged files found. Nothing to review.${NC}"
    exit 0
fi

# Print header
echo ""
echo -e "${CYAN}${BOLD}========================================"
echo -e "     Claude Code Pre-Commit Review"
echo -e "========================================${NC}"
echo ""

# List staged files
echo -e "${BLUE}Staged files:${NC}"
echo "$STAGED_FILES" | while IFS= read -r file; do
    echo "  - $file"
done
echo ""

# Get staged diff
git diff --cached > "$DIFF_FILE"
DIFF_LINES=$(wc -l < "$DIFF_FILE" | tr -d ' ')
echo -e "${BLUE}Diff size: ${DIFF_LINES} lines${NC}"

# Warn if diff is large
if [ "$DIFF_LINES" -gt 2000 ]; then
    echo -e "${YELLOW}Warning: Large diff detected.${NC}"
    echo -e "${YELLOW}Consider smaller, more focused commits.${NC}"
fi
echo ""

echo -e "${BLUE}Running Claude Code review...${NC}"
echo ""

# Run Claude review by piping the prompt directly
# This avoids shell variable length limits for large diffs
{
    cat << 'PROMPT_HEAD'
You are a code reviewer. Review the following git diff for a pre-commit check.

## Review Criteria

### Critical (Block Commit)
- Security vulnerabilities (SQL injection, XSS, hardcoded secrets/credentials)
- Syntax or type errors
- Logic bugs (null references, off-by-one errors, infinite loops)
- Resource leaks (unclosed connections, memory leaks)

### Important (Warn but Allow)
- Missing error handling
- Unused imports or variables
- Input validation gaps
- Breaking API changes

### Quality (Suggestions)
- Magic numbers (should use constants)
- Poor naming conventions
- Code duplication
- Missing documentation for complex logic

## Output Format

Provide your review in this format:

```markdown
## Review Summary
**Files reviewed**: [count]
**Total changes**: +[additions] / -[deletions]

## Critical Issues
[List each critical issue with file:line reference, or "None found"]

## Important Issues
[List each important issue, or "None found"]

## Suggestions
[List suggestions for improvement, or "Code looks good"]

## Verdict: APPROVED / REJECTED
**Reason**: [Brief explanation]
```

## Diff to Review

```diff
PROMPT_HEAD
    cat "$DIFF_FILE"
    cat << 'PROMPT_TAIL'
```

Provide your review now:
PROMPT_TAIL
} | claude --print > "$REVIEW_RESULT" 2>&1 || {
    echo -e "${RED}Error: Claude Code review failed${NC}"
    cat "$REVIEW_RESULT" 2>/dev/null || true
    exit 1
}

# Print review results
echo ""
echo -e "${CYAN}${BOLD}========================================"
echo -e "            Review Results"
echo -e "========================================${NC}"
echo ""
cat "$REVIEW_RESULT"
echo ""

# Check verdict
if grep -qi "REJECTED" "$REVIEW_RESULT"; then
    echo -e "${CYAN}${BOLD}========================================"
    echo -e "${RED}${BOLD}     COMMIT BLOCKED - Issues Found"
    echo -e "${CYAN}${BOLD}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Fix the issues listed above and try again.${NC}"
    echo -e "${YELLOW}To skip review: git commit --no-verify${NC}"
    echo ""
    exit 1
fi

echo -e "${CYAN}${BOLD}========================================"
echo -e "${GREEN}${BOLD}         COMMIT APPROVED"
echo -e "${CYAN}${BOLD}========================================${NC}"
echo ""
exit 0
REVIEW_SCRIPT

    chmod +x "$project_root/scripts/claude-review.sh"
    print_success "scripts/claude-review.sh 作成完了"
}

create_pre_commit_hook() {
    print_step 4 6 "pre-commit hookを作成中..."

    local project_root
    project_root="$(git rev-parse --show-toplevel)"

    cat > "$project_root/.husky/pre-commit" << 'PRE_COMMIT'
#!/bin/sh

# ============================================================================
# Husky Pre-Commit Hook
# Claude Code による自動コードレビューを実行
# ============================================================================

# Skip if environment variable is set
if [ "$SKIP_CLAUDE_REVIEW" = "1" ]; then
    echo "Skipping Claude Code review (SKIP_CLAUDE_REVIEW=1)"
    exit 0
fi

# Skip for merge commits
if [ -f ".git/MERGE_HEAD" ]; then
    echo "Merge commit detected - skipping Claude review"
    exit 0
fi

# Skip during rebase
if [ -d ".git/rebase-merge" ] || [ -d ".git/rebase-apply" ]; then
    echo "Rebase in progress - skipping Claude review"
    exit 0
fi

# Get project root
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

# Check if Claude CLI is available
if ! command -v claude >/dev/null 2>&1; then
    echo "Warning: Claude Code CLI not found. Skipping review."
    echo "Install from: https://claude.ai/code"
    exit 0
fi

# Run review script
if [ -f "$PROJECT_ROOT/scripts/claude-review.sh" ]; then
    "$PROJECT_ROOT/scripts/claude-review.sh"
    exit_code=$?

    if [ $exit_code -ne 0 ]; then
        echo ""
        echo "Commit blocked by Claude Code review."
        echo "Fix the issues above or use 'git commit --no-verify' to skip."
        exit 1
    fi
else
    echo "Warning: claude-review.sh not found at $PROJECT_ROOT/scripts/"
fi

exit 0
PRE_COMMIT

    chmod +x "$project_root/.husky/pre-commit"
    print_success ".husky/pre-commit 作成完了"
}

create_claude_command() {
    print_step 5 6 "Claude Code コマンドを作成中..."

    local project_root
    project_root="$(git rev-parse --show-toplevel)"

    cat > "$project_root/.claude/commands/code-review.md" << 'COMMAND'
# Code Review

Perform a comprehensive code review on staged or modified changes.

## Instructions

You are a code-reviewer agent. Follow these steps:

### Step 1: Get Changes

Check for staged changes first, then unstaged if none:
```bash
git diff --cached
```

If no staged changes:
```bash
git diff
```

### Step 2: Analyze Changes

Review the diff using these priorities:

**Critical (Block)**
- Security vulnerabilities (SQL injection, XSS, secrets)
- Syntax/type errors
- Logic bugs (null refs, infinite loops)
- Resource leaks

**Important (Warn)**
- Missing error handling
- Unused imports
- Input validation gaps
- Breaking API changes

**Quality (Suggest)**
- Magic numbers (use constants)
- Naming conventions
- Code duplication
- Missing documentation

### Step 3: Output Review

Format your review as:

```markdown
## Review Summary
**Files**: [count]
**Changes**: +[additions] / -[deletions]

## Critical Issues
[List with file:line references, or "None found"]

## Important Issues
[List with file:line references, or "None found"]

## Suggestions
[List improvements, or "Code looks good"]

## Verdict: APPROVED / REJECTED
**Reason**: [explanation]
```

### Step 4: Recommend Action

- If REJECTED: List specific fixes needed
- If APPROVED: Confirm ready to commit
COMMAND

    print_success ".claude/commands/code-review.md 作成完了"
}

setup_npm_scripts() {
    print_step 6 6 "npm設定を更新中..."

    local project_root
    project_root="$(git rev-parse --show-toplevel)"

    if [ "$NO_NPM" = true ]; then
        print_warning "npm セットアップをスキップ"
        echo ""
        echo -e "${YELLOW}手動で以下を実行してください:${NC}"
        echo ""
        echo "  1. package.json に scripts を追加:"
        echo '     "prepare": "husky"'
        echo '     "code-review": "scripts/claude-review.sh"'
        echo ""
        echo "  2. Husky をインストール:"
        echo "     npm install --save-dev husky"
        echo ""
        return
    fi

    # Check if package.json exists
    if [ ! -f "$project_root/package.json" ]; then
        echo '{"name": "project", "private": true}' > "$project_root/package.json"
    fi

    # Try to update package.json with jq if available
    if command -v jq > /dev/null 2>&1; then
        jq '.scripts = (.scripts // {}) + {
            "prepare": "husky",
            "code-review": "scripts/claude-review.sh"
        } | .devDependencies = (.devDependencies // {}) + {
            "husky": "^9.1.7"
        }' "$project_root/package.json" > "$project_root/package.json.tmp" \
            && mv "$project_root/package.json.tmp" "$project_root/package.json"
        print_success "package.json 更新完了"
    else
        print_warning "jq が見つかりません。package.json を手動で更新してください"
        echo ""
        echo -e "${YELLOW}  追加する scripts:${NC}"
        echo '    "prepare": "husky"'
        echo '    "code-review": "scripts/claude-review.sh"'
        echo ""
    fi

    # Install husky
    if command -v npm > /dev/null 2>&1; then
        echo ""
        echo -e "${BLUE}  Installing husky...${NC}"
        (cd "$project_root" && npm install --save-dev husky@^9.1.7) || {
            print_warning "npm install 失敗。手動で実行: npm install"
        }
    fi

    print_success "セットアップ完了"
}

print_summary() {
    local project_root
    project_root="$(git rev-parse --show-toplevel)"

    echo ""
    echo -e "${CYAN}${BOLD}"
    echo "============================================================"
    echo "                 セットアップ完了!"
    echo "============================================================"
    echo -e "${NC}"
    echo ""
    echo -e "${GREEN}作成されたファイル:${NC}"
    echo "  .husky/pre-commit"
    echo "  scripts/claude-review.sh"
    echo "  .claude/commands/code-review.md"
    echo ""
    echo -e "${GREEN}使い方:${NC}"
    echo "  git commit           # 自動レビュー実行"
    echo "  /code-review         # Claude Code 内で手動レビュー"
    echo "  npm run code-review  # npm で手動レビュー"
    echo ""
    echo -e "${YELLOW}スキップ方法:${NC}"
    echo "  git commit --no-verify"
    echo "  SKIP_CLAUDE_REVIEW=1 git commit"
    echo ""
}

# ============================================================================
# Main
# ============================================================================

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-npm)
            NO_NPM=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run setup
print_header
check_prerequisites
create_directories
create_review_script
create_pre_commit_hook
create_claude_command
setup_npm_scripts
print_summary
