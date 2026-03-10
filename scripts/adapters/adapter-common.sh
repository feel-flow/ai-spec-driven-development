#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────
# adapter-common.sh — Multi-CLI Review: Shared Utilities
# ────────────────────────────────────────────────────────────
# Usage: source this file from any CLI adapter
#   source "$(dirname "$0")/adapter-common.sh"
# ────────────────────────────────────────────────────────────

set -euo pipefail

# ── Constants ──
readonly SEVERITY_CRITICAL="Critical"
readonly SEVERITY_WARNING="Warning"
readonly SEVERITY_SUGGESTION="Suggestion"
readonly SEVERITY_INFO="Info"

# ── CLI Detection ──

# Check if a CLI command is available
# Usage: cli_available "claude"
cli_available() {
  command -v "$1" &>/dev/null
}

# ── Git Helpers ──

# Get changed files (staged + unstaged) relative to a base branch
# Usage: get_changed_files "develop"
get_changed_files() {
  local base_branch="${1:-develop}"
  git diff --name-only "${base_branch}...HEAD" 2>/dev/null || \
    git diff --name-only HEAD 2>/dev/null || \
    echo ""
}

# Get the diff content for review
# Usage: get_diff_content "develop"
get_diff_content() {
  local base_branch="${1:-develop}"
  git diff "${base_branch}...HEAD" 2>/dev/null || \
    git diff HEAD 2>/dev/null || \
    echo ""
}

# ── Perspective Loading ──

# Read a perspective file and return its content
# Usage: load_perspective "scripts/perspectives/code-review.md"
load_perspective() {
  local perspective_file="$1"
  if [[ ! -f "$perspective_file" ]]; then
    echo "ERROR: Perspective file not found: $perspective_file" >&2
    return 1
  fi
  cat "$perspective_file"
}

# ── Prompt Builder ──

# Build a review prompt from perspective + diff
# Usage: build_prompt "scripts/perspectives/code-review.md" "develop" "file1.ts file2.ts"
build_prompt() {
  local perspective_file="$1"
  local base_branch="${2:-develop}"
  local changed_files="${3:-}"

  local perspective_content
  perspective_content="$(load_perspective "$perspective_file")"

  local diff_content
  diff_content="$(get_diff_content "$base_branch")"

  local files_section=""
  if [[ -n "$changed_files" ]]; then
    files_section="
## Changed Files
${changed_files}
"
  fi

  cat <<PROMPT
You are a code review agent. Follow the perspective instructions below to analyze the code changes.

${perspective_content}

${files_section}
## Code Changes (git diff)

${diff_content}

---

Analyze the above changes according to your role and output your findings in the specified Output Template format.
PROMPT
}

# ── Output Helpers ──

# Write review output with a standard header
# Usage: write_output "output.md" "Claude Code" "code-review" "review content..."
write_output() {
  local output_file="$1"
  local cli_name="$2"
  local perspective_name="$3"
  local content="$4"

  mkdir -p "$(dirname "$output_file")"

  cat > "$output_file" <<OUTPUT
<!-- Multi-CLI Review Result -->
<!-- CLI: ${cli_name} -->
<!-- Perspective: ${perspective_name} -->
<!-- Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ") -->

${content}
OUTPUT

  echo "✅ Review saved: ${output_file}" >&2
}

# ── Timeout Wrapper ──

# Run a command with timeout (supports macOS gtimeout)
# Usage: run_with_timeout 300 some_command arg1 arg2
run_with_timeout() {
  local timeout_seconds="$1"
  shift

  local timeout_cmd=""
  if command -v timeout &>/dev/null; then
    timeout_cmd="timeout"
  elif command -v gtimeout &>/dev/null; then
    timeout_cmd="gtimeout"
  fi

  if [[ -n "$timeout_cmd" ]]; then
    "$timeout_cmd" "$timeout_seconds" "$@"
  else
    # Fallback: background process + kill after timeout (bash 3.2 compatible)
    echo "⚠️  timeout/gtimeout not found. Using kill-based fallback." >&2
    "$@" &
    local bg_pid=$!
    (
      sleep "$timeout_seconds"
      kill "$bg_pid" 2>/dev/null
    ) &
    local watchdog_pid=$!
    if wait "$bg_pid" 2>/dev/null; then
      kill "$watchdog_pid" 2>/dev/null || true
      wait "$watchdog_pid" 2>/dev/null || true
      return 0
    else
      kill "$watchdog_pid" 2>/dev/null || true
      wait "$watchdog_pid" 2>/dev/null || true
      return 1
    fi
  fi
}

# ── Severity Parsing ──

# Count occurrences of each severity level in a review result file
# Usage: parse_severity_counts "result.md"
parse_severity_counts() {
  local result_file="$1"

  if [[ ! -f "$result_file" ]]; then
    echo "critical=0 warning=0 suggestion=0 info=0"
    return
  fi

  local critical warning suggestion info
  critical=$(grep -ci "critical" "$result_file" 2>/dev/null || echo "0")
  warning=$(grep -ci "warning" "$result_file" 2>/dev/null || echo "0")
  suggestion=$(grep -ci "suggestion" "$result_file" 2>/dev/null || echo "0")
  info=$(grep -ci "info" "$result_file" 2>/dev/null || echo "0")

  echo "critical=${critical} warning=${warning} suggestion=${suggestion} info=${info}"
}

# ── Argument Parsing Helper ──

# Parse common adapter arguments
# Sets: PERSPECTIVE_FILE, OUTPUT_FILE, CHANGED_FILES, BASE_BRANCH, TIMEOUT
# Usage: parse_adapter_args "$@"
parse_adapter_args() {
  PERSPECTIVE_FILE=""
  OUTPUT_FILE=""
  CHANGED_FILES=""
  BASE_BRANCH="develop"
  TIMEOUT="${REVIEW_TIMEOUT:-300}"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --changed-files)
        CHANGED_FILES="$2"
        shift 2
        ;;
      --base)
        BASE_BRANCH="$2"
        shift 2
        ;;
      --timeout)
        TIMEOUT="$2"
        shift 2
        ;;
      *)
        if [[ -z "$PERSPECTIVE_FILE" ]]; then
          PERSPECTIVE_FILE="$1"
        elif [[ -z "$OUTPUT_FILE" ]]; then
          OUTPUT_FILE="$1"
        fi
        shift
        ;;
    esac
  done

  if [[ -z "$PERSPECTIVE_FILE" || -z "$OUTPUT_FILE" ]]; then
    echo "Usage: $(basename "$0") <perspective-file> <output-file> [--changed-files <files>] [--base <branch>] [--timeout <seconds>]" >&2
    return 1
  fi
}
