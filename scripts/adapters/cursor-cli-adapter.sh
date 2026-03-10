#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────
# cursor-cli-adapter.sh — Multi-CLI Review: Cursor CLI Adapter
# ────────────────────────────────────────────────────────────
# Usage: ./cursor-cli-adapter.sh <perspective-file> <output-file> [options]
#
# Options:
#   --changed-files <files>   Comma-separated list of changed files
#   --base <branch>           Base branch for diff (default: develop)
#   --timeout <seconds>       Timeout in seconds (default: 120)
#
# Requires: cursor-agent (Cursor IDE CLI)
# Cost tier: Flat-rate ($20/month subscription)
#
# ⚠️  Known issue: cursor-agent --print may hang in non-interactive mode.
#     A shorter default timeout (120s) and forced timeout are applied.
#     On macOS, install gtimeout: brew install coreutils
# ────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/adapter-common.sh"

readonly CLI_NAME="Cursor CLI"
readonly CLI_COMMAND="cursor-agent"

# Shorter default timeout due to known hanging issue
readonly DEFAULT_CURSOR_TIMEOUT=120

# ── Preflight ──

if ! cli_available "$CLI_COMMAND"; then
  echo "ERROR: ${CLI_NAME} (${CLI_COMMAND}) is not installed." >&2
  echo "Install: Install Cursor IDE and enable CLI access" >&2
  exit 1
fi

# ── Parse Arguments ──

parse_adapter_args "$@"

# Apply shorter timeout for Cursor by default
if [[ "$TIMEOUT" -gt "$DEFAULT_CURSOR_TIMEOUT" ]]; then
  TIMEOUT="$DEFAULT_CURSOR_TIMEOUT"
  echo "⚠️  Cursor CLI timeout capped at ${TIMEOUT}s (known hanging issue)" >&2
fi

# ── Build Prompt ──

prompt="$(build_prompt "$PERSPECTIVE_FILE" "$BASE_BRANCH" "$CHANGED_FILES")"

# ── Execute Review ──

echo "🔍 Running ${CLI_NAME} review..." >&2
echo "   Perspective: $(basename "$PERSPECTIVE_FILE" .md)" >&2
echo "   Timeout: ${TIMEOUT}s (capped for Cursor)" >&2

# Cursor CLI: --print for non-interactive output, --model auto
stderr_log="$(mktemp)"

result=$(run_with_timeout "$TIMEOUT" \
  "$CLI_COMMAND" --print --model auto "$prompt" \
  2>"$stderr_log") || {
    echo "ERROR: ${CLI_NAME} execution failed or timed out (known issue)." >&2
    echo "Workaround: Use --cli copilot-cli to substitute." >&2
    if [[ -s "$stderr_log" ]]; then
      echo "--- CLI stderr ---" >&2; cat "$stderr_log" >&2; echo "--- end stderr ---" >&2
    fi
    rm -f "$stderr_log"; exit 1
  }
rm -f "$stderr_log"

if [[ -z "$result" ]]; then
  echo "ERROR: ${CLI_NAME} produced no output. The review may have failed silently." >&2
  exit 1
fi

# ── Write Output ──

perspective_name="$(basename "$PERSPECTIVE_FILE" .md)"
write_output "$OUTPUT_FILE" "$CLI_NAME" "$perspective_name" "$result"
