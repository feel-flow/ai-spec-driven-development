#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────
# multi-review.sh — Multi-CLI Review Orchestrator
# ────────────────────────────────────────────────────────────
# Orchestrates 5 AI CLIs (Claude Code, Codex, Copilot, Gemini, Cursor)
# as code reviewers using tool-agnostic perspectives.
#
# Compatible with bash 3.2+ (macOS default).
#
# Usage:
#   bash scripts/multi-review.sh [options]
#
# Options:
#   --config <path>         Config file (default: scripts/review-config.yaml)
#   --mode <mode>           distributed | cross-model
#   --strategy <strategy>   balanced | minimize_cost | maximize_quality
#   --cli <name>            Run only this CLI (repeatable)
#   --perspective <name>    Run only this perspective (repeatable)
#   --parallel              Parallel execution (default)
#   --sequential            Sequential execution
#   --output-dir <dir>      Output directory (default: .review-results)
#   --base <branch>         Base branch for diff (default: develop)
#   --delegate-toolkit      Delegate pr-review-toolkit perspectives
#   --dry-run               Show plan without executing
#   --timeout <seconds>     Timeout per CLI (default: 300)
#   --help                  Show this help
#
# Entry Points:
#   Terminal:     bash scripts/multi-review.sh
#   Claude Code:  (via hook or command)
#   Copilot CLI:  copilot -p "bash scripts/multi-review.sh を実行して"
#   CI/CD:        See docs-template/05-operations/deployment/multi-cli-review-orchestration.md
#
# See: docs-template/05-operations/deployment/multi-cli-review-orchestration.md
# ────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── All known CLI names ──
ALL_CLIS="claude-code codex-cli copilot-cli gemini-cli cursor-cli"

# ── Lookup Functions (bash 3.2 compatible — no associative arrays) ──

get_cli_command() {
  case "$1" in
    claude-code) echo "claude" ;;
    codex-cli)   echo "codex" ;;
    copilot-cli) echo "copilot" ;;
    gemini-cli)  echo "gemini" ;;
    cursor-cli)  echo "cursor-agent" ;;
    *) echo "" ;;
  esac
}

get_cli_adapter() {
  case "$1" in
    claude-code) echo "${SCRIPT_DIR}/adapters/claude-code-adapter.sh" ;;
    codex-cli)   echo "${SCRIPT_DIR}/adapters/codex-cli-adapter.sh" ;;
    copilot-cli) echo "${SCRIPT_DIR}/adapters/copilot-cli-adapter.sh" ;;
    gemini-cli)  echo "${SCRIPT_DIR}/adapters/gemini-cli-adapter.sh" ;;
    cursor-cli)  echo "${SCRIPT_DIR}/adapters/cursor-cli-adapter.sh" ;;
    *) echo "" ;;
  esac
}

get_cli_perspectives() {
  case "$1" in
    claude-code) echo "type-design-analysis" ;;
    codex-cli)   echo "code-review error-handler-hunt" ;;
    copilot-cli) echo "test-analysis comment-analysis" ;;
    gemini-cli)  echo "security-analysis" ;;
    cursor-cli)  echo "code-simplification" ;;
    *) echo "" ;;
  esac
}

get_cli_fallback() {
  case "$1" in
    claude-code) echo "codex-cli" ;;
    codex-cli)   echo "copilot-cli" ;;
    copilot-cli) echo "codex-cli" ;;
    gemini-cli)  echo "copilot-cli" ;;
    cursor-cli)  echo "copilot-cli" ;;
    *) echo "" ;;
  esac
}

get_cli_cost_tier() {
  case "$1" in
    claude-code) echo "premium" ;;
    codex-cli)   echo "standard" ;;
    copilot-cli) echo "flat-rate" ;;
    gemini-cli)  echo "free-tier" ;;
    cursor-cli)  echo "flat-rate" ;;
    *) echo "unknown" ;;
  esac
}

