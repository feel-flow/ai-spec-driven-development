#!/usr/bin/env bash
# quality:local の結果を ff-dev-toolkit の gate-record へ書く（Issue #515）。
#
# 記録の失敗は検証結果の失敗ではない。このスクリプトは使い方の誤り以外、
# 常に exit 0 で返す（呼び出し側の終了コードを変えない）。
#
#   bash scripts/record-quality-gate.sh --status pass|fail [--expect-head <SHA>]
#
set -euo pipefail

STATUS=""
EXPECT_HEAD=""
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

usage() {
  echo "usage: bash scripts/record-quality-gate.sh --status pass|fail [--expect-head <SHA>]" >&2
  exit 2
}

while [ $# -gt 0 ]; do
  case "$1" in
    --status)
      [ $# -ge 2 ] || usage
      case "$2" in
        pass|fail) STATUS="$2" ;;
        *) usage ;;
      esac
      shift 2
      ;;
    --expect-head)
      [ $# -ge 2 ] || usage
      EXPECT_HEAD="$2"
      shift 2
      ;;
    -h|--help) usage ;;
    *) usage ;;
  esac
done

[ -n "$STATUS" ] || usage

resolve_recorder() {
  local root recorder
  if [ -n "${FF_DEV_TOOLKIT_ROOT:-}" ]; then
    recorder="${FF_DEV_TOOLKIT_ROOT}/scripts/record-gate-head.sh"
    if [ -f "$recorder" ] && [ -r "$recorder" ] && [ -s "$recorder" ]; then
      printf '%s\n' "$recorder"
      return 0
    fi
    echo "⚠️  ゲート記録をスキップします（FF_DEV_TOOLKIT_ROOT に record-gate-head.sh がありません）" >&2
    return 1
  fi
  if [ ! -f "$ROOT/scripts/codex-review.sh" ]; then
    echo "⚠️  ゲート記録をスキップします（toolkit を解決できません）" >&2
    return 1
  fi
  root="$(bash "$ROOT/scripts/codex-review.sh" --print-toolkit-root 2>/dev/null)" || root=""
  recorder="${root}/scripts/record-gate-head.sh"
  if [ -n "$root" ] && [ -f "$recorder" ] && [ -r "$recorder" ] && [ -s "$recorder" ]; then
    printf '%s\n' "$recorder"
    return 0
  fi
  echo "⚠️  ゲート記録をスキップします（ff-dev-toolkit の plugin cache がありません）" >&2
  return 1
}

RECORDER=""
RECORDER="$(resolve_recorder)" || exit 0

ARGS=(--gate quality:local --status "$STATUS" --mode full)
[ -n "$EXPECT_HEAD" ] && ARGS+=(--expect-head "$EXPECT_HEAD")

# 記録スクリプトの非 0 は検証失敗ではない。
if ! bash "$RECORDER" "${ARGS[@]}"; then
  echo "⚠️  ゲート記録に失敗しました（quality:local の判定は変えません）" >&2
fi
exit 0
