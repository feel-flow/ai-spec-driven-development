#!/usr/bin/env bash
# ローカル品質ゲート（Issue #515）。
# チェーンは docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md §3.3 が正本。
# 成功時は STATUS=pass、失敗時は STATUS=fail を gate-record へ書く
# （失敗が前回の緑を無効化する。記録の失敗はゲートの終了コードを変えない）。
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