# ── Defaults ──
CONFIG_FILE="${SCRIPT_DIR}/review-config.yaml"
MODE="distributed"
STRATEGY="balanced"
PARALLEL=true
OUTPUT_DIR="${REPO_ROOT}/.review-results"
BASE_BRANCH="develop"
DELEGATE_TOOLKIT=false
DRY_RUN=false
TIMEOUT="${REVIEW_TIMEOUT:-300}"

# Space-separated filter lists (bash 3.2 compatible)
CLI_FILTER=""
PERSPECTIVE_FILTER=""

# Detected available CLIs (space-separated)
AVAILABLE_CLIS=""

# Execution plan: CLI_NAME:PERSPECTIVE pairs (newline-separated)
EXECUTION_PLAN=""

# ── Utility ──

list_contains() {
  local list="$1" item="$2"
  for i in $list; do
    [[ "$i" == "$item" ]] && return 0
  done
  return 1
}

# ── Usage ──
show_help() {
  # macOS-compatible (BSD head lacks -n -1)
  sed -n '/^# Usage:/,/^# See:/{/^# See:/d; s/^# \{0,1\}//; p;}' "$0"
  exit 0
}

# ── Argument Parsing ──
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --config)      CONFIG_FILE="$2"; shift 2 ;;
      --mode)        MODE="$2"; shift 2 ;;
      --strategy)    STRATEGY="$2"; shift 2 ;;
      --cli)         CLI_FILTER="${CLI_FILTER:+$CLI_FILTER }$2"; shift 2 ;;
      --perspective) PERSPECTIVE_FILTER="${PERSPECTIVE_FILTER:+$PERSPECTIVE_FILTER }$2"; shift 2 ;;
      --parallel)    PARALLEL=true; shift ;;
      --sequential)  PARALLEL=false; shift ;;
      --output-dir)  OUTPUT_DIR="$2"; shift 2 ;;
      --base)        BASE_BRANCH="$2"; shift 2 ;;
      --delegate-toolkit) DELEGATE_TOOLKIT=true; shift ;;
      --dry-run)     DRY_RUN=true; shift ;;
      --timeout)     TIMEOUT="$2"; shift 2 ;;
      --help|-h)     show_help ;;
      *)
        echo "Unknown option: $1" >&2
        echo "Run with --help for usage" >&2
        exit 1
        ;;
    esac
  done
}

# ── Config Loading ──
load_config() {
  if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "⚠️  Config file not found: $CONFIG_FILE (using defaults)" >&2
    return 0
  fi

  if command -v yq &>/dev/null; then
    # Validate YAML syntax first
    if ! yq '.' "$CONFIG_FILE" >/dev/null 2>&1; then
      echo "⚠️  Config file could not be parsed by yq. Check YAML syntax or yq version (v4+ required)." >&2
      echo "   Using defaults." >&2
      return 0
    fi

    local cfg_val
    cfg_val=$(yq -r '.mode // empty' "$CONFIG_FILE" 2>/dev/null || true)
    [[ -n "$cfg_val" ]] && MODE="$cfg_val"

    cfg_val=$(yq -r '.parallel // empty' "$CONFIG_FILE" 2>/dev/null || true)
    [[ "$cfg_val" == "true" ]] && PARALLEL=true
    [[ "$cfg_val" == "false" ]] && PARALLEL=false

    cfg_val=$(yq -r '.cost_strategy // empty' "$CONFIG_FILE" 2>/dev/null || true)
    [[ -n "$cfg_val" ]] && STRATEGY="$cfg_val"

    cfg_val=$(yq -r '.timeout // empty' "$CONFIG_FILE" 2>/dev/null || true)
    [[ -n "$cfg_val" ]] && TIMEOUT="$cfg_val"

    cfg_val=$(yq -r '.output_dir // empty' "$CONFIG_FILE" 2>/dev/null || true)
    [[ -n "$cfg_val" ]] && OUTPUT_DIR="${REPO_ROOT}/${cfg_val}"
  else
    echo "ℹ️  yq not found — using defaults. Install yq for config file support." >&2
  fi
}

