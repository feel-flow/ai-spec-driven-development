#!/usr/bin/env bash
# ローカル品質ゲート。チェーンの正本は docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md §3.3。
# Issue #515: 終了後に開始時 HEAD を --expect-head へ渡して gate-record を書く。
# 成功は STATUS=pass、失敗は STATUS=fail（前回の緑を無効化）。記録のスキップ・失敗は
# ゲートの終了コードを変えない。HEAD が動いていたら pass は書かない。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

START_HEAD="$(git rev-parse HEAD 2>/dev/null || true)"

set +e
npm run build:mcp \
  && npm run check \
  && npm --prefix mcp test \
  && npm run test:ace-scripts \
  && npm run validate -- docs-template \
  && npm run build:spec-index \
  && npm run format:md:check \
  && npm run lint:md
GATE_RC=$?
set -e

if [ "$GATE_RC" -eq 0 ]; then
  RECORD_STATUS=pass
else
  RECORD_STATUS=fail
fi

RECORD_ARGS=(--status "$RECORD_STATUS")
[ -n "$START_HEAD" ] && RECORD_ARGS+=(--expect-head "$START_HEAD")
bash "$ROOT/scripts/record-quality-gate.sh" "${RECORD_ARGS[@]}"

exit "$GATE_RC"
