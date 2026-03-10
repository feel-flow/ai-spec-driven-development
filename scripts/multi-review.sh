#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────
# multi-review.sh — Multi-CLI Review Orchestrator (wrapper)
# ────────────────────────────────────────────────────────────
# Backward-compatible wrapper that delegates to multi-agent.sh
# with --task review.
#
# All options are passed through to multi-agent.sh.
# For new usage, prefer: bash scripts/multi-agent.sh --task review
#
# See: bash scripts/multi-agent.sh --help
# ────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec bash "$SCRIPT_DIR/multi-agent.sh" --task review "$@"
