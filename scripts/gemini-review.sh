#!/bin/bash
# Gemini CLI Automated Review Script
# Runs specialized reviewers in parallel using gemini -p
#
# Env:
#   SKIP_GEMINI_REVIEW=1             Skip review
#   REQUIRE_GEMINI_REVIEW=1          Hard fail if gemini CLI not found (default: soft skip)
#   GEMINI_MODEL                     Override model (default: Gemini CLI default)
#   REVIEW_BASE_BRANCH=main          Override base branch for --branch mode (default: develop)
#   REVIEW_TIMEOUT_SEC=600           Max seconds per reviewer (default: 600)
#
# Cost tier: Free-tier (generous free quota)

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

if [ "$SKIP_GEMINI_REVIEW" = "1" ] && [ "${REQUIRE_GEMINI_REVIEW:-0}" = "1" ]; then
    echo -e "${RED}ERROR: SKIP_GEMINI_REVIEW and REQUIRE_GEMINI_REVIEW cannot both be set${NC}" >&2
    exit 2
fi

if [ "$SKIP_GEMINI_REVIEW" = "1" ]; then
    echo -e "${YELLOW}Skipping Gemini review (SKIP_GEMINI_REVIEW=1)${NC}"
    exit 0
fi

if ! command -v gemini &> /dev/null; then
    if [ "${REQUIRE_GEMINI_REVIEW:-0}" = "1" ]; then
        echo -e "${RED}ERROR: REQUIRE_GEMINI_REVIEW=1 but gemini not found${NC}" >&2
        exit 2
    fi
    echo -e "${YELLOW}Warning: gemini CLI not found, skipping review${NC}"
    echo -e "${YELLOW}Install: npm install -g @google/gemini-cli${NC}"
    exit 0
fi


# Configuration
REVIEW_TIMEOUT_SEC="${REVIEW_TIMEOUT_SEC:-600}"

# Build model args array (only if GEMINI_MODEL is set)
GEMINI_MODEL_ARGS=()
if [ -n "${GEMINI_MODEL:-}" ]; then
    GEMINI_MODEL_ARGS=("--model" "$GEMINI_MODEL")
fi

# Resolve timeout command (GNU timeout or macOS gtimeout)
TIMEOUT_CMD=""
if command -v timeout &>/dev/null; then
    TIMEOUT_CMD="timeout"
elif command -v gtimeout &>/dev/null; then
    TIMEOUT_CMD="gtimeout"
fi


# Define CLI invocation (called by run_all_reviewers)
invoke_cli() {
    local prompt=$1
    local output=$2

    if [ -n "$TIMEOUT_CMD" ]; then
        "$TIMEOUT_CMD" "$REVIEW_TIMEOUT_SEC" gemini -p "$prompt" \
            --sandbox --output-format text "${GEMINI_MODEL_ARGS[@]}" \
            < "$DIFF_FILE" > "$output"
    else
        echo -e "${YELLOW}Warning: 'timeout' command not found. No timeout protection.${NC}" >&2
        gemini -p "$prompt" \
            --sandbox --output-format text "${GEMINI_MODEL_ARGS[@]}" \
            < "$DIFF_FILE" > "$output"
    fi
}

# Prepare diff (pass through any mode argument: --staged, --branch)
rc=0
prepare_diff "$@" || rc=$?
if [ "$rc" -eq 1 ]; then
    exit 0  # Nothing to review
elif [ "$rc" -ne 0 ]; then
    exit 1  # Error
fi

MODEL_DISPLAY="${GEMINI_MODEL:-default}"
run_all_reviewers "Gemini Code Review (model: ${MODEL_DISPLAY})"
exit $?
