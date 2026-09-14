#!/usr/bin/env bash
# quality:local の結果を ff-dev-toolkit の gate-record へ書く（Issue #515）。
#
# 記録の失敗は検証結果の失敗ではない。このスクリプトは使い方の誤り以外、
# 常に exit 0 で返す（呼び出し側の終了コードを変えない）。
#
# 記録器の探索はレビューシムの版一致検査（--print-toolkit-root）に依存しない。
# record-gate-head.sh の実在だけを見る。
#
#   bash scripts/record-quality-gate.sh --status pass|fail [--expect-head <SHA>]
#
set -euo pipefail

STATUS=""
EXPECT_HEAD=""
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

usage() {
  echo "usage: bash scripts/record-quality-gate.sh --status pass|fail [--expect-head <SHA>]" >&2
}

while [ $# -gt 0 ]; do
  case "$1" in
    --status)
      [ $# -ge 2 ] || { usage; exit 2; }
      case "$2" in
        pass|fail) STATUS="$2" ;;
        *) usage; exit 2 ;;
      esac
      shift 2
      ;;
    --expect-head)
      [ $# -ge 2 ] || { usage; exit 2; }
      EXPECT_HEAD="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *) usage; exit 2 ;;
  esac
done

[ -n "$STATUS" ] || { usage; exit 2; }

usable_recorder() {
  local f="$1"
  [ -f "$f" ] && [ -r "$f" ] && [ -s "$f" ]
}

canonical_recorder() {
  local input="$1"
  if usable_recorder "${input}/scripts/record-gate-head.sh"; then
    printf '%s\n' "${input}/scripts/record-gate-head.sh"
    return 0
  fi
  if usable_recorder "${input}/record-gate-head.sh"; then
    printf '%s\n' "${input}/record-gate-head.sh"
    return 0
  fi
  return 1
}

semver_dir_newer() {
  local candidate="$1" current="$2" ca cb cc oa ob oc
  IFS=. read -r ca cb cc <<EOF
$candidate
EOF
  IFS=. read -r oa ob oc <<EOF
$current
EOF
  ca=$((10#$ca)); cb=$((10#$cb)); cc=$((10#$cc))
  oa=$((10#$oa)); ob=$((10#$ob)); oc=$((10#$oc))
  [ "$ca" -gt "$oa" ] \
    || { [ "$ca" -eq "$oa" ] && [ "$cb" -gt "$ob" ]; } \
    || { [ "$ca" -eq "$oa" ] && [ "$cb" -eq "$ob" ] && [ "$cc" -gt "$oc" ]; }
}

pick_cache_recorder() {
  local rec ver best="" best_ver="" fallback=""
  for rec in "$@"; do
    usable_recorder "$rec" || continue
    ver="$(basename "$(dirname "$(dirname "$rec")")")"
    case "$ver" in
      [0-9]*.[0-9]*.[0-9]*)
        if [ -z "$best_ver" ] || semver_dir_newer "$ver" "$best_ver"; then
          best="$rec"
          best_ver="$ver"
        fi
        ;;
      *)
        [ -n "$fallback" ] || fallback="$rec"
        ;;
    esac
  done
  if [ -n "$best" ]; then
    printf '%s\n' "$best"
    return 0
  fi
  if [ -n "$fallback" ]; then
    printf '%s\n' "$fallback"
    return 0
  fi
  return 1
}

collect_cache_recorders() {
  local cache rec
  shopt -s nullglob
  for cache in \
    "${CODEX_HOME:-${HOME}/.codex}/plugins/cache" \
    "${CLAUDE_CONFIG_DIR:-${HOME}/.claude}/plugins/cache"; do
    [ -d "$cache" ] || continue
    for rec in "$cache"/*/ff-dev-toolkit/*/scripts/record-gate-head.sh; do
      printf '%s\n' "$rec"
    done
  done
  for rec in "${HOME}/.grok/installed-plugins"/ff-dev-toolkit*/scripts/record-gate-head.sh; do
    printf '%s\n' "$rec"
  done
}

resolve_recorder() {
  local rec sidecar sidecar_value
  local -a found=()
  if [ -n "${FF_DEV_TOOLKIT_ROOT:-}" ]; then
    if rec="$(canonical_recorder "$FF_DEV_TOOLKIT_ROOT")"; then
      printf '%s\n' "$rec"
      return 0
    fi
    echo "ℹ️  ゲート記録をスキップします（FF_DEV_TOOLKIT_ROOT から record-gate-head.sh を読めません: ${FF_DEV_TOOLKIT_ROOT}/scripts/record-gate-head.sh または ${FF_DEV_TOOLKIT_ROOT}/record-gate-head.sh）" >&2
    return 1
  fi

  while IFS= read -r rec; do
    [ -n "$rec" ] && found+=("$rec")
  done <<EOF
$(collect_cache_recorders)
EOF
  if [ "${#found[@]}" -gt 0 ] && rec="$(pick_cache_recorder "${found[@]}")"; then
    printf '%s\n' "$rec"
    return 0
  fi

  sidecar="${ROOT}/scripts/.ff-dev-toolkit-root"
  if [ -f "$sidecar" ] && [ -r "$sidecar" ]; then
    IFS= read -r sidecar_value < "$sidecar" || true
    if [ -n "$sidecar_value" ] && rec="$(canonical_recorder "$sidecar_value")"; then
      printf '%s\n' "$rec"
      return 0
    fi
  fi

  echo "ℹ️  ゲート記録をスキップします（record-gate-head.sh を解決できません。Codex/Claude の plugin cache か FF_DEV_TOOLKIT_ROOT を確認してください）" >&2
  return 1
}

RECORDER=""
RECORDER="$(resolve_recorder)" || exit 0

ARGS=(--gate quality:local --status "$STATUS" --mode full)
[ -n "$EXPECT_HEAD" ] && ARGS+=(--expect-head "$EXPECT_HEAD")

if ! bash "$RECORDER" "${ARGS[@]}"; then
  echo "⚠️  ゲート記録に失敗しました（quality:local の判定は変えません）" >&2
fi
exit 0
