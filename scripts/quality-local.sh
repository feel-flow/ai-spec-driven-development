#!/usr/bin/env bash
# ローカル品質ゲート。チェーンの正本は docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md §3.3。
# Issue #515: 終了後に開始時 HEAD を --expect-head へ渡して gate-record を書く。
# 成功は STATUS=pass、失敗は STATUS=fail（前回の緑を無効化）。記録のスキップ・失敗は
# ゲートの終了コードを変えない。HEAD が動いていたら pass は書かない。
# Issue #389: 各段の開始を stdout、失敗を stderr にラベル付きで出す。最初の失敗で止め、
# その段の終了コードをそのまま返す（旧 `&&` 連結と同じ）。個別段の実行は各 npm script を
# 直接呼ぶ。部分実行で gate-record の pass を書かせないため、--only は設けない。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

START_HEAD="$(git rev-parse HEAD 2>/dev/null || true)"

# 段の表示名。run_step の case と同じ順・同じ数で並べる。順序を変えるときは §3.3 も更新する。
STEP_LABELS=(
  "npm run build:mcp"
  "npm run check"
  "npm --prefix mcp test"
  "npm run test:ace-scripts"
  "npm run validate -- docs-template"
  "npm run build:spec-index"
  "npm run format:md:check"
  "npm run lint:md"
)

run_step() {
  case "$1" in
    0) npm run build:mcp ;;
    1) npm run check ;;
    2) npm --prefix mcp test ;;
    3) npm run test:ace-scripts ;;
    4) npm run validate -- docs-template ;;
    5) npm run build:spec-index ;;
    6) npm run format:md:check ;;
    7) npm run lint:md ;;
    *) echo "quality:local: 未定義の段 ${1}" >&2; return 2 ;;
  esac
}

STEP_COUNT=${#STEP_LABELS[@]}
GATE_RC=0
i=0
while [ "$i" -lt "$STEP_COUNT" ]; do
  label="${STEP_LABELS[$i]}"
  step_no=$((i + 1))
  echo "==> quality:local [${step_no}/${STEP_COUNT}] ${label}"
  step_rc=0
  run_step "$i" || step_rc=$?
  if [ "$step_rc" -ne 0 ]; then
    GATE_RC=$step_rc
    echo "✗ quality:local: [${step_no}/${STEP_COUNT}] ${label} が失敗しました（exit ${step_rc}）。この段だけ再実行: ${label}" >&2
    break
  fi
  i=$((i + 1))
done

if [ "$GATE_RC" -eq 0 ]; then
  echo "✓ quality:local: 全 ${STEP_COUNT} 段が通過しました"
  RECORD_STATUS=pass
else
  RECORD_STATUS=fail
fi

RECORD_ARGS=(--status "$RECORD_STATUS")
[ -n "$START_HEAD" ] && RECORD_ARGS+=(--expect-head "$START_HEAD")
bash "$ROOT/scripts/record-quality-gate.sh" "${RECORD_ARGS[@]}"

exit "$GATE_RC"
