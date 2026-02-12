#!/bin/bash
# =============================================================================
# Review Router Script - Copilot CLI セッション分離レビュー
# =============================================================================
#
# 各レビュースキルを独立した Copilot CLI セッションで実行し、
# 結果をファイルに出力するスクリプト。
#
# 使用方法:
#   bash scripts/review.sh [options]
#
# オプション:
#   --all               すべてのスキルを実行（デフォルト: 必須スキルのみ）
#   --skill <name>      指定スキルのみ実行（複数指定可）
#   --parallel          並列実行（デフォルト: 順次実行）
#   --output-dir <dir>  出力ディレクトリ（デフォルト: .review-results）
#   --no-copilot        Copilot CLI をスキップし、手動レビュー推奨メッセージのみ出力
#
# 例:
#   bash scripts/review.sh                          # 必須スキルのみ
#   bash scripts/review.sh --all                    # 全スキル実行
#   bash scripts/review.sh --skill code-review      # 単一スキル
#   bash scripts/review.sh --all --parallel          # 全スキル並列実行
#
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# 定数
# ---------------------------------------------------------------------------
readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly DEFAULT_OUTPUT_DIR=".review-results"
readonly SKILLS_DIR=".github/skills"

# 必須スキル（常に実行）
readonly MANDATORY_SKILLS=("code-review" "error-handler-hunt")

# 条件付きスキル
readonly CONDITIONAL_SKILLS=("test-analysis" "type-design-analysis" "comment-analysis" "code-simplification")

# すべてのスキル
readonly ALL_SKILLS=("${MANDATORY_SKILLS[@]}" "${CONDITIONAL_SKILLS[@]}")

# ---------------------------------------------------------------------------
# 変数
# ---------------------------------------------------------------------------
OUTPUT_DIR="$DEFAULT_OUTPUT_DIR"
RUN_ALL=false
RUN_PARALLEL=false
NO_COPILOT=false
SELECTED_SKILLS=()
PIDS=()
FAILED_SKILLS=()
SUCCEEDED_SKILLS=()

# ---------------------------------------------------------------------------
# ユーティリティ関数
# ---------------------------------------------------------------------------
log_info() {
  echo "ℹ️  $*"
}

log_success() {
  echo "✅ $*"
}

log_error() {
  echo "❌ $*" >&2
}

log_warn() {
  echo "⚠️  $*"
}

# ---------------------------------------------------------------------------
# 引数解析
# ---------------------------------------------------------------------------
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --all)
        RUN_ALL=true
        shift
        ;;
      --skill)
        shift
        if [[ $# -eq 0 ]]; then
          log_error "--skill にはスキル名が必要です"
          exit 1
        fi
        SELECTED_SKILLS+=("$1")
        shift
        ;;
      --parallel)
        RUN_PARALLEL=true
        shift
        ;;
      --output-dir)
        shift
        if [[ $# -eq 0 ]]; then
          log_error "--output-dir にはディレクトリパスが必要です"
          exit 1
        fi
        OUTPUT_DIR="$1"
        shift
        ;;
      --no-copilot)
        NO_COPILOT=true
        shift
        ;;
      --help|-h)
        show_help
        exit 0
        ;;
      *)
        log_error "不明なオプション: $1"
        show_help
        exit 1
        ;;
    esac
  done
}

show_help() {
  cat << 'EOF'
Review Router Script - Copilot CLI セッション分離レビュー

使用方法:
  bash scripts/review.sh [options]

オプション:
  --all               すべてのスキルを実行（デフォルト: 必須スキルのみ）
  --skill <name>      指定スキルのみ実行（複数指定可）
  --parallel          並列実行（デフォルト: 順次実行）
  --output-dir <dir>  出力ディレクトリ（デフォルト: .review-results）
  --no-copilot        Copilot CLI をスキップし、手動レビュー推奨メッセージのみ出力
  --help, -h          このヘルプを表示

利用可能なスキル:
  code-review           コードレビュー（必須）
  error-handler-hunt    エラーハンドリング検査（必須）
  test-analysis         テスト品質分析
  type-design-analysis  型設計評価
  comment-analysis      コメント分析
  code-simplification   コード簡素化

例:
  bash scripts/review.sh                              # 必須スキルのみ
  bash scripts/review.sh --all                        # 全スキル実行
  bash scripts/review.sh --skill code-review          # 単一スキル
  bash scripts/review.sh --skill code-review --skill test-analysis
  bash scripts/review.sh --all --parallel             # 全スキル並列実行

トラブルシューティング:
  - Copilot CLI の確認: command -v copilot && copilot version
  - 非インタラクティブモード: 本スクリプトは --allow-all-tools を使用
  - 環境変数: COPILOT_ALLOW_ALL=1 でツール許可を事前設定可能
EOF
}

