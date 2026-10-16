#!/usr/bin/env bash
# ローカル品質ゲート。チェーンの正本は docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md §3.3。
# Issue #515: 終了後に開始時 HEAD を --expect-head へ渡して gate-record を書く。
# 成功は STATUS=pass、失敗は STATUS=fail（前回の緑を無効化）。記録のスキップ・失敗は
# ゲートの終了コードを変えない。HEAD が動いていたら pass は書かない。
# Issue #389: 各段の開始を stdout、失敗を stderr にラベル付きで出す。最初の失敗で止め、
# その段の終了コードをそのまま返す（旧 `&&` 連結と同じ）。個別段の実行は各 npm script を
# 直接呼ぶ。部分実行で gate-record の pass を書かせないため、--only は設けない。
# Issue #565: ルートまたは mcp の node_modules が無いときは、段を 1 つも実行せず exit 1 で止め、
# STATUS=fail を記録する（npm ci は自動実行せず、案内だけ出す）。
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
  "run check:md-ts"
  "run build:spec-index"
  "run format:md:check"
  "run lint:md"
)

# Issue #565: 段を回す前に依存の導入を確かめる。「node_modules のディレクトリ|導入コマンド」を
# 1 か所に置き、判定と案内の対応がずれないようにする。npm ci は自動実行しない
# （§3.3 の方針）。壊れかけの node_modules までは見ない（在る/無いだけ）。
DEPS=(
  "node_modules|npm ci"
  "mcp/node_modules|npm --prefix mcp ci"
)

STEP_COUNT=${#STEPS[@]}
GATE_RC=0

MISSING_DEPS=()
for dep in "${DEPS[@]}"; do
  [ -d "$ROOT/${dep%%|*}" ] || MISSING_DEPS+=("$dep")
done

i=0
if [ "${#MISSING_DEPS[@]}" -gt 0 ]; then
  GATE_RC=1
  i=$STEP_COUNT
  for dep in "${MISSING_DEPS[@]}"; do
    echo "✗ quality:local: ${dep%%|*} がありません。段を実行せず止めます。先に実行: ${dep#*|}" >&2
  done
fi

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
