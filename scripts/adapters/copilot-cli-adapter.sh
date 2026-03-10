#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────
# copilot-cli-adapter.sh — Multi-CLI Review: Copilot CLI Adapter
# ────────────────────────────────────────────────────────────
# Usage: ./copilot-cli-adapter.sh <perspective-file> <output-file> [options]
#
# Options:
#   --changed-files <files>   Comma-separated list of changed files
#   --base <branch>           Base branch for diff (default: develop)
#   --timeout <seconds>       Timeout in seconds (default: 300)
#
# Requires: copilot (VS Code GitHub Copilot CLI extension)
# Cost tier: Flat-rate ($10/month subscription)
# ────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/adapter-common.sh"

readonly CLI_NAME="Copilot CLI"
readonly CLI_COMMAND="copilot"

# ── Preflight ──

if ! cli_available "$CLI_COMMAND"; then
  echo "ERROR: ${CLI_NAME} (${CLI_COMMAND}) is not installed." >&2
  echo "Install: Enable GitHub Copilot CLI extension in VS Code" >&2
  exit 1
fi

# ── Parse Arguments ──

parse_adapter_args "$@"

# ── Build Prompt ──

prompt="$(build_prompt "$PERSPECTIVE_FILE" "$BASE_BRANCH" "$CHANGED_FILES")"

# ── Execute Review ──

echo "🔍 Running ${CLI_NAME} review..." >&2
echo "   Perspective: $(basename "$PERSPECTIVE_FILE" .md)" >&2
echo "   Timeout: ${TIMEOUT}s" >&2

# Copilot CLI: -p for prompt, --silent suppresses stats, --allow-all-tools enables tools
result=$(run_with_timeout "$TIMEOUT" \
  "$CLI_COMMAND" -p "$prompt" \
    --silent \
    --allow-all-tools \
  2>/dev/null) || {
    echo "ERROR: ${CLI_NAME} execution failed or timed out." >&2
    exit 1
  }

# ── Write Output ──

perspective_name="$(basename "$PERSPECTIVE_FILE" .md)"
write_output "$OUTPUT_FILE" "$CLI_NAME" "$perspective_name" "$result"