# ---------------------------------------------------------------------------
# Copilot CLI チェック
# ---------------------------------------------------------------------------
check_copilot_cli() {
  if ! command -v copilot &> /dev/null; then
    log_error "Copilot CLI がインストールされていません"
    log_warn "Copilot CLI が利用できません。以下のいずれかを選択してください:"
    log_info "  1. brew install copilot-cli でインストール（macOS/Linux）"
    log_info "  2. npm install -g @github/copilot（全プラットフォーム）"
    log_info "  3. curl -fsSL https://gh.io/copilot-install | bash"
    log_info "  4. 手動でレビューを実施"
    log_info "  5. @review-router エージェントのモード2（動的読み込み）を利用"
    log_info "詳細: https://github.com/github/copilot-cli"
    exit 1
  fi
  log_info "Copilot CLI: $(command -v copilot)"
  local version_output
  if version_output=$(copilot version 2>/dev/null); then
    log_info "バージョン: $(echo "$version_output" | head -1)"
  fi
}

# ---------------------------------------------------------------------------
# 変更ファイルの検出
# ---------------------------------------------------------------------------
detect_changed_files() {
  local changed_files
  # HEADとの差分（ステージング済み + 未ステージング）
  changed_files=$(git diff --name-only HEAD 2>/dev/null || git diff --name-only --cached 2>/dev/null || echo "")

  if [[ -z "$changed_files" ]]; then
    # develop ブランチとの差分を確認
    changed_files=$(git diff --name-only develop...HEAD 2>/dev/null || echo "")
  fi

  echo "$changed_files"
}

# ---------------------------------------------------------------------------
# 条件付きスキルの自動判定
# ---------------------------------------------------------------------------
should_run_skill() {
  local skill="$1"
  local changed_files="$2"

  case "$skill" in
    test-analysis)
      echo "$changed_files" | grep -qE '\.(test|spec)\.(ts|tsx|js|jsx)$' && return 0
      # テスト対象のソースが変更された場合も実行
      echo "$changed_files" | grep -qE '\.(ts|tsx|js|jsx)$' && return 0
      return 1
      ;;
    type-design-analysis)
      # TypeScript ファイルの変更がある場合
      echo "$changed_files" | grep -qE '\.(ts|tsx)$' && return 0
      return 1
      ;;
    comment-analysis)
      # ドキュメントファイルの変更がある場合
      echo "$changed_files" | grep -qiE '\.(md|mdx)$|README' && return 0
      # TypeScript/JS ファイル（JSDoc変更の可能性）
      echo "$changed_files" | grep -qE '\.(ts|tsx|js|jsx)$' && return 0
      return 1
      ;;
    code-simplification)
      # ソースコードの変更がある場合
      echo "$changed_files" | grep -qE '\.(ts|tsx|js|jsx)$' && return 0
      return 1
      ;;
    *)
      return 0
      ;;
  esac
}

