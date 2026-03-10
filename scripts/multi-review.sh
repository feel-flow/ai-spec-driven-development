#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────
# multi-review.sh — Multi-CLI Review Orchestrator
# ────────────────────────────────────────────────────────────
# Orchestrates 5 AI CLIs (Claude Code, Codex, Copilot, Gemini, Cursor)
# as code reviewers using tool-agnostic perspectives.
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

# Repeatable filter arrays
declare -a CLI_FILTER=()
declare -a PERSPECTIVE_FILTER=()

# ── CLI-to-Adapter Mapping ──
declare -A CLI_ADAPTERS=(
  [claude-code]="${SCRIPT_DIR}/adapters/claude-code-adapter.sh"
  [codex-cli]="${SCRIPT_DIR}/adapters/codex-cli-adapter.sh"
  [copilot-cli]="${SCRIPT_DIR}/adapters/copilot-cli-adapter.sh"
  [gemini-cli]="${SCRIPT_DIR}/adapters/gemini-cli-adapter.sh"
  [cursor-cli]="${SCRIPT_DIR}/adapters/cursor-cli-adapter.sh"
)

# ── CLI-to-Command Mapping ──
declare -A CLI_COMMANDS=(
  [claude-code]="claude"
  [codex-cli]="codex"
  [copilot-cli]="copilot"
  [gemini-cli]="gemini"
  [cursor-cli]="cursor-agent"
)

# ── Default Perspective Assignments ──
declare -A CLI_PERSPECTIVES=(
  [claude-code]="type-design-analysis"
  [codex-cli]="code-review error-handler-hunt"
  [copilot-cli]="test-analysis comment-analysis"
  [gemini-cli]="security-analysis"
  [cursor-cli]="code-simplification"
)

# ── Fallback Chain ──
declare -A FALLBACK=(
  [claude-code]="codex-cli"
  [codex-cli]="copilot-cli"
  [copilot-cli]="codex-cli"
  [gemini-cli]="copilot-cli"
  [cursor-cli]="copilot-cli"
)

# ── Cost Tiers ──
declare -A COST_TIERS=(
  [claude-code]="premium"
  [codex-cli]="standard"
  [copilot-cli]="flat-rate"
  [gemini-cli]="free-tier"
  [cursor-cli]="flat-rate"
)

# ── Usage ──
show_help() {
  sed -n '/^# Usage:/,/^# ──/p' "$0" | head -n -1 | sed 's/^# //' | sed 's/^#//'
  exit 0
}

# ── Argument Parsing ──
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --config)      CONFIG_FILE="$2"; shift 2 ;;
      --mode)        MODE="$2"; shift 2 ;;
      --strategy)    STRATEGY="$2"; shift 2 ;;
      --cli)         CLI_FILTER+=("$2"); shift 2 ;;
      --perspective) PERSPECTIVE_FILTER+=("$2"); shift 2 ;;
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

# ── Config Loading (lightweight YAML parser) ──
load_config() {
  if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "⚠️  Config file not found: $CONFIG_FILE (using defaults)" >&2
    return 0
  fi

  # Try yq first, fall back to grep/sed
  if command -v yq &>/dev/null; then
    local cfg_mode cfg_parallel cfg_strategy cfg_timeout cfg_output
    cfg_mode=$(yq -r '.mode // empty' "$CONFIG_FILE" 2>/dev/null || true)
    cfg_parallel=$(yq -r '.parallel // empty' "$CONFIG_FILE" 2>/dev/null || true)
    cfg_strategy=$(yq -r '.cost_strategy // empty' "$CONFIG_FILE" 2>/dev/null || true)
    cfg_timeout=$(yq -r '.timeout // empty' "$CONFIG_FILE" 2>/dev/null || true)
    cfg_output=$(yq -r '.output_dir // empty' "$CONFIG_FILE" 2>/dev/null || true)

    [[ -n "$cfg_mode" ]] && MODE="$cfg_mode"
    [[ "$cfg_parallel" == "true" ]] && PARALLEL=true
    [[ "$cfg_parallel" == "false" ]] && PARALLEL=false
    [[ -n "$cfg_strategy" ]] && STRATEGY="$cfg_strategy"
    [[ -n "$cfg_timeout" ]] && TIMEOUT="$cfg_timeout"
    [[ -n "$cfg_output" ]] && OUTPUT_DIR="${REPO_ROOT}/${cfg_output}"
  else
    echo "ℹ️  yq not found — using defaults from script. Install yq for config file support." >&2
  fi
}