# ── CLI Detection ──
detect_available_clis() {
  AVAILABLE_CLIS=""
  local cli_name cmd

  for cli_name in $ALL_CLIS; do
    cmd="$(get_cli_command "$cli_name")"
    if command -v "$cmd" &>/dev/null; then
      AVAILABLE_CLIS="${AVAILABLE_CLIS:+$AVAILABLE_CLIS }$cli_name"
      echo "  ✅ ${cli_name} (${cmd})" >&2
    else
      echo "  ❌ ${cli_name} (${cmd}) — not installed" >&2
    fi
  done

  if [[ -z "$AVAILABLE_CLIS" ]]; then
    echo "" >&2
    echo "ERROR: No AI CLIs are installed. Install at least one:" >&2
    echo "  npm install -g @anthropic-ai/claude-code" >&2
    echo "  npm install -g @openai/codex" >&2
    echo "  npm install -g @google/gemini-cli" >&2
    exit 1
  fi
}

# ── Add to Execution Plan ──
# Format: "cli_name:perspective" per line
add_to_plan() {
  local cli_name="$1" perspective="$2"
  EXECUTION_PLAN="${EXECUTION_PLAN:+$EXECUTION_PLAN
}${cli_name}:${perspective}"
}

# ── Build Execution Plan (distributed mode) ──
build_distributed_plan() {
  EXECUTION_PLAN=""
  local cli_name perspectives fallback_target

  for cli_name in $ALL_CLIS; do
    perspectives="$(get_cli_perspectives "$cli_name")"

    # Apply CLI filter
    if [[ -n "$CLI_FILTER" ]] && ! list_contains "$CLI_FILTER" "$cli_name"; then
      continue
    fi

    if list_contains "$AVAILABLE_CLIS" "$cli_name"; then
      # CLI available — assign directly
      for p in $perspectives; do
        # Apply perspective filter
        if [[ -n "$PERSPECTIVE_FILTER" ]] && ! list_contains "$PERSPECTIVE_FILTER" "$p"; then
          continue
        fi
        add_to_plan "$cli_name" "$p"
      done
    else
      # CLI unavailable — redistribute to fallback
      fallback_target="$(get_cli_fallback "$cli_name")"
      if [[ -n "$fallback_target" ]] && list_contains "$AVAILABLE_CLIS" "$fallback_target"; then
        # Respect CLI filter for fallback target too
        if [[ -n "$CLI_FILTER" ]] && ! list_contains "$CLI_FILTER" "$fallback_target"; then
          echo "  ⚠️  ${cli_name}: fallback ${fallback_target} excluded by --cli filter. Skipping." >&2
          continue
        fi
        echo "  ↪ ${cli_name} → ${fallback_target} (fallback)" >&2
        for p in $perspectives; do
          if [[ -n "$PERSPECTIVE_FILTER" ]] && ! list_contains "$PERSPECTIVE_FILTER" "$p"; then
            continue
          fi
          add_to_plan "$fallback_target" "$p"
        done
      else
        echo "  ⚠️  ${cli_name}: No fallback available. Skipping: ${perspectives}" >&2
      fi
    fi
  done

  # Apply cost strategy: minimize_cost moves premium → flat-rate
  if [[ "$STRATEGY" == "minimize_cost" ]]; then
    local new_plan=""
    while IFS= read -r entry; do
      [[ -z "$entry" ]] && continue
      local cli="${entry%%:*}"
      local persp="${entry#*:}"
      if [[ "$cli" == "claude-code" ]] && list_contains "$AVAILABLE_CLIS" "copilot-cli"; then
        echo "  💰 minimize_cost: ${persp}: claude-code → copilot-cli" >&2
        new_plan="${new_plan:+$new_plan
}copilot-cli:${persp}"
      else
        new_plan="${new_plan:+$new_plan
}${entry}"
      fi
    done <<< "$EXECUTION_PLAN"
    EXECUTION_PLAN="$new_plan"
  fi
}

