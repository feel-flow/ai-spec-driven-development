#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────
# codex-cli-adapter.sh — Multi-CLI Review: Codex CLI Adapter
# ────────────────────────────────────────────────────────────
# Usage: ./codex-cli-adapter.sh <perspective-file> <output-file> [options]
#
# Options:
#   --changed-files <files>   Comma-separated list of changed files
#   --base <branch>           Base branch for diff (default: develop)
#   --timeout <seconds>       Timeout in seconds (default: 300)
#
# Requires: codex (npm i -g @openai/codex)
# Cost tier: Standard (token-based billing)
# ────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/adapter-common.sh"

readonly CLI_NAME="Codex CLI"
readonly CLI_COMMAND="codex"

# ── Preflight ──

if ! cli_available "$CLI_COMMAND"; then
  echo "ERROR: ${CLI_NAME} (${CLI_COMMAND}) is not installed." >&2
  echo "Install: npm install -g @openai/codex" >&2
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

# Codex CLI uses `codex exec "prompt" --sandbox read-only`
result=$(run_with_timeout "$TIMEOUT" \
  "$CLI_COMMAND" exec "$prompt" \
    --sandbox read-only \
  2>/dev/null) || {
    echo "ERROR: ${CLI_NAME} execution failed or timed out." >&2
    exit 1
  }

# ── Write Output ──

perspective_name="$(basename "$PERSPECTIVE_FILE" .md)"
write_output "$OUTPUT_FILE" "$CLI_NAME" "$perspective_name" "$result"
