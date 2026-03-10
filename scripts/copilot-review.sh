#!/bin/bash
# GitHub Copilot CLI Automated Review Script
# Runs specialized reviewers in parallel using copilot -p
#
# Env:
#   SKIP_COPILOT_REVIEW=1            Skip review
#   COPILOT_MODEL=claude-sonnet-4.5  Override model (default: claude-sonnet-4.5)
#   REVIEW_BASE_BRANCH=main          Override base branch for --branch mode (default: develop)
#   REVIEW_TIMEOUT_SEC=600           Max seconds per reviewer (default: 600)

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

if [ "$SKIP_COPILOT_REVIEW" = "1" ]; then
    echo -e "${YELLOW}Skipping Copilot review (SKIP_COPILOT_REVIEW=1)${NC}"
    exit 0
fi

if ! command -v copilot &> /dev/null; then
    echo -e "${YELLOW}Warning: copilot CLI not found, skipping review${NC}"
    echo -e "${YELLOW}Install: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-copilot-cli${NC}"
    exit 0
fi

# Configuration
COPILOT_MODEL="${COPILOT_MODEL:-claude-sonnet-4.5}"
REVIEW_TIMEOUT_SEC="${REVIEW_TIMEOUT_SEC:-600}"

# Define CLI invocation (called by run_all_reviewers)
invoke_cli() {
    local prompt=$1
    local output=$2

    if command -v timeout &>/dev/null; then
        timeout "$REVIEW_TIMEOUT_SEC" copilot -p "$prompt" --model "$COPILOT_MODEL" \
            < "$DIFF_FILE" > "$output" 2>&1
    else
        echo -e "${YELLOW}Warning: 'timeout' command not found. No timeout protection.${NC}" >&2
        copilot -p "$prompt" --model "$COPILOT_MODEL" \
            < "$DIFF_FILE" > "$output" 2>&1
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

run_all_reviewers "Copilot Code Review (model: ${COPILOT_MODEL})"
exit $?