# ── Build Execution Plan (cross-model mode) ──
build_cross_model_plan() {
  EXECUTION_PLAN=""
  local perspective="${PERSPECTIVE_FILTER:-code-review}"
  # Take first perspective if multiple specified
  perspective="${perspective%% *}"

  echo "  🔄 Cross-model mode: all CLIs run '${perspective}'" >&2

  for cli_name in $AVAILABLE_CLIS; do
    if [[ -n "$CLI_FILTER" ]] && ! list_contains "$CLI_FILTER" "$cli_name"; then
      continue
    fi
    add_to_plan "$cli_name" "$perspective"
  done
}

# ── Show Execution Plan ──
show_plan() {
  echo "" >&2
  echo "📋 Execution Plan:" >&2
  echo "   Mode: ${MODE}" >&2
  echo "   Strategy: ${STRATEGY}" >&2
  echo "   Parallel: ${PARALLEL}" >&2
  echo "   Output: ${OUTPUT_DIR}" >&2
  echo "   Base branch: ${BASE_BRANCH}" >&2
  echo "" >&2

  if [[ -z "$EXECUTION_PLAN" ]]; then
    echo "   ⚠️  No CLIs/perspectives to execute." >&2
    return
  fi

  local current_cli=""
  while IFS= read -r entry; do
    [[ -z "$entry" ]] && continue
    local cli="${entry%%:*}"
    local persp="${entry#*:}"
    if [[ "$cli" != "$current_cli" ]]; then
      current_cli="$cli"
      local tier
      tier="$(get_cli_cost_tier "$cli")"
      echo "   ${cli} [${tier}]:" >&2
    fi
    echo "     - ${persp}" >&2
  done <<< "$EXECUTION_PLAN"
  echo "" >&2
}

# ── Execute Single Review ──
run_single_review() {
  local cli_name="$1"
  local perspective="$2"

  local adapter
  adapter="$(get_cli_adapter "$cli_name")"
  local perspective_file="${SCRIPT_DIR}/perspectives/${perspective}.md"
  local output_file="${OUTPUT_DIR}/${cli_name}/${perspective}.md"

  if [[ ! -f "$perspective_file" ]]; then
    echo "  ⚠️  Perspective file not found: ${perspective_file}" >&2
    return 1
  fi

  if [[ ! -f "$adapter" ]]; then
    echo "  ⚠️  Adapter not found: ${adapter}" >&2
    return 1
  fi

  bash "$adapter" "$perspective_file" "$output_file" \
    --base "$BASE_BRANCH" \
    --timeout "$TIMEOUT"
}

# ── Execute All Reviews ──
execute_reviews() {
  if [[ -z "$EXECUTION_PLAN" ]]; then
    echo "Nothing to execute." >&2
    return 0
  fi

  mkdir -p "$OUTPUT_DIR"

  local pids=""
  local tasks=""
  local failed=0
  local count=0

  while IFS= read -r entry; do
    [[ -z "$entry" ]] && continue
    local cli="${entry%%:*}"
    local persp="${entry#*:}"

    if [[ "$PARALLEL" == "true" ]]; then
      run_single_review "$cli" "$persp" &
      pids="${pids:+$pids }$!"
      tasks="${tasks:+$tasks|}${cli}/${persp}"
      count=$((count + 1))
    else
      echo "▶ ${cli} → ${persp}" >&2
      if ! run_single_review "$cli" "$persp"; then
        failed=$((failed + 1))
        echo "  ❌ Failed: ${cli}/${persp}" >&2
      fi
    fi
  done <<< "$EXECUTION_PLAN"

  # Wait for parallel tasks (set +e to prevent bash 3.2 from exiting on wait failure)
  if [[ "$PARALLEL" == "true" && -n "$pids" ]]; then
    echo "⏳ Waiting for ${count} parallel reviews..." >&2
    local idx=0
    local exit_code
    set +e
    for pid in $pids; do
      idx=$((idx + 1))
      local task_name
      task_name="$(echo "$tasks" | cut -d'|' -f"$idx")"
      wait "$pid"
      exit_code=$?
      if [[ $exit_code -eq 0 ]]; then
        echo "  ✅ Done: ${task_name}" >&2
      else
        failed=$((failed + 1))
        echo "  ❌ Failed: ${task_name} (exit code: ${exit_code})" >&2
      fi
    done
    set -e
  fi

  echo "" >&2
  if [[ $failed -gt 0 ]]; then
    echo "⚠️  ${failed} review(s) failed." >&2
    return 1
  else
    echo "✅ All reviews completed successfully." >&2
  fi
}