# ---------------------------------------------------------------------------
# 実行するスキルの決定
# ---------------------------------------------------------------------------
determine_skills() {
  local changed_files
  changed_files=$(detect_changed_files)

  if [[ ${#SELECTED_SKILLS[@]} -gt 0 ]]; then
    # 明示的に指定されたスキル
    for skill in "${SELECTED_SKILLS[@]}"; do
      if [[ ! -d "$PROJECT_ROOT/$SKILLS_DIR/$skill" ]]; then
        log_error "スキルが見つかりません: $skill"
        exit 1
      fi
    done
    return
  fi

  if [[ "$RUN_ALL" == true ]]; then
    SELECTED_SKILLS=("${ALL_SKILLS[@]}")
    return
  fi

  # 必須スキル
  SELECTED_SKILLS=("${MANDATORY_SKILLS[@]}")

  # 条件付きスキルの自動判定
  for skill in "${CONDITIONAL_SKILLS[@]}"; do
    if should_run_skill "$skill" "$changed_files"; then
      SELECTED_SKILLS+=("$skill")
      log_info "条件付きスキル追加: $skill"
    else
      log_info "条件付きスキルスキップ: $skill（該当変更なし）"
    fi
  done
}

# ---------------------------------------------------------------------------
# スキル実行
# ---------------------------------------------------------------------------
run_skill() {
  local skill="$1"
  local output_file="$OUTPUT_DIR/${skill}.md"
  local skill_path="$SKILLS_DIR/$skill/SKILL.md"

  log_info "実行中: $skill ..."

  # Copilot CLI をプログラマティックモードで実行
  # 非インタラクティブモードでは --allow-all-tools が必須（公式ドキュメント参照）
  # 各呼び出しが独立したLLMセッション = 真のセッション分離
  copilot -p "
変更されたコードに対して、@${skill_path} のスキル定義に従いレビューを実施してください。
git diff で変更内容を確認し、変更されたファイルのみを対象にレビューしてください。
結果はMarkdown形式で出力してください。
" -s --allow-all-tools > "$output_file" 2>&1
  local exit_code=$?
  if [[ $exit_code -eq 0 ]]; then
    log_success "$skill 完了 → $output_file"
    SUCCEEDED_SKILLS+=("$skill")
  else
    log_error "$skill 失敗（終了コード: $exit_code）"
    if [[ -s "$output_file" ]]; then
      log_error "詳細は $output_file を確認してください（最後の15行）:"
      tail -15 "$output_file" >&2
    fi
    FAILED_SKILLS+=("$skill")
    echo "# $skill - 実行失敗" > "$output_file"
    echo "" >> "$output_file"
    echo "スキルの実行中にエラーが発生しました。" >> "$output_file"
  fi
}

# ---------------------------------------------------------------------------
# メイン処理
# ---------------------------------------------------------------------------
main() {
  cd "$PROJECT_ROOT"

  log_info "=== Review Router (Copilot CLI) ==="
  log_info ""

  # 引数解析
  parse_args "$@"

  # --no-copilot の場合は手動レビュー推奨メッセージのみ
  if [[ "$NO_COPILOT" == true ]]; then
    log_warn "Copilot CLI をスキップしました（--no-copilot）"
    log_info "手動レビューを推奨します。または以下の方法で Copilot CLI を利用できます:"
    log_info "  1. brew install copilot-cli でインストール後、本スクリプトを再実行"
    log_info "  2. @review-router エージェントのモード2（動的読み込み）を利用"
    log_info "詳細: https://github.com/github/copilot-cli"
    exit 0
  fi

  # Copilot CLI チェック
  check_copilot_cli

  # 実行スキル決定
  determine_skills

  log_info ""
  log_info "実行スキル: ${SELECTED_SKILLS[*]}"
  log_info "出力先: $OUTPUT_DIR/"
  log_info "実行モード: $([ "$RUN_PARALLEL" = true ] && echo "並列" || echo "順次")"
  log_info ""

  # 出力ディレクトリ作成
  mkdir -p "$OUTPUT_DIR"

  # 実行
  if [[ "$RUN_PARALLEL" == true ]]; then
    # 並列実行
    for skill in "${SELECTED_SKILLS[@]}"; do
      run_skill "$skill" &
      PIDS+=($!)
    done

    # すべての完了を待つ
    for pid in "${PIDS[@]}"; do
      wait "$pid" || true
    done
  else
    # 順次実行
    for skill in "${SELECTED_SKILLS[@]}"; do
      run_skill "$skill"
    done
  fi

  # サマリー出力
  log_info ""
  log_info "=== Review Summary ==="
  log_info "成功: ${#SUCCEEDED_SKILLS[@]}/${#SELECTED_SKILLS[@]}"

  if [[ ${#FAILED_SKILLS[@]} -gt 0 ]]; then
    log_warn "失敗: ${FAILED_SKILLS[*]}"
  fi

  log_info ""
  log_info "結果ファイル:"
  for skill in "${SELECTED_SKILLS[@]}"; do
    local status="✅"
    if [[ ${#FAILED_SKILLS[@]} -gt 0 ]]; then
      for failed in "${FAILED_SKILLS[@]}"; do
        if [[ "$failed" == "$skill" ]]; then
          status="❌"
          break
        fi
      done
    fi
    log_info "  $status $OUTPUT_DIR/${skill}.md"
  done

  # 統合レポート生成
  generate_integrated_report

  log_info ""
  log_info "統合レポート: $OUTPUT_DIR/review-report.md"
  log_success "レビュー完了"
}

# ---------------------------------------------------------------------------
# 統合レポート生成
# ---------------------------------------------------------------------------
generate_integrated_report() {
  local report="$OUTPUT_DIR/review-report.md"

  cat > "$report" << EOF
# 📋 Review Router Report

**実行日時:** $(date '+%Y-%m-%d %H:%M:%S')
**実行モード:** Copilot CLI セッション分離

## 実行されたスキル

EOF

  for skill in "${ALL_SKILLS[@]}"; do
    local executed=false
    for selected in "${SELECTED_SKILLS[@]}"; do
      if [[ "$selected" == "$skill" ]]; then
        executed=true
        break
      fi
    done

    local failed=false
    if [[ ${#FAILED_SKILLS[@]} -gt 0 ]]; then
      for f in "${FAILED_SKILLS[@]}"; do
        if [[ "$f" == "$skill" ]]; then
          failed=true
          break
        fi
      done
    fi

    if [[ "$executed" == true ]]; then
      if [[ "$failed" == true ]]; then
        echo "- ❌ ${skill}（実行失敗）" >> "$report"
      else
        echo "- ✅ ${skill}" >> "$report"
      fi
    else
      echo "- ⏭️ ${skill}（スキップ）" >> "$report"
    fi
  done

  echo "" >> "$report"
  echo "---" >> "$report"
  echo "" >> "$report"

  # 各スキルの結果を統合
  for skill in "${SELECTED_SKILLS[@]}"; do
    local result_file="$OUTPUT_DIR/${skill}.md"
    if [[ -f "$result_file" ]]; then
      echo "## $skill" >> "$report"
      echo "" >> "$report"
      cat "$result_file" >> "$report"
      echo "" >> "$report"
      echo "---" >> "$report"
      echo "" >> "$report"
    fi
  done
}

# ---------------------------------------------------------------------------
# エントリポイント
# ---------------------------------------------------------------------------
main "$@"
