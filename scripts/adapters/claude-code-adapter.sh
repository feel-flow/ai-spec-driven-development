#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────
# claude-code-adapter.sh — Multi-CLI Review: Claude Code Adapter
# ────────────────────────────────────────────────────────────
# Usage: ./claude-code-adapter.sh <perspective-file> <output-file> [options]
#
# Options:
#   --changed-files <files>   Comma-separated list of changed files
#   --base <branch>           Base branch for diff (default: develop)
#   --timeout <seconds>       Timeout in seconds (default: 300)
#
# Requires: claude (npm i -g @anthropic-ai/claude-code)
# Cost tier: Premium (token-based billing)
# ────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/adapter-common.sh"

readonly CLI_NAME="Claude Code"
readonly CLI_COMMAND="claude"

# ── Preflight ──

if ! cli_available "$CLI_COMMAND"; then
  echo "ERROR: ${CLI_NAME} (${CLI_COMMAND}) is not installed." >&2
  echo "Install: npm install -g @anthropic-ai/claude-code" >&2
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

stderr_log="$(mktemp)"

result=$(run_with_timeout "$TIMEOUT" \
  "$CLI_COMMAND" -p "$prompt" \
    --allowed-tools "Read,Grep,Glob,Bash(git diff*)" \
  2>"$stderr_log") || {
    echo "ERROR: ${CLI_NAME} execution failed or timed out." >&2
    if [[ -s "$stderr_log" ]]; then
      echo "--- CLI stderr ---" >&2
      cat "$stderr_log" >&2
      echo "--- end stderr ---" >&2
    fi
    rm -f "$stderr_log"
    exit 1
  }
rm -f "$stderr_log"

if [[ -z "$result" ]]; then
  echo "ERROR: ${CLI_NAME} produced no output. The review may have failed silently." >&2
  exit 1
fi

# ── Write Output ──

perspective_name="$(basename "$PERSPECTIVE_FILE" .md)"
write_output "$OUTPUT_FILE" "$CLI_NAME" "$perspective_name" "$result"