# ── Generate Integrated Report ──
generate_report() {
  local report_file="${OUTPUT_DIR}/integrated-report.md"

  echo "📝 Generating integrated report..." >&2

  cat > "$report_file" <<HEADER
# Multi-CLI Review — Integrated Report

**Generated:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Mode:** ${MODE}
**Strategy:** ${STRATEGY}
**Base Branch:** ${BASE_BRANCH}

---

HEADER

  local has_results=false

  for cli_name in $ALL_CLIS; do
    local cli_dir="${OUTPUT_DIR}/${cli_name}"
    [[ -d "$cli_dir" ]] || continue

    for result_file in "${cli_dir}"/*.md; do
      [[ -f "$result_file" ]] || continue
      has_results=true

      local perspective_name
      perspective_name="$(basename "$result_file" .md)"
      local tier
      tier="$(get_cli_cost_tier "$cli_name")"

      {
        echo ""
        echo "## ${cli_name} — ${perspective_name} [${tier}]"
        echo ""
        cat "$result_file"
        echo ""
        echo "---"
        echo ""
      } >> "$report_file"
    done
  done

  if [[ "$has_results" == "false" ]]; then
    echo "(No review results found.)" >> "$report_file"
  fi

  # Check for actual critical issues (not just template headings)
  # Match patterns like "- [file:line] ..." under Critical sections, or "CRITICAL:" prefix
  if grep -qE '^\s*-\s*\[.*:.*\]|^CRITICAL:|Critical:\s*[1-9]' "$report_file" 2>/dev/null; then
    echo "" >> "$report_file"
    echo "<!-- CRITICAL_BLOCK -->" >> "$report_file"
    echo "Critical issues detected. Review before proceeding." >> "$report_file"
  fi

  echo "📄 Report: ${report_file}" >&2
}

# ── Main ──
main() {
  echo "🚀 Multi-CLI Review Orchestrator" >&2
  echo "=================================" >&2
  echo "" >&2

  # Two-pass parsing: extract --config first, then load config, then full CLI args override
  local prev_was_config=false
  for arg in "$@"; do
    if [[ "$prev_was_config" == "true" ]]; then
      CONFIG_FILE="$arg"
      break
    fi
    if [[ "$arg" == "--config" ]]; then prev_was_config=true; else prev_was_config=false; fi
  done
  load_config
  parse_args "$@"

  echo "🔎 Detecting available CLIs..." >&2
  detect_available_clis

  echo "" >&2
  echo "📊 Building execution plan..." >&2

  if [[ "$MODE" == "cross-model" ]]; then
    build_cross_model_plan
  else
    build_distributed_plan
  fi

  show_plan

  # Validate TIMEOUT is a positive integer
  if ! echo "$TIMEOUT" | grep -qE '^[0-9]+$' || [[ "$TIMEOUT" -eq 0 ]]; then
    echo "ERROR: --timeout must be a positive integer, got: '${TIMEOUT}'" >&2
    exit 1
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "🏁 Dry run complete. No reviews executed." >&2
    exit 0
  fi

  local review_failed=false
  execute_reviews || review_failed=true
  generate_report

  echo "" >&2
  echo "🏁 Done! View results:" >&2
  echo "   cat ${OUTPUT_DIR}/integrated-report.md" >&2

  if [[ "$review_failed" == "true" ]]; then
    exit 1
  fi
}

main "$@"
