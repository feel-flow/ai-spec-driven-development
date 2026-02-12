#!/bin/bash

# =============================================================================
# Claude Code SessionStart Hook: ブランチ状態チェック
# =============================================================================
# 目的: PRマージ後のブランチ切り替え忘れを防ぐ
# 実行タイミング: Claude Codeセッション開始時（SessionStart）
#
# 動作:
# 1. リモートにブランチが存在しない場合 → PRマージ済みの可能性を警告
# 2. mainブランチより大幅に遅れている場合 → rebaseを推奨
# =============================================================================

# 設定: メインブランチ名（プロジェクトに合わせて変更してください）
MAIN_BRANCH="${MAIN_BRANCH:-develop}"

# 設定: 警告を出すコミット数の閾値
BEHIND_THRESHOLD="${BEHIND_THRESHOLD:-10}"

# 現在のブランチを取得
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# Gitリポジトリでない場合はスキップ
if [ $? -ne 0 ]; then
  exit 0
fi

# developブランチにいる場合はチェック不要
if [ "$CURRENT_BRANCH" = "$MAIN_BRANCH" ]; then
  exit 0
fi

# リモートの最新情報を取得（タイムアウト付き）
# ネットワーク遅延を考慮して短時間で完了させる
timeout 5s git fetch origin "$MAIN_BRANCH" 2>/dev/null || true

# =============================================================================
# チェック1: 現在のブランチがリモートに存在するか
# =============================================================================
if ! git ls-remote --heads origin "$CURRENT_BRANCH" 2>/dev/null | grep -q "$CURRENT_BRANCH"; then
  echo ""
  echo "⚠️  WARNING: 現在のブランチ '$CURRENT_BRANCH' はリモートに存在しません。"
  echo "   PRがマージ済みの可能性があります。"
  echo ""
  echo "   以下のコマンドで $MAIN_BRANCH ブランチに戻ることを推奨します："
  echo ""
  echo "   git checkout $MAIN_BRANCH"
  echo "   git pull origin $MAIN_BRANCH"
  echo "   git branch -d $CURRENT_BRANCH"
  echo ""
  exit 0
fi

# =============================================================================
# チェック2: 現在のブランチがmainブランチより大幅に遅れていないか
# =============================================================================
BEHIND=$(git rev-list --count HEAD..origin/$MAIN_BRANCH 2>/dev/null)

if [ ! -z "$BEHIND" ] && [ "$BEHIND" -gt "$BEHIND_THRESHOLD" ]; then
  echo ""
  echo "ℹ️  INFO: 現在のブランチは $MAIN_BRANCH から $BEHIND コミット遅れています。"
  echo "   最新の変更を取り込むことを検討してください："
  echo ""
  echo "   git checkout $MAIN_BRANCH"
  echo "   git pull origin $MAIN_BRANCH"
  echo "   git checkout $CURRENT_BRANCH"
  echo "   git rebase $MAIN_BRANCH"
  echo ""
fi

exit 0
