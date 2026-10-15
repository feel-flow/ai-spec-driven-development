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

# 各段の npm 引数。表示ラベルと実行コマンドはどちらもこの 1 か所から作る（対応がずれないように）。
# 引数は空白区切りで分割するので、空白や glob 文字を含む引数は置かない。
# 順序を変えるときは docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md §3.3 と
# scripts/quality-local.test.ts の EXPECTED_ORDER も更新する（§3.2 は旧 ci.yml の記録なので追従しない）。
STEPS=(
  "run build:mcp"
  "run check"
  "--prefix mcp test"
  "run test:ace-scripts"
  "run validate -- docs-template"
  "run build:spec-index"
  "run format:md:check"
  "run lint:md"
)

STEP_COUNT=${#STEPS[@]}
GATE_RC=0
i=0
while [ "$i" -lt "$STEP_COUNT" ]; do
  read -r -a step_args <<< "${STEPS[$i]}"
  label="npm ${STEPS[$i]}"
  step_no=$((i + 1))
  echo "==> quality:local [${step_no}/${STEP_COUNT}] ${label}"
  step_rc=0
  npm "${step_args[@]}" || step_rc=$?
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
