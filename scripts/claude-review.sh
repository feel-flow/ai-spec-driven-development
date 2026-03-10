#!/bin/bash
# Claude Code Automated Review Script
# Runs specialized reviewers in parallel using claude -p
#
# Env:
#   SKIP_CLAUDE_REVIEW=1     Skip review
#   CLAUDECODE=<set>         Auto-set by Claude Code; skips CLI review when present
#   CLAUDE_MODEL=<model>     Override model (default: auto)
#   REVIEW_BASE_BRANCH=main  Override base branch for --branch mode (default: develop)
#   REVIEW_TIMEOUT_SEC=600   Max seconds per reviewer (default: 600)

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
for f in "$SCRIPT_DIR/review-prompts.sh" "$SCRIPT_DIR/review-common.sh"; do
    if [ ! -f "$f" ]; then
        echo "ERROR: Required file not found: $f" >&2
        exit 1
    fi
done
source "$SCRIPT_DIR/review-prompts.sh"
source "$SCRIPT_DIR/review-common.sh"

if [ "$SKIP_CLAUDE_REVIEW" = "1" ]; then
    echo -e "${YELLOW}Skipping Claude review (SKIP_CLAUDE_REVIEW=1)${NC}"
    exit 0
fi

# Skip when running inside Claude Code session (use /pr-review-toolkit instead)
if [ -n "${CLAUDECODE:-}" ]; then
    echo -e "${YELLOW}Skipping CLI review (Claude Code session detected)${NC}"
    echo -e "${YELLOW}Use /pr-review-toolkit:review-pr for in-session review.${NC}"
    exit 0
fi

if ! command -v claude &> /dev/null; then
    echo -e "${YELLOW}Warning: claude CLI not found, skipping review${NC}"
    echo -e "${YELLOW}Install: https://docs.anthropic.com/en/docs/claude-code${NC}"
    exit 0
fi

# Configuration
CLAUDE_MODEL="${CLAUDE_MODEL:-}"
REVIEW_TIMEOUT_SEC="${REVIEW_TIMEOUT_SEC:-600}"

# Define CLI invocation (called by run_all_reviewers)
invoke_cli() {
    local prompt=$1
    local output=$2
    local cmd

    if [ -n "$CLAUDE_MODEL" ]; then
        cmd=(claude -p "$prompt" --model "$CLAUDE_MODEL" --allowedTools "Read,Grep,Glob")
    else
        cmd=(claude -p "$prompt" --allowedTools "Read,Grep,Glob")
    fi

    if command -v timeout &>/dev/null; then
        timeout "$REVIEW_TIMEOUT_SEC" "${cmd[@]}" < "$DIFF_FILE" > "$output" 2>&1
    else
        echo -e "${YELLOW}Warning: 'timeout' command not found. No timeout protection.${NC}" >&2
        "${cmd[@]}" < "$DIFF_FILE" > "$output" 2>&1
    fi
}

# Prepare diff (pass through any mode argument: --staged, --branch)
prepare_diff "$@"
rc=$?
if [ "$rc" -eq 1 ]; then
    exit 0  # Nothing to review
elif [ "$rc" -ne 0 ]; then
    exit 1  # Error
fi

run_all_reviewers "Claude Code Review"
exit $?