# ── CLI Detection ──
detect_available_clis() {
  local cli_name cmd
  declare -gA AVAILABLE_CLIS=()

  for cli_name in "${!CLI_COMMANDS[@]}"; do
    cmd="${CLI_COMMANDS[$cli_name]}"
    if command -v "$cmd" &>/dev/null; then
      AVAILABLE_CLIS[$cli_name]=1
      echo "  ✅ ${cli_name} (${cmd})" >&2
    else
      echo "  ❌ ${cli_name} (${cmd}) — not installed" >&2
    fi
  done

  if [[ ${#AVAILABLE_CLIS[@]} -eq 0 ]]; then
    echo "" >&2
    echo "ERROR: No AI CLIs are installed. Install at least one:" >&2
    echo "  npm install -g @anthropic-ai/claude-code" >&2
    echo "  npm install -g @openai/codex" >&2
    echo "  npm install -g @google/gemini-cli" >&2
    exit 1
  fi
}

# ── Fallback Redistribution ──
redistribute_perspectives() {
  local cli_name perspectives fallback_target
  declare -gA EXECUTION_PLAN=()

  for cli_name in "${!CLI_PERSPECTIVES[@]}"; do
    perspectives="${CLI_PERSPECTIVES[$cli_name]}"

    # Apply CLI filter
    if [[ ${#CLI_FILTER[@]} -gt 0 ]]; then
      local in_filter=false
      for f in "${CLI_FILTER[@]}"; do
        [[ "$f" == "$cli_name" ]] && in_filter=true
      done
      if [[ "$in_filter" == "false" ]]; then
        continue
      fi
    fi

    if [[ -n "${AVAILABLE_CLIS[$cli_name]+x}" ]]; then
      # CLI is available — assign directly
      EXECUTION_PLAN[$cli_name]="$perspectives"
    else
      # CLI unavailable — redistribute to fallback
      fallback_target="${FALLBACK[$cli_name]:-}"
      if [[ -n "$fallback_target" && -n "${AVAILABLE_CLIS[$fallback_target]+x}" ]]; then
        echo "  ↪ ${cli_name} → ${fallback_target} (fallback)" >&2
        local existing="${EXECUTION_PLAN[$fallback_target]:-}"
        EXECUTION_PLAN[$fallback_target]="${existing:+$existing }${perspectives}"
      else
        echo "  ⚠️  ${cli_name}: No fallback available. Skipping: ${perspectives}" >&2
      fi
    fi
  done

  # Apply perspective filter
  if [[ ${#PERSPECTIVE_FILTER[@]} -gt 0 ]]; then
    for cli_name in "${!EXECUTION_PLAN[@]}"; do
      local filtered_perspectives=""
      for p in ${EXECUTION_PLAN[$cli_name]}; do
        for pf in "${PERSPECTIVE_FILTER[@]}"; do
          if [[ "$p" == "$pf" ]]; then
            filtered_perspectives="${filtered_perspectives:+$filtered_perspectives }${p}"
          fi
        done
      done
      if [[ -n "$filtered_perspectives" ]]; then
        EXECUTION_PLAN[$cli_name]="$filtered_perspectives"
      else
        unset "EXECUTION_PLAN[$cli_name]"
      fi
    done
  fi

  # Apply cost strategy adjustments
  if [[ "$STRATEGY" == "minimize_cost" ]]; then
    # Move premium CLI perspectives to flat-rate/free-tier when possible
    if [[ -n "${EXECUTION_PLAN[claude-code]+x}" && -n "${AVAILABLE_CLIS[copilot-cli]+x}" ]]; then
      local claude_p="${EXECUTION_PLAN[claude-code]}"
      local copilot_p="${EXECUTION_PLAN[copilot-cli]:-}"
      EXECUTION_PLAN[copilot-cli]="${copilot_p:+$copilot_p }${claude_p}"
      unset "EXECUTION_PLAN[claude-code]"
      echo "  💰 minimize_cost: claude-code → copilot-cli" >&2
    fi
  fi
}

# ── Cross-Model Mode ──
setup_cross_model() {
  if [[ "$MODE" != "cross-model" ]]; then
    return 0
  fi

  local perspective="${PERSPECTIVE_FILTER[0]:-code-review}"
  echo "  🔄 Cross-model mode: all CLIs run '${perspective}'" >&2

  declare -gA EXECUTION_PLAN=()
  for cli_name in "${!AVAILABLE_CLIS[@]}"; do
    # Apply CLI filter
    if [[ ${#CLI_FILTER[@]} -gt 0 ]]; then
      local in_filter=false
      for f in "${CLI_FILTER[@]}"; do
        [[ "$f" == "$cli_name" ]] && in_filter=true
      done
      [[ "$in_filter" == "false" ]] && continue
    fi
    EXECUTION_PLAN[$cli_name]="$perspective"
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

  if [[ ${#EXECUTION_PLAN[@]} -eq 0 ]]; then
    echo "   ⚠️  No CLIs/perspectives to execute." >&2
    return
  fi

  for cli_name in "${!EXECUTION_PLAN[@]}"; do
    local tier="${COST_TIERS[$cli_name]:-unknown}"
    echo "   ${cli_name} [${tier}]:" >&2
    for p in ${EXECUTION_PLAN[$cli_name]}; do
      echo "     - ${p}" >&2
    done
  done
  echo "" >&2
}

# ── Execute Single Review ──
run_single_review() {
  local cli_name="$1"
  local perspective="$2"

  local adapter="${CLI_ADAPTERS[$cli_name]}"
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
  if [[ ${#EXECUTION_PLAN[@]} -eq 0 ]]; then
    echo "Nothing to execute." >&2
    return 0
  fi

  mkdir -p "$OUTPUT_DIR"

  local pids=()
  local tasks=()
  local failed=0

  for cli_name in "${!EXECUTION_PLAN[@]}"; do
    for perspective in ${EXECUTION_PLAN[$cli_name]}; do
      if [[ "$PARALLEL" == "true" ]]; then
        run_single_review "$cli_name" "$perspective" &
        pids+=($!)
        tasks+=("${cli_name}/${perspective}")
      else
        echo "▶ ${cli_name} → ${perspective}" >&2
        if ! run_single_review "$cli_name" "$perspective"; then
          ((failed++))
          echo "  ❌ Failed: ${cli_name}/${perspective}" >&2
        fi
      fi
    done
  done

  # Wait for parallel tasks
  if [[ "$PARALLEL" == "true" && ${#pids[@]} -gt 0 ]]; then
    echo "⏳ Waiting for ${#pids[@]} parallel reviews..." >&2
    for i in "${!pids[@]}"; do
      if ! wait "${pids[$i]}"; then
        ((failed++))
        echo "  ❌ Failed: ${tasks[$i]}" >&2
      else
        echo "  ✅ Done: ${tasks[$i]}" >&2
      fi
    done
  fi

  echo "" >&2
  if [[ $failed -gt 0 ]]; then
    echo "⚠️  ${failed} review(s) failed." >&2
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

  for cli_name in "${!EXECUTION_PLAN[@]}"; do
    local cli_dir="${OUTPUT_DIR}/${cli_name}"
    if [[ ! -d "$cli_dir" ]]; then
      continue
    fi

    for result_file in "${cli_dir}"/*.md; do
      [[ -f "$result_file" ]] || continue
      has_results=true

      local perspective_name
      perspective_name="$(basename "$result_file" .md)"
      local tier="${COST_TIERS[$cli_name]:-unknown}"

      cat >> "$report_file" <<SECTION

## ${cli_name} — ${perspective_name} [${tier}]

$(cat "$result_file")

---

SECTION
    done
  done

  if [[ "$has_results" == "false" ]]; then
    echo "(No review results found.)" >> "$report_file"
  fi

  # Check for CRITICAL_BLOCK markers
  if grep -q "Critical" "$report_file" 2>/dev/null; then
    echo "" >> "$report_file"
    echo "<!-- CRITICAL_BLOCK -->" >> "$report_file"
    echo "⚠️  Critical issues detected. Review before proceeding." >> "$report_file"
  fi

  echo "📄 Report: ${report_file}" >&2
}

# ── Main ──
main() {
  echo "🚀 Multi-CLI Review Orchestrator" >&2
  echo "=================================" >&2
  echo "" >&2

  parse_args "$@"
  load_config

  echo "🔎 Detecting available CLIs..." >&2
  detect_available_clis

  echo "" >&2
  echo "📊 Building execution plan..." >&2

  if [[ "$MODE" == "cross-model" ]]; then
    setup_cross_model
  else
    redistribute_perspectives
  fi

  show_plan

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "🏁 Dry run complete. No reviews executed." >&2
    exit 0
  fi

  execute_reviews
  generate_report

  echo "" >&2
  echo "🏁 Done! View results:" >&2
  echo "   cat ${OUTPUT_DIR}/integrated-report.md" >&2
}

main "$@"
