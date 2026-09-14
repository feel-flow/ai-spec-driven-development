#!/usr/bin/env bash
# ============================================================================
# codex-review.sh — Codex cross-model レビューの薄いシム
# ============================================================================
#
# 本体は何もしない。`multi-agent.sh --task review --cli codex-cli` へ委譲する。
#
# ## なぜシムなのか
#
# 以前このファイルは各プロジェクトが自前で持つ 80〜390 行のラッパーで、
# `review-common.sh` / `review-prompts.sh` と合わせて 3 本 1 組だった。同じ仕事を
# オーケストレータと二重に持っていたため、消費プロジェクトごとにコピーが分岐し、
# 依存欠落で起動できないコピーや、下記の stdin の罠を踏むコピーが生まれた
# （Issue #406）。実装をオーケストレータ 1 本へ寄せ、この入口は名前と
# コマンドラインの互換だけを担う。
#
# ## 直接 `codex exec` を叩かない理由（重要）
#
# codex は stdin が TTY でないと「追加入力」として読みに行き、EOF が来るまで
# ブロックする。stdout には何も出ないので、外からはハングと区別がつかない。
# 実測（codex-cli 0.144.5）:
#
#   codex exec -s read-only "..." </dev/null  → rc=0 で完走
#   同上・stdin を開いたまま同期実行          → EOF が来るまで戻らない
#
# 見分け方に注意: "Reading additional input from stdin..." は**成功時にも出る**ので、
# その行の有無では判別できない。ハングを示すのは **stdout が 0 バイトのまま**という
# 事実の方。所要時間はモデル側の待ち時間で変動するので基準にしない。
#
# multi-agent.sh は `run_with_timeout` 経由で CLI を起動し、そこは
# `"$@" >"$out_file" &` と**非同期**なので、POSIX により非対話シェルの非同期
# リストの stdin は /dev/null に割り当てられる。委譲している限りこの罠は
# 構造的に起きない。`tests/review-wrapper-shim/` がこのファイルに
# 「AI CLI を直接起動しないこと」を機械的に課している。
#
# ## 受け付けないものは黙って捨てない
#
# シムは薄いので、旧ラッパーが持っていた機能の大半を持たない。渡されたものを
# 黙って無視すると、利用者は指定したつもりのまま既定設定でレビューが走り、
# 成果物からもログからも判別できない（ACE-70-2 が記録した実害と同じ形）。
# 未対応のオプションは非 0 で拒否し、正規の経路を案内する。旧ラッパーの環境変数は、
# 写せるものは写して 1 行通知し、写せないものだけ拒否する（下記）。
#
# 未知フラグの扱いは **allowlist 方式**（汎用パススルーにしない。Issue #970 の判断）。
# 素通しにすると、シムが写像を持つ名前（--reviewers 等）と委譲先の生名が二重経路に
# なって「どちらが解釈したか」が判別できなくなり、委譲先に無いフラグはオーケストレータ
# 側の Unknown option（rc=1）で落ちる — 出るのは multi-agent.sh 自身の generic な
# usage 案内だけで、シム経路への案内は出ない。ここで拒否して --help と
# multi-agent.sh 直呼びを案内する方が、黙って既定で走るよりも汎用素通しよりも安全。
# 委譲先がフラグを足したら、必要になった時点でこの allowlist に足す。
#
# ## 使い方
#
#   bash scripts/codex-review.sh [--base <branch> | --staged] [--reviewers a,b,c]
#                                [--exclude-reviewers a,b,c] [--all-perspectives]
#                                [--list-reviewers] [--review-context-file <path>]
#                                [--timeout <秒>] [--mode <mode>] [--dry-run]
#                                [--fresh] [--resume]
#   bash scripts/codex-review.sh --print-toolkit-root[=root|kv]
#
#   SKIP_CODEX_REVIEW=1  レビューを実行せず成功終了する（pre-commit の逃がし弁）
#
#   終了コード: 0 = 完走 or 意図的なスキップ（小 diff / SKIP_CODEX_REVIEW）
#               2 = 入力の誤り（未対応オプション・不正な env）
#               3 = diff が大きすぎてレビューできない（成功と区別する）
#               4 = codex CLI が PATH に無い（レビュー未実施。Claude セルフレビューへ降格）
#                   ただし --dry-run はこのシムの codex 実在検査を素通りして常に委譲する
#                   （--dry-run がこの rc=4 で止まることは無い）
#               その他 = 委譲先の終了コードをそのまま返す。codex が PATH に無い環境の
#                   --dry-run は、残りの AI CLI の構成で 4 通りに分かれる。主 reviewer に
#                   既定値は無く、MULTI_AGENT_REVIEW_MAIN / プロジェクト設定
#                   （.claude/agent-config.yaml の review.main。yq がある環境のみ読まれる）
#                   のいずれかで指定したものだけが pair の主になる（委譲先の
#                   --set-reviewers も同じ役だがこのシムは受け付けない。multi-agent.sh を
#                   直接呼ぶときだけ使える）。設定値が未知・不正な
#                   CLI 名のときは CLI 検出の前に rc=1 で止まる（以下は有効な設定での分岐）:
#                     ・codex が不在で、委譲先の pair 主 reviewer（設定済み）が導入済み
#                       → rc=0。プランは出る。このシムは固定で足している
#                          `--cli codex-cli` を**この回だけ外して**委譲する。`--cli` は
#                          委譲先では分散モードのフィルタなので、外すと review の既定
#                          である pair モードへ戻り、主 reviewer が review 観点すべてを
#                          担当するプランになって `🏁 Dry run complete.` まで到達する。
#                          表示されるのは `multi-agent.sh --task review` と同じプラン
#                          であって、このシムを --dry-run なしで実行したときの
#                          プランではない（実行は従来どおり rc=4 で止まる）
#                     ・codex が不在で、設定済みの pair 主 reviewer も導入されていない
#                       （例: 主を claude-code に設定したまま grok だけが入っている）
#                       → rc=1。`ERROR: main reviewer '<名前>' is not installed.` で止まる。
#                          プランは出ない（主を導入するか MULTI_AGENT_REVIEW_MAIN で変える。主を
#                          --exclude-cli / exclude_clis で除外している回は文言が
#                          `was excluded by …` に変わる）
#                     ・codex が不在で、pair 主 reviewer が**未設定**（非従量の AI CLI が
#                       1 本でもある）
#                       → rc=0。委譲先が `No reviewers configured — falling back to the
#                          distributed plan.` で分散プランへ縮退し、残りの CLI が観点を
#                          引き受けたプランが出る（pair のプランではない）。従量課金の
#                          copilot だけの環境は分散プランで既定除外されるため、
#                          `ERROR: Execution plan is empty` で rc=1（プランなし）
#                     ・AI CLI が 1 本も PATH に無い
#                       → rc=1。委譲先の CLI 検出が `ERROR: No AI CLIs are installed`
#                          で止まり `🏁 Dry run complete.` には到達しない
#     **リテラル `1` のみ**を見る。`true` / `yes` では走る。既存の各プロジェクト実装と
#     同じ挙動で、値の解釈を広げると「どの値なら効くのか」が実装ごとに分かれるため、
#     互換のまま狭く保つ。判断の記録であって、うっかりではない。
#     skip はこのファイルの最初の分岐で短絡するので、skip したときは旧 env
#     （CODEX_MODEL 等）の写像・拒否の通知も出ない。走らせない実行について
#     設定の話をしても行動につながらないため、意図的にこの順序にしている。
#
#   同じオプションを 2 回渡した場合（`--base a --base b`）は両方そのまま委譲し、
#   オーケストレータ側の last-wins に従う。一般的な CLI 慣習どおりだが、最初の指定は
#   黙って捨てられる。ここで重複を検出して拒否すると、`--base` を既定で足す
#   ラッパーの上からもう一度指定する、という実在の使い方を壊すのでそのままにする。
#
#   モデル / reasoning effort の指定は toolkit の正規経路を使う:
#     MULTI_AGENT_MODEL_CODEX_CLI=<model>     モデルを明示する
#     MULTI_AGENT_CODEX_PROFILE=<profile>     ~/.codex/<name>.config.toml を層に重ねる
#     MULTI_AGENT_CODEX_REASONING_EFFORT=<effort>  effort だけを明示する
#   （両者は同時指定できない。詳細は skills/multi-review/SKILL.md の「モデル選択」）
#
#   旧ラッパーの env は写す（黙殺しない。1 行通知する）:
#     CODEX_MODEL             → MULTI_AGENT_MODEL_CODEX_CLI
#     CODEX_DEFAULT_REVIEWERS → 既定の観点（--reviewers 明示時はそちらが優先）
#     CODEX_REASONING_EFFORT  → MULTI_AGENT_CODEX_REASONING_EFFORT
#
# ## 解決結果だけを出す契約（--print-toolkit-root）
#
#   消費側の hook / ゲートが toolkit の**別のスクリプト**（record-gate-head.sh 等）を
#   呼ぶとき、以前はサイドカー（scripts/.ff-dev-toolkit-root）を自前で読むしかなかった。
#   サイドカーは版ディレクトリの絶対パスを焼き込むので plugin 更新のたびに stale になり、
#   導入先では「ゲートは緑・記録だけが黙って止まる」形で 2 回観測された。このモードは
#   下の resolve_toolkit を load_resolved_toolkit 経由で**そのまま**使い（解決順も診断も
#   fail closed も同じ。別実装を持たない）、
#   解決したプラグインルートを stdout へ 1 行だけ出す。
#
#     root="$(bash scripts/codex-review.sh --print-toolkit-root)"   # 既定（=root と同じ）
#     bash scripts/codex-review.sh --print-toolkit-root=kv          # root= / version= / source= の 3 行
#
#   終了コード: 0 = 解決 / 1 = どこにも無い（stdout 空）/ 2 = 解決を拒否（stdout 空）。
#   2 は「FF_DEV_TOOLKIT_ROOT が不正」だけではない — 配置済みシムと解決先テンプレートの
#   版不整合、plugin version と agent-config.yaml の不一致、sidecar が指す先の version が
#   読めない場合も 2 で、env を設定していない cache 経路でも起きる（理由は stderr に出る）。
#   どれも別候補へ落ちない（既存の fail closed と同じ）。
#   stdout は契約、stderr（ℹ️ の診断行を含む）は契約ではない — 消費側は stdout だけを読む。
#   レビュー系オプションとの併用は拒否する（黙って片方を捨てない）。SKIP_CODEX_REVIEW は
#   レビューの逃がし弁であって解決の逃がし弁ではないので、このモードには効かない。
# ============================================================================

set -euo pipefail

SCRIPT_NAME="$(basename "$0")"

# ── オーケストレータの解決 ──────────────────────────────────────────────────────
#
# 探索順は FF_DEV_TOOLKIT_ROOT（環境変数）→ Codex plugin cache → Claude plugin
# cache → 同じディレクトリのサイドカー。両 cache を横断して semantic version の
# 最大を選び、同じ版が両方にある場合だけ Codex cache を優先する。どれも解決
# できなければ推測で走らずに落とす。
#
# **このファイルへパスを焼き込まない**理由が 3 つある:
#   1. 焼き込むと配置後のファイルがマシン固有になる。配置先の scripts/ は通常
#      git 管理下なので、開発者ごとに違う行がコミットされ、他人の環境や CI で壊れる。
#   2. 焼き込み値は toolkit のバージョン付きインストール先を含むため、更新のたびに
#      内容が変わる。冪等配置の比較が毎回不一致になり、利用者の .bak が上書きされ続ける。
#   3. 置換で生成するのはシェルコードなので、パスに含まれる & や $ や " が
#      構文を壊す（実測で `/a&b/` が代入行を破壊した）。
# サイドカーは**素のデータ 1 行**なので、どれも起こらない。読み取りも read -r だけで
# eval を通さない。
#
# cache の配置規約は
# ~/.{codex,claude}/plugins/cache/<marketplace>/ff-dev-toolkit/<version>/scripts/
# の形で、複数版が同居する（実測で 0.9.0 / 0.14.0 / 0.19.0）。候補は glob で
# 列挙するが、文字列順ではなく manifest の semantic version 最大を選ぶ。
# pre-release を含む版は安定版の探索対象にせず、診断を出してスキップする。
#
# ## 期待するパスの形（env とサイドカーで違わない）
#
# env とサイドカーは**慣習上の正規形が違う**: skill 群は FF_DEV_TOOLKIT_ROOT を
# プラグインルートとして定義し、setup-multi-agent.sh はサイドカーへ toolkit の
# scripts/ ディレクトリを書く。ただし解決はどちらも canonical_toolkit_root を
# 通るので、**両方の入口が両方の形を受け付ける**（実測で確認済み）。
# 診断はこの事実に合わせること — 「サイドカーには scripts/ を書く」のような
# 片側だけの案内は事実に反し、利用者を存在しない設定ミスの修正へ誘導する。
FF_ROOT_SIDECAR_NAME=".ff-dev-toolkit-root"
# サイドカーの位置は 1 箇所で組む。$0 は実行中に変わらないので再計算する理由が無く、
# 式を関数ごとに複製すると、配置規約を変えたとき片方だけ追従する形が生まれる
# （Issue #769 項目 2）。
FF_ROOT_SIDECAR_PATH="$(dirname "$0")/${FF_ROOT_SIDECAR_NAME}"

# サイドカーの 1 行目を**生の値**で返す（既定値・表示用の置換は呼び出し側の責務）。
# read は末尾に改行が無いファイルで「値を代入したうえで EOF により非 0」を返す。
# その非 0 で `|| value=""` と空へ倒すと、手書きの使えるサイドカーを「使えない」と
# 誤判定する（Issue #807 で 2 箇所直した当のバグ）。読み取りを 1 本に寄せるのは、
# 同型の分岐が将来また片方だけ直る余地を消すため（Issue #769 項目 2）。
# 空ファイル・読めないファイルでは空を出力する（存在・権限の検査は呼び出し側で行う）。
read_sidecar_first_line() {
  local value=""
  IFS= read -r value < "$1" || true
  printf '%s\n' "$value"
}

# 期待するパスの形を 1 か所で持つ。診断が「指す先に multi-agent.sh がありません」で
# 止まると、利用者は scripts/ を足すのか外すのかが判らず、設定ミスの解消に何往復も
# かかる（Issue #603 の実測）。形を明示すれば 1 回で終わる。
print_toolkit_path_shapes() {
  local indent="$1"
  echo "${indent}期待するパスの形（どちらの入口も両方の形を受け付けます）:" >&2
  echo "${indent}  FF_DEV_TOOLKIT_ROOT: プラグインルート（例 .../ff-dev-toolkit）— skill 群が使う正規形" >&2
  echo "${indent}  ${FF_ROOT_SIDECAR_NAME}: toolkit の scripts/ ディレクトリ（例 .../ff-dev-toolkit/scripts）— setup-multi-agent.sh が書く形" >&2
  echo "${indent}  条件は「multi-agent.sh を含むディレクトリ、または（それが scripts/ の場合）その親」です。" >&2
}

toolkit_manifest_version() {
  local root="$1" manifest="${1}/.claude-plugin/plugin.json" version
  [ -r "$manifest" ] || return 1
  version="$(sed -nE 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/p' "$manifest")"
  [ "$(printf '%s\n' "$version" | grep -c . || true)" -eq 1 ] || return 1
  printf '%s\n' "$version"
}

semver_is_newer() {
  # toolkit_manifest_version を通過した X.Y.Z だけを受け取る。
  local candidate="$1" current="$2" ca cb cc oa ob oc
  IFS=. read -r ca cb cc <<<"$candidate"
  IFS=. read -r oa ob oc <<<"$current"
  ca=$((10#$ca)); cb=$((10#$cb)); cc=$((10#$cc))
  oa=$((10#$oa)); ob=$((10#$ob)); oc=$((10#$oc))
  [ "$ca" -gt "$oa" ] \
    || { [ "$ca" -eq "$oa" ] && [ "$cb" -gt "$ob" ]; } \
    || { [ "$ca" -eq "$oa" ] && [ "$cb" -eq "$ob" ] && [ "$cc" -gt "$oc" ]; }
}

canonical_toolkit_root() {
  local input="$1"
  if usable_orchestrator "${input}/scripts/multi-agent.sh"; then
    (cd "$input" && pwd -P)
  elif usable_orchestrator "${input}/multi-agent.sh"; then
    (cd "${input}/.." && pwd -P)
  else
    return 1
  fi
}

select_cache_toolkit() {
  local cache_root="$1" root version best_root="" best_version=""
  SELECTED_CACHE_ROOT=""
  SELECTED_CACHE_VERSION=""
  [ -d "$cache_root" ] || return 1
  for root in "$cache_root"/*/ff-dev-toolkit/*; do
    [ -d "$root" ] || continue
    version="$(toolkit_manifest_version "$root" 2>/dev/null || true)"
    if [ -z "$version" ]; then
      echo "WARNING: ff-dev-toolkit cache 候補の安定版 version を読めないためスキップします: $root" >&2
      continue
    fi
    if ! usable_orchestrator "$root/scripts/multi-agent.sh"; then
      echo "WARNING: ff-dev-toolkit cache 候補の multi-agent.sh が不正なためスキップします: version=$version root=$root" >&2
      continue
    fi
    if [ -z "$best_version" ] || semver_is_newer "$version" "$best_version"; then
      best_root="$root"
      best_version="$version"
    fi
  done
  [ -n "$best_root" ] || return 1
  SELECTED_CACHE_ROOT="$best_root"
  SELECTED_CACHE_VERSION="$best_version"
}

verify_toolkit_identity() {
  local root="$1" version="$2" config_version template
  template="$root/scripts/templates/codex-review.sh"
  # 比較は行末を正規化して行う（Issue #658）。Windows の plugin cache はテンプレートを
  # CRLF で持つことがあり、setup は配置時に LF へ正規化する。byte 比較のままだと、
  # 内容が同一の正規構成（CRLF cache + LF 配置済みシム）を「版が一致しません」で
  # 拒否してレビューが 1 件も走らない。正規化は**行末の CR だけ**を落とす —
  # `tr -d '\r'` は本文中の CR も消すため、CR の有無だけ違う別内容を同一版と
  # 誤認する（setup 側 setup_strip_cr と同じ判定）。
  if [ ! -r "$template" ] || ! cmp -s <(sed $'s/\r$//' "$0") <(sed $'s/\r$//' "$template"); then
    echo "ERROR: 解決した ff-dev-toolkit と配置済み shim の版が一致しません。" >&2
    echo "       toolkit=${root} version=${version}" >&2
    echo "       bash ${root}/scripts/setup-multi-agent.sh を再実行してください。" >&2
    return 2
  fi
  config_version="$(sed -nE 's/^toolkit_version:[[:space:]]*"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/p' "$root/scripts/agent-config.yaml" 2>/dev/null || true)"
  if [ "$config_version" != "$version" ]; then
    echo "ERROR: ff-dev-toolkit の plugin version と agent-config.yaml が一致しません。" >&2
    echo "       plugin=${version} agent-config=${config_version:-missing} root=${root}" >&2
    return 2
  fi
}

# 候補が「本当に multi-agent.sh か」まで見る。存在だけを見ると、0 バイトのファイルや
# 無関係なスクリプトを掴んで **rc=0・出力ゼロ** で終わる — 元のバグと同じ signature に
# なる（実測: 0 バイトの multi-agent.sh を指すと、シムは何も出さず成功した）。
usable_orchestrator() {
  local f="$1"
  [ -f "$f" ] && [ -r "$f" ] && [ -s "$f" ] || return 1
  # オーケストレータであることの印。--task の 3 値は multi-agent.sh の中核契約で、
  # 別スクリプトに偶然含まれることは考えにくい。
  grep -q -- "--task" "$f" && grep -q -- "implement" "$f"
}

resolve_toolkit() {
  local root version sidecar sidecar_value="" codex_cache claude_cache
  local codex_root="" codex_version="" claude_root="" claude_version=""
  RESOLVED_ORCHESTRATOR=""
  RESOLVED_TOOLKIT_ROOT=""
  RESOLVED_TOOLKIT_VERSION=""
  RESOLVED_TOOLKIT_SOURCE=""
  if [ -n "${FF_DEV_TOOLKIT_ROOT:-}" ]; then
    # skill 群は FF_DEV_TOOLKIT_ROOT を**プラグインルート**として定義し
    # ${FF_DEV_TOOLKIT_ROOT}/scripts/multi-agent.sh を叩く。scripts/ を直接指す
    # 使い方も許すため両方を候補にする（前者が正規形）。
    if ! root="$(canonical_toolkit_root "$FF_DEV_TOOLKIT_ROOT")"; then
      echo "ERROR: FF_DEV_TOOLKIT_ROOT が設定されていますが、使える multi-agent.sh がありません。" >&2
      echo "       指定: ${FF_DEV_TOOLKIT_ROOT}" >&2
      echo "       明示指定を黙って無視して別の toolkit で走ることはしません。" >&2
      print_toolkit_path_shapes "       "
      return 2
    fi
    version="$(toolkit_manifest_version "$root" 2>/dev/null || true)"
    [ -n "$version" ] || { echo "ERROR: FF_DEV_TOOLKIT_ROOT の plugin version を読めません: $root" >&2; return 2; }
    set_resolved_toolkit "$root" "$version" "explicit"
    return $?
  fi

  codex_cache="${CODEX_HOME:-${HOME}/.codex}/plugins/cache"
  claude_cache="${CLAUDE_CONFIG_DIR:-${HOME}/.claude}/plugins/cache"
  if select_cache_toolkit "$codex_cache"; then
    codex_root="$SELECTED_CACHE_ROOT"
    codex_version="$SELECTED_CACHE_VERSION"
  fi
  if select_cache_toolkit "$claude_cache"; then
    claude_root="$SELECTED_CACHE_ROOT"
    claude_version="$SELECTED_CACHE_VERSION"
  fi
  if [ -n "$codex_root" ] && { [ -z "$claude_root" ] || ! semver_is_newer "$claude_version" "$codex_version"; }; then
    set_resolved_toolkit "$codex_root" "$codex_version" "codex-cache"
    return $?
  fi
  if [ -n "$claude_root" ]; then
    set_resolved_toolkit "$claude_root" "$claude_version" "claude-cache"
    return $?
  fi

  sidecar="$FF_ROOT_SIDECAR_PATH"
  if [ -f "$sidecar" ]; then
    sidecar_value="$(read_sidecar_first_line "$sidecar")"
    if [ -n "$sidecar_value" ] && root="$(canonical_toolkit_root "$sidecar_value")"; then
      version="$(toolkit_manifest_version "$root" 2>/dev/null || true)"
      [ -n "$version" ] || { echo "ERROR: sidecar が指す toolkit の version を読めません: $root" >&2; return 2; }
      set_resolved_toolkit "$root" "$version" "sidecar"
      return $?
    fi
  fi

  return 1
}

sidecar_recorded_value() {
  # 記録値そのものを診断へ出す。パスの形の違いは「何が書いてあるか」を見せないと
  # 判断できない。空行・欠落は空文字ではなく明示の印にする（診断が黙って欠ける形になるため）。
  # 生の読み取りは read_sidecar_first_line に一本化し、ここは診断用の既定値
  # （(empty) / 読み取り権限なし）の付与だけを担う。読めない場合は空と区別する
  # （cat も失敗する状況なので、利用者を chmod へ向ける必要がある）。
  local sidecar="$1" value=""
  if [ -f "$sidecar" ]; then
    if [ ! -r "$sidecar" ]; then
      printf '%s\n' "(読み取り権限がありません)"
      return 0
    fi
    value="$(read_sidecar_first_line "$sidecar")"
  fi
  [ -n "$value" ] || value="(empty)"
  printf '%s\n' "$value"
}

warn_env_masked_sidecar() {
  # FF_DEV_TOOLKIT_ROOT が使えないサイドカーを覆い隠す事故だけを告知する。
  # 実測（Issue #603）: 同じシェルで FF_DEV_TOOLKIT_ROOT を export したまま成功したため
  # 「サイドカーは正しい」と誤って結論し、env の無い次のシェル（= 実際の運用）で失敗した。
  #
  # **cache 経路は対象にしない。** env はシェルスコープなので「ここでは在るが次では無い」が
  # 成立するのに対し、plugin cache はマシンに永続していて同じマシンの次のシェルでも同じように
  # 解決する。cache が勝った実行で「この経路が無い環境では失敗します」と言うのは端的に嘘で、
  # 利用者が設定していない env の名前まで挙げることになる。しかも cache はサイドカーより
  # 先に引かれるので、plugin の版が上がって旧 cache ディレクトリが消えた消費リポジトリでは
  # **毎回**鳴る（実測）。常時鳴る警告は、同じブロックが運んでいる本物の案内ごと
  # 読み飛ばされるようにするだけで、埋めたはずの診断の穴より悪い。
  #
  # **「別の toolkit を指している」だけでも鳴らさない。** env がサイドカーに勝つのは
  # toolkit を移動・更新したときの正規の上書き手段で、開発 clone と cache を併用する構成では
  # 両者が食い違うのが普通。鳴らすのは「env の無い次のシェルで確実に失敗する値」だけ。
  #
  # 判定は canonical_toolkit_root（= 使えるオーケストレータを指しているか）までで、版や
  # 配置済みテンプレートの同一性（verify_toolkit_identity）は見ない。**据え置きの判断**
  # （Issue #769 項目 4 で再確認。結論と根拠の正本は Issue #742 のレビューコメント）:
  # そこまで見ると、テンプレートを編集中の開発 clone を指すサイドカーで毎回鳴ることになり、
  # 上で避けたはずの «常時鳴る警告» を自分で作る。この境界の外（版不一致の覆い隠し）は
  # 告知の対象外である。
  #
  # 告知であって上書きではないので rc は変えない。
  local sidecar_value
  [ "$RESOLVED_TOOLKIT_SOURCE" = "explicit" ] || return 0
  [ -f "$FF_ROOT_SIDECAR_PATH" ] || return 0
  # 生の読み取りは read_sidecar_first_line に一本化（末尾改行なしの非 0 で値を捨てて
  # いた Issue #807 の誤警告は、あちらのコメントを参照）。空ファイル・読み取り不能では
  # 空が返るため、従来どおり警告になる。
  sidecar_value="$(read_sidecar_first_line "$FF_ROOT_SIDECAR_PATH")"
  if [ -n "$sidecar_value" ] && canonical_toolkit_root "$sidecar_value" >/dev/null 2>&1; then
    return 0
  fi
  echo "WARNING: 今回は FF_DEV_TOOLKIT_ROOT で解決しましたが、サイドカーは使える toolkit を指していません。" >&2
  echo "         サイドカー: ${FF_ROOT_SIDECAR_PATH}" >&2
  echo "         記録値: $(sidecar_recorded_value "$FF_ROOT_SIDECAR_PATH")" >&2
  echo "         サイドカーはマシン固有のファイルです。配置先が git 管理下なら ${FF_ROOT_SIDECAR_NAME} を .gitignore へ追加してください。" >&2
  print_toolkit_path_shapes "         "
  echo "         FF_DEV_TOOLKIT_ROOT はこのシェル限りなので、export していないシェルや CI では" >&2
  echo "         plugin cache が無いかぎり失敗します。" >&2
  echo "         bash <toolkit>/scripts/setup-multi-agent.sh を再実行して記録し直してください。" >&2
  return 0
}

set_resolved_toolkit() {
  local root="$1" version="$2" source="$3"
  case "$root$version$source" in
    *$'\t'*|*$'\n'*)
      echo "ERROR: ff-dev-toolkit の解決結果に区切り文字を含むため拒否します: root=$root" >&2
      return 2 ;;
  esac
  verify_toolkit_identity "$root" "$version" || return $?
  RESOLVED_ORCHESTRATOR="$root/scripts/multi-agent.sh"
  RESOLVED_TOOLKIT_ROOT="$root"
  RESOLVED_TOOLKIT_VERSION="$version"
  RESOLVED_TOOLKIT_SOURCE="$source"
}

load_resolved_toolkit() {
  local resolve_rc=0
  resolve_toolkit || resolve_rc=$?
  if [ "$resolve_rc" -eq 2 ]; then
    return 2
  fi
  if [ "$resolve_rc" -ne 0 ]; then
    echo "ERROR: multi-agent.sh が見つかりません。" >&2
    echo "       探索順: FF_DEV_TOOLKIT_ROOT → Codex/Claude cache の最大版（同版は Codex 優先）→ ${FF_ROOT_SIDECAR_PATH}" >&2
    if [ -f "$FF_ROOT_SIDECAR_PATH" ]; then
      echo "       サイドカーは在りますが、指す先に multi-agent.sh がありません" >&2
      echo "       記録値: $(sidecar_recorded_value "$FF_ROOT_SIDECAR_PATH")" >&2
      echo "       （toolkit を更新・移動した場合は setup-multi-agent.sh を再実行してください）。" >&2
    else
      echo "       サイドカーがありません。setup-multi-agent.sh を実行して配置し直すか、" >&2
      echo "       FF_DEV_TOOLKIT_ROOT を toolkit のプラグインルートへ向けてください。" >&2
    fi
    print_toolkit_path_shapes "       "
    return "$resolve_rc"
  fi
  echo "ℹ️  ff-dev-toolkit version=${RESOLVED_TOOLKIT_VERSION} source=${RESOLVED_TOOLKIT_SOURCE} root=${RESOLVED_TOOLKIT_ROOT}" >&2
  warn_env_masked_sidecar
}

# ── diff サイズを測る基準 ref の解決 ──────────────────────────────────────────
#
# 委譲先（multi-agent.sh）はレビュー対象の base を `resolve_base_branch_ref` に通し、
# ローカル `<base>` が無い / stale なときは `origin/<base>` を使う。歯止め
# （CODEX_REVIEW_MIN_LINES / CODEX_REVIEW_MAX_DIFF_BYTES）を**生の `--base` の値**で
# 測ると、レビューされる範囲と測る範囲が別物になる:
#   - ローカル `<base>` の無いクローン（`git clone --branch <feature>` / CI / 使い捨て
#     クローン）では `git diff develop...HEAD` 自体が失敗し、「diff を測れませんでした」で
#     exit 2 になる。委譲先は origin/develop で普通にレビューできるのに、1 つも届かない
#   - ローカル `<base>` が stale なときは、古い基準で測って新しい基準でレビューする
#     （課金を抑えている前提が静かに崩れる）
#
# 解決は**委譲先と同じ実装をそのまま呼ぶ**。ここに写しを持つと必ず drift し、
# 「測る基準とレビューする基準が違う」という今直している事故をもう一度作る。
# toolkit の解決は委譲直前まで遅らせる設計（歯止めによる skip は toolkit 無しでも
# 成立する）なので、ここでは**見つかったときだけ**使い、見つからないときは生の値のまま
# 測る。toolkit が無いことの名乗りと rc=2 は従来どおり末尾の委譲段が担う（順序を変えない）。
resolve_base_ref_for_size() {
  local base="$1" adapter resolved raw_resolved base_rc
  if [ -z "${RESOLVED_TOOLKIT_ROOT:-}" ]; then
    # ERROR は委譲段が出す（同じ ERROR を 2 回出すと、どちらが本番の判定か分からなく
    # なる）。ここでは stderr を捨てて再解決だけ試し、結果の告知は下の 3 経路で
    # **WARNING として**揃える（粒度が違うので二重告知にはならない）。
    resolve_toolkit >/dev/null 2>&1 || true
  fi
  if [ -n "${RESOLVED_TOOLKIT_ROOT:-}" ]; then
    adapter="${RESOLVED_TOOLKIT_ROOT}/scripts/adapters/adapter-common.sh"
    if [ -r "$adapter" ]; then
      # サブシェルで source する。1800 行のユーティリティをシムの名前空間へ持ち込むと、
      # 以降の実装が「シムに無い関数」に気づかず依存できてしまう。
      # 今の adapter-common.sh は関数定義だけなので stdout は汚さないが、シムは単体で
      # 配布され、実行時にどの版の adapter が source されるかは分からない。将来 source が
      # stdout へ 1 行でも出せば解決値が複数行になり、`git diff <2 行>...HEAD` が落ちて
      # exit 2 —— まさにこの関数が直している事故と同じ形になる。最終行だけを採る。
      # rc と tail は分ける。`|` の途中に置くと、**pipefail が無い環境では** resolve の
      # 非 0 が tail の 0 に消える（pipefail 下では非 0 が保たれる）。このファイル冒頭は
      # `set -euo pipefail` を立てているが、シムは単体で配布され pipefail の無い呼び出し元
      # から source / 実行されうるので、pipefail に依存しない形にしておく。
      base_rc=0
      raw_resolved="$( . "$adapter" && resolve_base_branch_ref "$base" )" || base_rc=$?
      if [ "$base_rc" -eq 0 ]; then
        resolved="$(printf '%s\n' "$raw_resolved" | tail -n 1)"
        if [ -n "$resolved" ]; then
          printf '%s\n' "$resolved"
          return 0
        fi
      fi
      echo "WARNING: base ref を委譲先と同じ実装で解決できませんでした: ${adapter}" >&2
      echo "         生の値 ${base} で diff サイズを測ります（委譲先が origin/${base} を使う場合、測る範囲がレビュー範囲とずれます）。" >&2
    else
      # adapter が無い / 読めない toolkit（`resolve_base_branch_ref` を持たない旧版など）。
      # ここで生の値へ落とすのは正しい —— 委譲先にも解決実装が無いのだから、生の値で測る方が
      # 委譲先のレビュー範囲と一致する。ただし**黙って**落とすと、歯止めの基準がどちらだったか
      # 後から分からない。上の「解決に失敗」と同型の WARNING を出してから落とす（ハードエラーには
      # しない —— 測れること自体は toolkit 無しでも成立する）。
      echo "WARNING: base ref の解決実装が見つかりませんでした: ${adapter}" >&2
      echo "         生の値 ${base} で diff サイズを測ります（委譲先が origin/${base} を使う場合、測る範囲がレビュー範囲とずれます）。" >&2
    fi
  else
    # toolkit そのものを解決できなかった経路。ここを**黙って**落とすと、歯止め
    # （CODEX_REVIEW_MIN_LINES / CODEX_REVIEW_MAX_DIFF_BYTES）は委譲より**前**に走って
    # skip → exit 0 で終わりうるため、「どの基準で測って skip したか」がどこにも残らない
    # （委譲段の ERROR には到達しない）。上の 2 経路と同型の WARNING を出してから落とす
    # （ハードエラーにはしない —— 測れること自体は toolkit 無しでも成立する）。
    echo "WARNING: toolkit を解決できなかったため base ref を解決できません。" >&2
    echo "         生の値 ${base} で diff サイズを測ります（委譲先が origin/${base} を使う場合、測る範囲がレビュー範囲とずれます）。" >&2
  fi
  printf '%s\n' "$base"
}

usage() {
  cat >&2 <<USAGE
${SCRIPT_NAME} — Codex cross-model レビュー（multi-agent.sh への薄いシム）

  --base <branch>       差分の基準ブランチ
  --staged             staged index だけをレビュー（--base と排他）
  --reviewers a,b,c     観点をカンマ区切りで指定（--perspective へ展開される）
  --exclude-reviewers a,b,c
                        観点をカンマ区切りで除外（--exclude-perspective へ展開される）
  --exclude-cli <name>  その CLI をプランから外す（繰り返し可。--exclude-cli へ透過）
  --list-reviewers      利用できる review 観点を一覧表示する
  --print-toolkit-root[=root|kv]
                        レビューせず、解決した ff-dev-toolkit のプラグインルートを
                        stdout へ 1 行で出して終わる（消費側の hook / ゲートが
                        サイドカーを直接読まずに toolkit の任意スクリプトを解決する
                        ための契約。解決順・fail closed はレビュー時と同じ）。
                        =kv は root= / version= / source= の 3 行。レビュー系オプションと排他。
                        終了コード: 0=解決 / 1=見つからない（stdout 空）/ 2=解決を拒否
                        （FF_DEV_TOOLKIT_ROOT が不正・配置済みシムとの版不整合など。stdout 空）
  --review-context-file <path>
                        前回レビューと通過済みゲートの証拠を review prompt へ渡す。
                        acceptance-criteria 観点向けに Issue / PR 本文の AC 記載を
                        事前投入する経路でもある（read-only 起動では gh を呼べない
                        ため、投入があれば観点はそれを第一の照合ソースに使う）

    ⚠ --reviewers / --exclude-reviewers の観点名は toolkit の perspective 名であり、旧ラッパーが使っていた
      Claude エージェント名とは**別体系**。存在しない名前は multi-agent.sh が
      非 0 で拒否する（黙って既定へ落ちることはない）。
        旧 code-reviewer          → code-review
        旧 silent-failure-hunter  → error-handler-hunt
        旧 type-design-analyzer   → type-design-analysis
        旧 comment-analyzer       → comment-analysis
        旧 pr-test-analyzer       → test-analysis
        旧 code-simplifier        → code-simplification
      実在する review 観点: acceptance-criteria / code-review / code-simplification /
      comment-analysis / comprehensive-review / error-handler-hunt /
      security-analysis / test-analysis / type-design-analysis

  --all-perspectives    観点を絞らず全観点で実行する（前回レビューの Critical state を
                        復旧するときの明示手段。--reviewers / --exclude-reviewers /
                        --mode cross-model と排他で、CODEX_DEFAULT_REVIEWERS も無視する。
                        注意: 設定ファイルが mode: cross-model を指定しているリポジトリ
                        では、このフラグだけでは full review にならない — その場合は
                        --mode distributed を併用して設定を上書きする）
  --mode <mode>         distributed | cross-model（委譲先へそのまま渡す。設定ファイル
                        由来の mode をコマンドラインから上書きする用途）
  --timeout <秒>        CLI ごとの制限時間

  上記は --opt=value 形式でも渡せる。パッケージマネージャが挟む --
  （pnpm は透過、npm は除去）は位置を問わず読み飛ばす。
  --dry-run             実行せずプランだけ表示する
  --fresh               前回の出力ディレクトリの中身を <dir>/.prev-<timestamp>/ へ退避する（実行中 lock は残す）
  --resume              前回と同一入力の成功結果を再利用し、失敗・timeout 分だけ再実行する
                        （--fresh と排他。排他検査は委譲先が行う）
  --help                このヘルプ

  ここに無いフラグは受け付けない（allowlist 方式）。黙って素通しすると、委譲先に
  無いフラグが案内なしで落ち、シム側写像との二重解釈も生まれるため、非 0 で拒否して
  multi-agent.sh の直呼びを案内する。

  SKIP_CODEX_REVIEW=1   レビューを実行せず成功終了する

旧ラッパーの env は写して 1 行通知する（黙って無視しない）:
  CODEX_MODEL             → MULTI_AGENT_MODEL_CODEX_CLI（新が設定済みなら新を優先）
  CODEX_DEFAULT_REVIEWERS → 既定の観点（--reviewers を明示した場合はそちらが優先）
  CODEX_REASONING_EFFORT  → MULTI_AGENT_CODEX_REASONING_EFFORT
                            （新が設定済みなら新を優先）

モデル指定は MULTI_AGENT_MODEL_CODEX_CLI / MULTI_AGENT_CODEX_PROFILE、
effort 単体指定は MULTI_AGENT_CODEX_REASONING_EFFORT を使う。
ここに無いオプションは、直接 multi-agent.sh を呼んで指定する:
  bash <toolkit>/scripts/multi-agent.sh --task review --cli codex-cli ...
USAGE
}

# ── 引数の解釈 ──────────────────────────────────────────────────────────────────
ORCH_ARGS=(--task review --cli codex-cli)
REVIEWERS_GIVEN=0
EXCLUDE_REVIEWERS_GIVEN=0
ALL_PERSPECTIVES_GIVEN=0
# --mode は委譲先の実在フラグ（distributed | cross-model）。値は矛盾検査
# （--all-perspectives × cross-model）にだけ使い、委譲は verbatim。
MODE_VALUE=""
TIMEOUT_GIVEN=0
LIST_ONLY=0
# --print-toolkit-root。値は出力形式（root | kv）。空 = 指定なし。
PRINT_ROOT_FORMAT=""
# diff サイズの歯止めを測るための基準。--base が明示されたときだけ埋まる。
BASE_FOR_SIZE=""
STAGED_GIVEN=0
# --dry-run。委譲先はプランを出すだけで CLI を 1 本も起動しないので、CLI の実在を
# 要求するゲートはこのモードでは掛けない（下の codex 実在検査で参照する）。
DRY_RUN_GIVEN=0
# 利用者が `--exclude-cli codex-cli` を渡したか。下の codex 実在検査で、固定の
# `--cli codex-cli` を外す対象からこの回を除くために見る。
EXCLUDE_CODEX_GIVEN=0

append_review_context_file() {
  local context_file="$1" context_bytes context
  if [ ! -f "$context_file" ] || [ ! -r "$context_file" ]; then
    echo "ERROR: --review-context-file を読めません: $context_file" >&2
    exit 2
  fi
  context_bytes="$(wc -c <"$context_file" | tr -d ' ')"
  if ! printf '%s\n' "$context_bytes" | grep -Eq '^[0-9]+$' \
    || [ "$context_bytes" -eq 0 ] || [ "$context_bytes" -gt 65536 ]; then
    echo "ERROR: --review-context-file は 1〜65536 bytes にしてください: ${context_bytes:-unknown}" >&2
    exit 2
  fi
  context="$(cat "$context_file")"
  [ -n "$context" ] || { echo "ERROR: --review-context-file が空です" >&2; exit 2; }
  ORCH_ARGS+=(--description "$context")
}

# 観点リスト（カンマ区切り）を --perspective の繰り返しへ展開する。
# --reviewers と CODEX_DEFAULT_REVIEWERS の**両方**から呼ぶため関数にしてある。
# 片方にしか写像を掛けないと、env 経由の指定だけが旧名のまま委譲されて
# 「perspective が存在しない」で 1 件も走らない。
# 第 2 引数はエラーメッセージ用の呼び出し元表示。
# $3 は付けるフラグ（--perspective / --exclude-perspective）。包含と除外で写像表を
# 共有する。別々に持つと、片方だけ改称に追従しない形が生まれる。
append_perspectives() {
  # `a, b, c` を許容する。除去しないと 2 件目以降が ' b' となり、写像表の case を
  # 1 つも通らないまま**通知も出ずに**委譲され、オーケストレータ側で
  # 「perspective ' comment-analyzer' does not exist」で全滅する（写像すると
  # 約束した名前が、写像されずに存在しない名前として拒否される形）。
  _list="${1//[[:space:]]/}"
  _origin="$2"
  case "$_list" in
    ""|*,,*|,*|*,)
      echo "ERROR: ${_origin} の値が空、または空の要素を含んでいます: '${_list}'" >&2
      echo "       観点を 1 つ以上、カンマ区切りで指定してください（例: code-review）。" >&2
      exit 2 ;;
  esac
  while [ -n "$_list" ]; do
    _item="${_list%%,*}"
    if [ "$_item" = "$_list" ]; then _list=""; else _list="${_list#*,}"; fi
    [ -n "$_item" ] || continue
    # 旧ラッパーが使っていた Claude エージェント名を、toolkit の perspective 名へ
    # 写す。ヘルプに対応表を載せただけでは足りない — 既存の運用手順やコピペされた
    # コマンドはそのまま旧名を渡してくるので、変換しないと「対応表は示すのに
    # 実際には拒否される」形になる。**黙って読み替えず 1 行通知する**（利用者の
    # 指定と実際に走った観点が食い違ったまま気づけない状態にしない）。
    # toolkit が文書化している改称は 6 件。3 件だけ写すと、文書どおりの
    # 6 件指定コマンドが未対応の 1 件目で拒否され**レビューが 1 件も走らない**
    # （実測: `perspective 'comment-analyzer' does not exist` で rc=1）。
    # 対応表は COPILOT_AGENTS.md / REVIEW_AGENT_CREATION_GUIDE.md と同じ 6 件。
    case "$_item" in
      code-reviewer)         _mapped="code-review" ;;
      silent-failure-hunter) _mapped="error-handler-hunt" ;;
      type-design-analyzer)  _mapped="type-design-analysis" ;;
      comment-analyzer)      _mapped="comment-analysis" ;;
      pr-test-analyzer)      _mapped="test-analysis" ;;
      code-simplifier)       _mapped="code-simplification" ;;
      *)                     _mapped="$_item" ;;
    esac
    if [ "$_mapped" != "$_item" ]; then
      echo "ℹ️  旧観点名 '${_item}' を '${_mapped}' として解釈しました（perspective 名へ改称済み）。" >&2
    fi
    ORCH_ARGS+=("${3:---perspective}" "$_mapped")
  done
}

while [ $# -gt 0 ]; do
  case "$1" in
    --)
      # pnpm は版によって `pnpm run x -- --opt` の `--` をスクリプトへ**透過する**
      # （実測: pnpm 9.15.9 で argv[1] が '--'。npm は除去する）。各リポジトリの手順書は
      # `pnpm code-review:codex -- --base develop` の形なので、これを不明な引数として
      # 拒否すると**文書どおりのコマンドが動かない**。`--` は利用者が渡した引数ではなく
      # パッケージマネージャが挟むものなので、「黙って捨てない」の対象として不適切。
      # 位置は pnpm の版や呼び出し方で変わりうるので、先頭に限定せず読み飛ばす。
      shift
      ;;
    --base=*|--timeout=*|--mode=*)
      # GNU 慣用の `--opt=value`。旧ラッパーが受けていたので手順書やスクリプトに残りうる。
      _opt="${1%%=*}"
      _val="${1#*=}"
      if [ -z "$_val" ]; then
        # 空値を読み飛ばすと黙って既定（自動検出の base / 既定 timeout）で走る。
        echo "ERROR: ${_opt} には値が必要です。" >&2
        usage
        exit 2
      fi
      [ "$_opt" = "--base" ] && BASE_FOR_SIZE="$_val"
      [ "$_opt" = "--timeout" ] && TIMEOUT_GIVEN=1
      [ "$_opt" = "--mode" ] && MODE_VALUE="$_val"
      ORCH_ARGS+=("$_opt" "$_val")
      shift
      ;;
    --review-context-file=*)
      append_review_context_file "${1#*=}"
      shift
      ;;
    --reviewers=*)
      # 空値・空要素は append_perspectives が拒否する（空白区切り側と同じ経路）。
      append_perspectives "${1#*=}" "--reviewers"
      REVIEWERS_GIVEN=1
      shift
      ;;
    --base|--timeout|--mode)
      if [ $# -lt 2 ]; then
        echo "ERROR: ${1} には値が必要です。" >&2
        usage
        exit 2
      fi
      [ "$1" = "--base" ] && BASE_FOR_SIZE="$2"
      [ "$1" = "--timeout" ] && TIMEOUT_GIVEN=1
      [ "$1" = "--mode" ] && MODE_VALUE="$2"
      ORCH_ARGS+=("$1" "$2")
      shift 2
      ;;
    --review-context-file)
      if [ $# -lt 2 ] || [ -z "$2" ]; then
        echo "ERROR: --review-context-file には値が必要です。" >&2
        exit 2
      fi
      append_review_context_file "$2"
      shift 2
      ;;
    --staged)
      STAGED_GIVEN=1
      ORCH_ARGS+=(--staged)
      shift
      ;;
    --dry-run)
      DRY_RUN_GIVEN=1
      ORCH_ARGS+=(--dry-run)
      shift
      ;;
    --fresh)
      ORCH_ARGS+=(--fresh)
      shift
      ;;
    --resume)
      # 失敗・timeout からの復旧経路（成功結果を再利用して残りだけ再実行する）。
      # 委譲先のフラグをそのまま渡す。--fresh との排他は委譲先が明確なメッセージ付きで
      # 拒否するので、ここに検査の 2 つ目のコピーは持たない。
      ORCH_ARGS+=(--resume)
      shift
      ;;
    --all-perspectives)
      # 前回レビューの Critical state を復旧するための明示フラグ（Issue #970）。
      # multi-agent.sh に同名のフラグは無い — あちらでは「全観点」は観点フィルタの
      # **不在**（--perspective / --exclude-perspective / --mode cross-model を渡さない
      # unfiltered full review）で表現され、それがそのまま「新しい review series を
      # 開始する」正規の復旧手段になっている。そこでこのフラグは委譲 argv に何かを
      # 足すのではなく、「観点を絞る指定が一切無いこと」をシムが保証する形で写す。
      # verbatim に転送すると委譲先の Unknown option（rc=1）で落ちるだけで、案内どおりの
      # コマンドが通らないという Issue #970 の形が残る。
      ALL_PERSPECTIVES_GIVEN=1
      shift
      ;;
    --print-toolkit-root|--print-toolkit-root=*)
      # 解決結果だけを出す契約（ヘッダの「解決結果だけを出す契約」参照）。形式は
      # root（既定）と kv の 2 つだけ。未知の形式を既定へ落とすと、消費側は
      # 「kv を指定したつもり」のまま 1 行を受け取り、パースが黙って空振りする。
      if [ "$1" = "--print-toolkit-root" ]; then
        _val="root"
      else
        _val="${1#*=}"
      fi
      case "$_val" in
        root|kv) PRINT_ROOT_FORMAT="$_val" ;;
        *)
          echo "ERROR: --print-toolkit-root の形式 '${_val}' は受け付けません（root | kv）。" >&2
          exit 2
          ;;
      esac
      shift
      ;;
    --list-reviewers)
      # 一覧はレジストリ（perspectives/<task>/*.md）が持つ。シムが独自の表を持つと、
      # 観点ファイルを足したときにシムだけ古くなる。委譲して出させる。
      # フラグにしておき、後段（skip / 旧 env / diff 閾値）を通さない。一覧を見たいだけ
      # なのに「--base が無い」で落ちたり、閾値次第で一覧が出ないまま成功終了したりする
      # のを避ける。
      LIST_ONLY=1
      shift
      ;;
    --exclude-cli)
      # 委譲先の同名オプションへそのまま渡す（観点ではなく CLI 名なので写像表は不要）。
      # このシムは `--cli codex-cli` を固定で足すため、`--exclude-cli codex-cli` は
      # multi-agent.sh 側の矛盾検査で非 0 になる — それが正しい帰結なので、ここで
      # 先回りして別のメッセージを出すことはしない（判定の正本を 2 つにしない）。
      # **この帰結は codex の有無で変わらない**: 下の codex 実在検査は `--dry-run` の回に
      # 固定の `--cli` を落とすが、`--exclude-cli codex-cli` が渡っている回は落とさない
      # （EXCLUDE_CODEX_GIVEN）。落とすと、同じコマンドが codex の導入状況で「矛盾エラー」
      # と「プラン表示」に分かれ、利用者から見て意味が環境依存になる。
      if [ $# -lt 2 ] || [ -z "$2" ]; then
        echo "ERROR: --exclude-cli には CLI 名が必要です（例: --exclude-cli grok-cli）。" >&2
        exit 2
      fi
      [ "$2" = "codex-cli" ] && EXCLUDE_CODEX_GIVEN=1
      ORCH_ARGS+=(--exclude-cli "$2")
      shift 2
      ;;
    --exclude-cli=*)
      _val="${1#*=}"
      if [ -z "$_val" ]; then
        echo "ERROR: --exclude-cli には CLI 名が必要です（例: --exclude-cli grok-cli）。" >&2
        exit 2
      fi
      [ "$_val" = "codex-cli" ] && EXCLUDE_CODEX_GIVEN=1
      ORCH_ARGS+=(--exclude-cli "$_val")
      shift
      ;;
    --exclude-reviewers)
      if [ $# -lt 2 ]; then
        echo "ERROR: --exclude-reviewers には値が必要です（例: --exclude-reviewers comment-analyzer）。" >&2
        exit 2
      fi
      append_perspectives "$2" "--exclude-reviewers" "--exclude-perspective"
      EXCLUDE_REVIEWERS_GIVEN=1
      shift 2
      ;;
    --exclude-reviewers=*)
      append_perspectives "${1#*=}" "--exclude-reviewers" "--exclude-perspective"
      EXCLUDE_REVIEWERS_GIVEN=1
      shift
      ;;
    --workdir|--workdir=*)
      # 委譲先に対応する概念が無い。黙って無視すると、指定したディレクトリとは別の
      # リポジトリの diff がレビューされる — 成果物を見ても取り違えに気づけない。
      echo "ERROR: ${SCRIPT_NAME} は --workdir を受け付けません。" >&2
      echo "       レビュー対象のリポジトリへ cd してから実行してください。" >&2
      exit 2
      ;;
    --reviewers)
      if [ $# -lt 2 ]; then
        echo "ERROR: --reviewers には値が必要です（例: --reviewers code-reviewer,silent-failure-hunter）。" >&2
        exit 2
      fi
      # カンマ区切りを 1 件ずつ --perspective へ展開する。multi-agent.sh 側は
      # --perspective の繰り返しで観点を絞る仕様なので、カンマのまま渡すと
      # 「そんな観点は無い」ではなく**観点名として 1 件**に見えてしまう。
      #
      # 分解は**パラメータ展開だけ**で行い、位置パラメータには触らない。初版は
      # IFS=',' にして `set -- $2 "${@:3}"` で並べ直していたが、これは後続の引数を
      # 連結してしまい（実測: `--reviewers a --timeout 420` が `--timeout 420` という
      # 1 引数になった）、対応しているはずの --timeout が「受け付けません」と
      # 拒否された。実 CLI 実行で初めて露見した — 単体で --reviewers を渡す
      # テストしか無かったため、他オプションと併用する形が検査されていなかった。
      # 空値・空要素を読み飛ばすと --perspective が 1 件も付かず、**既定の観点セットが
      # 黙って走る**。指定したつもりの利用者は、意図しない観点に課金される
      # （このファイルの冒頭が「黙って捨てない」と宣言している当のクラス）。
      append_perspectives "$2" "--reviewers"
      REVIEWERS_GIVEN=1
      shift 2
      ;;
    --help|-h)
      # --print-toolkit-root の後ろに --help が来た形は拒否する。素通しすると usage を
      # stderr へ出して exit 0・stdout 空になり、`root="$(... --print-toolkit-root)"` の
      # 消費側が「解決に成功して root が空」と読む唯一の経路になる。--help が先に来た形は
      # 従来どおり usage で終わる（--help は最初に見えた時点で他を見ずに終わる契約）。
      if [ -n "$PRINT_ROOT_FORMAT" ]; then
        echo "ERROR: --print-toolkit-root は --help と同時に指定できません。" >&2
        exit 2
      fi
      usage
      exit 0
      ;;
    *)
      # 復旧形に固定の `--cli codex-cli` は書かない。このシムが codex 不在の --dry-run で
      # 外そうとしている当の引数で、案内どおり付けると codex-cli の観点の fallback
      # 再割り当てが --cli フィルタに弾かれて「Execution plan is empty」へ戻る。codex
      # だけに絞る従来形は、codex が入っている環境で利用者が足す（Issue 1600）。
      echo "ERROR: ${SCRIPT_NAME} は '${1}' を受け付けません。" >&2
      echo "       対応オプションは --help で確認してください。" >&2
      echo "       それ以外は multi-agent.sh を直接呼んで指定してください:" >&2
      echo "         bash <toolkit>/scripts/multi-agent.sh --task review ${1} ..." >&2
      echo "       （codex だけに絞る従来の形は、codex が PATH にある環境で --cli codex-cli を足す。codex 不在の --dry-run でプランを見る回は付けない）" >&2
      exit 2
      ;;
  esac
done

if [ "$STAGED_GIVEN" -eq 1 ] && [ -n "$BASE_FOR_SIZE" ]; then
  echo "ERROR: --staged と --base は同時に指定できません。レビュー範囲をどちらか一方にしてください。" >&2
  exit 2
fi

# --all-perspectives は「観点を絞る指定が無い」ことの保証なので、絞る指定との併用は
# 矛盾として拒否する。黙ってどちらかを勝たせると、絞った側は「復旧が始まらない」、
# 全観点側は「指定した観点で走らない」のどちらかが無言で起き、成果物から判別できない。
if [ "$ALL_PERSPECTIVES_GIVEN" -eq 1 ] \
   && { [ "$REVIEWERS_GIVEN" -eq 1 ] || [ "$EXCLUDE_REVIEWERS_GIVEN" -eq 1 ]; }; then
  echo "ERROR: --all-perspectives は --reviewers / --exclude-reviewers と同時に指定できません。" >&2
  echo "       全観点で走らせる（Critical state の復旧を含む）か、観点を絞るかのどちらかにしてください。" >&2
  exit 2
fi

# cross-model は「1 観点を複数 CLI で見る」モードで、委譲先の unfiltered full review
# 判定（is_unfiltered_full_review_plan）が明示的に除外している = 復旧（新 series の
# 開始）が始まらない。--all-perspectives と併用されたら黙ってどちらかを勝たせず拒否
# する。設定ファイル側が mode: cross-model を持つリポジトリでは、--all-perspectives
# だけでは full review にならないため --mode distributed の併用で上書きする（--help
# 参照）。
if [ "$ALL_PERSPECTIVES_GIVEN" -eq 1 ] && [ "$MODE_VALUE" = "cross-model" ]; then
  echo "ERROR: --all-perspectives は --mode cross-model と同時に指定できません。" >&2
  echo "       cross-model は観点を 1 つに絞るモードで、全観点の復旧レビューになりません。" >&2
  echo "       復旧するなら --mode distributed を使うか、--mode を外してください。" >&2
  exit 2
fi

# ── 解決結果だけを出す経路（--print-toolkit-root） ─────────────────────────────
# レビュー系の指定と同時に来たら拒否する。黙ってレビューを捨てると「--base を渡した
# のにレビューが走らない」、黙って出力を捨てると「root を受け取れない」のどちらかが
# 無言で起き、消費側の hook はどちらも成果物から判別できない。
# 判定は「委譲 argv が固定の 4 要素（--task review --cli codex-cli）から増えていない
# こと」と、委譲 argv を経由しないフラグ（--list-reviewers / --all-perspectives）の
# 不在で行う。**委譲 argv を経由しないフラグを足したら、この条件へも列挙すること** —
# 忘れると新フラグとの併用が黙って素通りし、テストも緑のまま通る（tests/review-wrapper-shim
# の併用ケースは既知のフラグしか回さない）。
if [ -n "$PRINT_ROOT_FORMAT" ]; then
  if [ "${#ORCH_ARGS[@]}" -ne 4 ] || [ "$LIST_ONLY" -eq 1 ] || [ "$ALL_PERSPECTIVES_GIVEN" -eq 1 ]; then
    echo "ERROR: --print-toolkit-root はレビュー系のオプションと同時に指定できません。" >&2
    echo "       解決結果を得るときは単独で実行してください: bash ${SCRIPT_NAME} --print-toolkit-root" >&2
    exit 2
  fi
  # 解決は委譲時と同じ関数（診断も同じ。ERROR / ℹ️ はすべて stderr）。rc は
  # 0 = 解決 / 1 = 無い / 2 = 明示指定が不正 をそのまま返す。stdout は解決したときだけ書く。
  _resolve_rc=0
  load_resolved_toolkit || _resolve_rc=$?
  [ "$_resolve_rc" -eq 0 ] || exit "$_resolve_rc"
  case "$PRINT_ROOT_FORMAT" in
    kv)
      printf 'root=%s\nversion=%s\nsource=%s\n' \
        "$RESOLVED_TOOLKIT_ROOT" "$RESOLVED_TOOLKIT_VERSION" "$RESOLVED_TOOLKIT_SOURCE"
      ;;
    *)
      printf '%s\n' "$RESOLVED_TOOLKIT_ROOT"
      ;;
  esac
  exit 0
fi

# ── 逃がし弁 ────────────────────────────────────────────────────────────────────
# pre-commit 構成が使う実在のつまみ。尊重しないと「skip したはずのレビューが走る」。
# 一覧だけの経路。skip / 旧 env / diff 閾値のいずれも通さずに委譲して終わる。
if [ "$LIST_ONLY" -eq 1 ]; then
  _resolve_rc=0
  load_resolved_toolkit || _resolve_rc=$?
  [ "$_resolve_rc" -eq 0 ] || exit "$_resolve_rc"
  exec bash "$RESOLVED_ORCHESTRATOR" --task review --list-perspectives
fi

if [ "${SKIP_CODEX_REVIEW:-}" = "1" ]; then
  echo "ℹ️  SKIP_CODEX_REVIEW=1 のため Codex レビューをスキップします。" >&2
  exit 0
fi

# ── 旧ラッパーの env を写す ────────────────────────────────────────────────────
# 旧ラッパーは CODEX_* を解釈していた。シムはこれらを直接は使わないので、設定された
# まま黙って走ると「指定したつもりの設定が効いていない」状態になる（ユーザー設定を
# 黙って上書きしていた ACE-70-2 と同じ形の実害）。
#
# 当初は一律 exit 2 で拒否していた。しかし移行にあたって消費リポジトリを実測したら
# **7 本すべてがこれらを設定しており**、拒否はそのまま「移行できない」を意味した。
# そこで黙殺と拒否の間に**写像 + 1 行通知**を置く。写せないものだけ拒否を残す。
#
# Issue #419 で effort 単体の正規入口を追加したため、旧 CODEX_REASONING_EFFORT も
# 1:1 で写せる。新旧が併存するときは新しい名前を優先し、どちらを使ったか通知する。
if [ -n "${CODEX_MODEL:-}" ]; then
  # 「新しい設定」は MULTI_AGENT_MODEL_CODEX_CLI **だけではない**。codex-cli の
  # モデル指定は (model | profile) の 2 つが排他で、アダプタは両方が立っていると
  # 非 0 で落ちる（codex-cli-adapter.sh の排他検査）。
  # profile を見ずに model を写すと、**最も正しく移行した人**——モデルと effort を
  # プロファイルへ束ねた人——だけが、自分では
  # 設定していない MULTI_AGENT_MODEL_CODEX_CLI との衝突で落ちる。
  # レジストリ（multi-agent.sh の get_cli_model_env_vars codex-cli）が宣言するうち、
  # モデルを選ぶ 2 つをまとめて「新しいモデル設定」として扱う。
  _new_model_setting=""
  if [ -n "${MULTI_AGENT_MODEL_CODEX_CLI:-}" ]; then
    _new_model_setting="MULTI_AGENT_MODEL_CODEX_CLI='${MULTI_AGENT_MODEL_CODEX_CLI}'"
  elif [ -n "${MULTI_AGENT_CODEX_PROFILE:-}" ]; then
    _new_model_setting="MULTI_AGENT_CODEX_PROFILE='${MULTI_AGENT_CODEX_PROFILE}'"
  fi
  if [ -n "$_new_model_setting" ]; then
    # 黙って旧が勝つと、移行途中の環境で古い設定が生き残る。
    echo "ℹ️  CODEX_MODEL と新しいモデル設定が両方あります。" >&2
    echo "    新しい ${_new_model_setting} を使い、CODEX_MODEL は無視します。" >&2
  else
    export MULTI_AGENT_MODEL_CODEX_CLI="$CODEX_MODEL"
    echo "ℹ️  CODEX_MODEL='${CODEX_MODEL}' を MULTI_AGENT_MODEL_CODEX_CLI として解釈しました（env 名を改称済み）。" >&2
  fi
fi

# 未設定と「設定済みだが空」を区別する（`${VAR+x}`）。モデルの空値は「指定なし」と
# 読むのが自然だが、**リストの空値は「計算結果が 0 件」**であり、読み飛ばすと既定の
# 観点セットが黙って走って課金される。同じ値をコマンドラインから渡した
# `--reviewers ""` は拒否しているので、env だけ通すのは同一コミット内での不整合でもある。
if [ "${CODEX_DEFAULT_REVIEWERS+x}" = x ]; then
  if [ "$REVIEWERS_GIVEN" -eq 1 ]; then
    # 明示指定が env の既定に負けると、--reviewers を渡した意味が消える。
    echo "ℹ️  --reviewers が明示されているため、CODEX_DEFAULT_REVIEWERS は無視します。" >&2
  elif [ "$ALL_PERSPECTIVES_GIVEN" -eq 1 ]; then
    # env の既定観点を足すと unfiltered full review ではなくなり、--all-perspectives が
    # 保証するはずの復旧（新しい review series の開始）が黙って始まらない。
    echo "ℹ️  --all-perspectives が明示されているため、CODEX_DEFAULT_REVIEWERS は無視します。" >&2
  else
    # 通知は**検証を通ってから**出す。先に出すと「解釈しました」の直後に
    # 「値が空です」で落ち、解釈されたのかされていないのかが読み手に分からない。
    append_perspectives "$CODEX_DEFAULT_REVIEWERS" "CODEX_DEFAULT_REVIEWERS"
    echo "ℹ️  CODEX_DEFAULT_REVIEWERS='${CODEX_DEFAULT_REVIEWERS}' を既定の観点として解釈しました。" >&2
  fi
fi

# effort は新しい単独入口へ 1:1 で写す。新旧が同時指定された場合は新を優先する。
if [ -n "${CODEX_REASONING_EFFORT:-}" ]; then
  if [ "${MULTI_AGENT_CODEX_REASONING_EFFORT+x}" = x ]; then
    echo "ℹ️  CODEX_REASONING_EFFORT と MULTI_AGENT_CODEX_REASONING_EFFORT が両方あります。" >&2
    echo "    新しい MULTI_AGENT_CODEX_REASONING_EFFORT='${MULTI_AGENT_CODEX_REASONING_EFFORT}' を使い、CODEX_REASONING_EFFORT は無視します。" >&2
  else
    export MULTI_AGENT_CODEX_REASONING_EFFORT="$CODEX_REASONING_EFFORT"
    echo "ℹ️  CODEX_REASONING_EFFORT='${CODEX_REASONING_EFFORT}' を MULTI_AGENT_CODEX_REASONING_EFFORT として解釈しました（env 名を改称済み）。" >&2
  fi
fi

# 旧ラッパーの timeout env。--timeout と同義なので写す。
# **明示指定が env に負けないこと**。委譲先は last-wins なので、後から足すと
# `--timeout 999` を渡しても env の値で走る（実測: 999 を指定して 321 秒になった）。
_num_or_die() { # $1: 値, $2: env 名 → 正規化した値を stdout へ
  case "$1" in
    ''|*[!0-9]*)
      echo "ERROR: ${2} は 0 以上の整数で指定してください（受け取った値: '${1}'）。" >&2
      echo "       黙って既定へ落とすと、歯止めを設定したつもりで全件走ります。" >&2
      exit 2 ;;
  esac
  # 数字だけでも大きすぎると shell の整数比較が壊れる。`[ 30 -lt 999…9 ]` は
  # 「integer expression expected」を出して rc=2 を返し、if の条件としては**偽**に
  # なる — つまり歯止めが黙って効かなくなる（実測でレビューが全件走った）。
  if [ "${#1}" -gt 18 ]; then
    echo "ERROR: ${2} が大きすぎます（${#1} 桁）。18 桁以内で指定してください。" >&2
    echo "       この範囲を超えると整数比較が成立せず、歯止めが黙って効かなくなります。" >&2
    exit 2
  fi
  # "00" のような先頭ゼロを 10 進として正規化する。文字列比較で "0" と区別すると、
  # 実効値 0 の歯止めが有効化され、あらゆる diff がスキップされる。
  # **`printf '%d'` は使えない** — bash は先頭ゼロを 8 進として解釈するため、
  # `010` が 8 になり、`008` は `invalid number` で落ちる（実測）。`10#` を付ける。
  echo "$((10#$1))"
}

# 閾値 env と同じく「未設定」と「設定済みだが空」を区別する。`-n` だけだと空値が
# 無言で捨てられ、設定したのに効かない状態になる（同じファイル内で扱いが割れる）。
if [ "${CODEX_REVIEW_TIMEOUT_S+x}" = x ]; then
  if [ "$TIMEOUT_GIVEN" -eq 1 ]; then
    echo "ℹ️  --timeout が明示されているため、CODEX_REVIEW_TIMEOUT_S は無視します。" >&2
  else
    _timeout_val="$(_num_or_die "$CODEX_REVIEW_TIMEOUT_S" CODEX_REVIEW_TIMEOUT_S)"
    echo "ℹ️  CODEX_REVIEW_TIMEOUT_S='${CODEX_REVIEW_TIMEOUT_S}' を --timeout として解釈しました。" >&2
    ORCH_ARGS+=(--timeout "$_timeout_val")
  fi
fi

# ── diff サイズの歯止め ──────────────────────────────────────────────────────────
# 旧ラッパーが持っていたコスト制御。**既定は無効**にしてある。既定で有効にすると、
# これまで走っていたレビューが黙ってスキップされる側へ倒れ、しかも「走らなかった」
# ことに気づく手がかりが無い。歯止めは明示的に入れてもらう。
# 未設定と「設定済みだが空」を区別する。`${VAR:-0}` は両方を 0 にするため、
# `CODEX_REVIEW_MIN_LINES=` が非数値として拒否されず**歯止めが黙って無効になる**。
# 設定したのに効かない、が最も気づきにくい形なので、設定済みなら空でも検証へ渡す。
_min_lines=0
_max_bytes=0
if [ "${CODEX_REVIEW_MIN_LINES+x}" = x ]; then
  _min_lines="$(_num_or_die "$CODEX_REVIEW_MIN_LINES" CODEX_REVIEW_MIN_LINES)"
fi
if [ "${CODEX_REVIEW_MAX_DIFF_BYTES+x}" = x ]; then
  _max_bytes="$(_num_or_die "$CODEX_REVIEW_MAX_DIFF_BYTES" CODEX_REVIEW_MAX_DIFF_BYTES)"
fi

if [ "$_min_lines" != "0" ] || [ "$_max_bytes" != "0" ]; then
  # 閾値を測るには基準が要る。--base が無いときの既定推論をここに持つと
  # オーケストレータと同じ推論の 2 つ目のコピーになるので、**解決できなければ拒否**する。
  # 利用者は歯止めを要求したのだから、守れないまま課金される実行を始めるより良い。
  if [ -z "$BASE_FOR_SIZE" ] && [ "$STAGED_GIVEN" -ne 1 ]; then
    echo "ERROR: diff サイズの歯止めが設定されていますが、比較の基準が分かりません。" >&2
    echo "       --base <branch> を明示してください（歯止めを外す場合は env を 0 にする）。" >&2
    exit 2
  fi
  # 測る範囲は**委譲先がレビューする範囲と同じ**にする。オーケストレータは
  # BASE...HEAD に加えて作業ツリーの変更もレビュー対象として扱う。BASE...HEAD だけを
  # 測ると、pre-commit（staged 未コミット）で「0 行」と判定してスキップし、
  # レビューされるはずの変更が静かに飛ぶ — このファイル冒頭が pre-commit を想定利用先
  # として挙げている以上、現実的な経路。
  _errf="$(mktemp "${TMPDIR:-/tmp}/codex-review-git.XXXXXX")" || { echo "ERROR: 一時ファイルを作成できませんでした。" >&2; exit 2; }
  if [ "$STAGED_GIVEN" -eq 1 ]; then
    _diff_label="staged index"
    _numstat="$(git diff --cached --numstat 2>"$_errf")" || {
      echo "ERROR: staged diff を測れませんでした。" >&2
      sed 's/^/       git: /' "$_errf" >&2
      rm -f "$_errf"
      exit 2
    }
  else
    # 生の `--base` の値ではなく、**委譲先が実際にレビューに使う ref** で測る
    # （resolve_base_ref_for_size の頭のコメント参照）。
    _base_ref="$(resolve_base_ref_for_size "$BASE_FOR_SIZE")"
    _diff_label="base ${_base_ref}"
    _numstat="$( { git diff --numstat "${_base_ref}...HEAD" && git diff --numstat HEAD; } 2>"$_errf" )" || {
      echo "ERROR: diff を測れませんでした（基準: ${_base_ref}）。" >&2
      sed 's/^/       git: /' "$_errf" >&2
      rm -f "$_errf"
      exit 2
    }
  fi
  # バイナリファイルは numstat が `-` を出す。awk の加算では 0 に化けるので、**行数では
  # 測れない**と判断する。測れないものを「小さい」と読んでスキップすると、200KB の
  # バイナリ追加が無言で飛ぶ。
  _unmeasurable=0
  case "$_numstat" in
    *"-	-	"*) _unmeasurable=1 ;;
  esac
  _lines="$(printf '%s\n' "$_numstat" | awk '{ a += $1; d += $2 } END { printf "%d", a + d }')"
  if [ "$STAGED_GIVEN" -eq 1 ]; then
    _bytes="$(git diff --cached 2>>"$_errf" | wc -c | tr -d ' ')"
  else
    _bytes="$( { git diff "${_base_ref}...HEAD"; git diff HEAD; } 2>>"$_errf" | wc -c | tr -d ' ')"
  fi
  rm -f "$_errf"
  if [ -z "$_lines" ] || [ -z "$_bytes" ]; then
    echo "ERROR: diff を測れませんでした（範囲: ${_diff_label}）。" >&2
    exit 2
  fi
  if [ "$_min_lines" != "0" ] && [ "$_unmeasurable" -eq 1 ]; then
    echo "ℹ️  diff にバイナリ変更が含まれ行数で測れないため、CODEX_REVIEW_MIN_LINES によるスキップは行いません。" >&2
  elif [ "$_min_lines" != "0" ] && [ "$_lines" -lt "$_min_lines" ]; then
    echo "ℹ️  diff が ${_lines} 行で CODEX_REVIEW_MIN_LINES=${_min_lines} 未満のため、レビューをスキップします。" >&2
    exit 0
  fi
  if [ "$_max_bytes" != "0" ] && [ "$_bytes" -gt "$_max_bytes" ]; then
    # **上限超過は非 0 で終わる。** 「小さすぎるからスキップ」（MIN_LINES、exit 0）と
    # 「大きすぎてレビューできない」は別物で、後者を 0 で返すと呼び出し側から
    # 「レビュー成功」と区別できない。**最もレビューが要る大きな差分ほどゲートを
    # 素通りする**形になる（置き換え対象だった自前ラッパーは失敗扱いにしていた）。
    # 通したいなら閾値を上げるか 0 で無効化するという明示的な操作を要求する。
    echo "ERROR: diff が ${_bytes} バイトで CODEX_REVIEW_MAX_DIFF_BYTES=${_max_bytes} を超えるため、レビューを実行できません。" >&2
    echo "       レビューせずに通すのは危険なので非 0 で終了します（意図的なスキップとは区別する）。" >&2
    echo "       閾値を上げるか、CODEX_REVIEW_MAX_DIFF_BYTES=0 で無効化してください。" >&2
    exit 3
  fi
fi

# ── Codex 不在 / toolkit 未解決時の降格案内 ─────────────────────────────────────
# Claude Code cloud の実測（2026-09-08）: codex CLI が PATH に無く、sidecar も ~/.claude の
# plugin cache も持ち込まれないため、このシムは toolkit 解決で exit=1 して止まっていた。
# 止まること自体は正しい（黙って 0 で抜けるとレビュー済みと誤読される）が、次に何をすべきかが
# 出力に無かった。self-review.md「レビュー担当の選択と利用制限時の継続」の契約
# （3. 利用不可なら別候補へ → 4. 別モデルの完走が 0 本なら Toolkit のレビューエージェントを
# read-only で並列起動 → 5. それでも足りなければ主担当だけで継続し理由を記録）へ降格する旨を
# 明示する。**このシムはレビューを実行していない**ので終了コードは非 0 のまま
# （codex 不在は 4、toolkit 未解決は従来どおり解決側の rc）。
#
# 案内で挙げる代替 CLI 候補は**委譲先の registry から引く**。案内側に候補名を直書きすると、
# 委譲先のラインナップが変わったときに案内だけが古いまま残り、既定から外れている metered な
# CLI を勧め続ける（導入先から報告された実害: 消費側の規約は課金系 reviewer へのフォールバックを
# 禁じているのに、案内がそれを第一候補として並べていた）。
#
# registry は multi-agent.sh の中で 2 つの見出し行に挟まれた**制限文法**として置かれており、
# toolkit 側の検査がその境界と単純 case lookup の形を固定している。ここでは multi-agent.sh を
# **実行も source もせず**にその区間だけを読む（委譲先を source すると 1800 行のユーティリティが
# シムの名前空間へ入り、「シムに無い関数」へ気づかず依存できてしまう）。
#
# 除外の根拠は委譲先の既定選定と同一にする —— cost tier が metered の CLI は既定ラインナップから
# 外れ、`--cli` で明示 opt-in したときだけ載る。tier の記載が無い名前は委譲先の lookup でも
# 既定値（metered ではない）になるので、ここでも同じ扱いにする。判定を独自に厳しくすると、
# 委譲先が実際に使う CLI を案内が隠す方向へずれる。
#
# 読めない / 境界が変わった場合は空を返す。呼び出し側は候補名の無い案内へ落ちる（案内が消えるの
# ではなく、嘘の候補を出さない形で縮む）。
derive_fallback_cli_candidates() { # $1: multi-agent.sh のパス / $2: 除外する CLI 名
  local orchestrator="$1" exclude="$2"
  [ -n "$orchestrator" ] && [ -r "$orchestrator" ] || return 0
  LC_ALL=C awk -v exclude="$exclude" '
    $0 == "# ── All known CLI names ──" { in_registry = 1; next }
    $0 == "# ── CLI Registry End ──"    { in_registry = 0; next }
    !in_registry { next }
    /^ALL_CLIS="[a-z0-9 -]*"$/ {
      known = $0
      sub(/^ALL_CLIS="/, "", known)
      sub(/"$/, "", known)
      next
    }
    /^get_cli_cost_tier\(\)/ { in_tier = 1; next }
    in_tier && /^}/ { in_tier = 0; next }
    in_tier && /^[ \t]*[a-z0-9-]+\)[ \t]*echo[ \t]*"[a-z-]+"[ \t]*;;/ {
      name = $0; sub(/^[ \t]*/, "", name); sub(/\).*$/, "", name)
      tier = $0; sub(/^[^"]*"/, "", tier); sub(/".*$/, "", tier)
      tiers[name] = tier
    }
    END {
      n = split(known, names, " ")
      out = ""
      for (i = 1; i <= n; i++) {
        if (names[i] == exclude) continue
        if (tiers[names[i]] == "metered") continue
        out = (out == "" ? names[i] : out " / " names[i])
      }
      print out
    }
  ' "$orchestrator" 2>/dev/null || true
}

print_claude_fallback_notice() { # $1: 理由 / $2: toolkit（multi-agent.sh）が使えるか（1 = 使える） / $3: toolkit 解決の rc（$2=0 のときだけ見る）
  local reason="$1" toolkit_usable="${2:-0}" resolve_rc="${3:-0}" candidates=""
  # 見出しは**理由に依存しない**文言にする。呼び出しは 2 経路あり、片方は codex とは無関係
  # （toolkit 未解決）。「Codex 不在のため」と決め打つと、codex が入っている環境で原因を誤って
  # 名指しし、切り分けを遅らせるだけでなく存在しない問題への起票を生む（導入先で実測）。
  echo "⚠️  クロスレビューを実行できないため Claude セルフレビュー（別コンテキストの reviewer サブエージェント）へ降格します: ${reason}" >&2
  echo "   降格先（self-review.md §レビュー担当の選択と利用制限時の継続 3〜5）:" >&2
  if [ "$toolkit_usable" -eq 1 ]; then
    candidates="$(derive_fallback_cli_candidates "${RESOLVED_ORCHESTRATOR:-}" "codex-cli")"
    if [ -n "$candidates" ]; then
      echo "     1. 別 CLI（${candidates}）が使えるなら multi-agent.sh --task review --cli <cli> で再配分する" >&2
    else
      echo "     1. 別 CLI が使えるなら multi-agent.sh --task review --cli <cli> で再配分する（候補は委譲先の既定ラインナップに従う）" >&2
    fi
  else
    # この経路では multi-agent.sh 自体を解決できていない。手順として multi-agent.sh の実行を
    # 出すと、**見つからなかったファイルを実行しろ**という案内になる（その場で実行不能）。
    #
    # さらに解決の rc で二分する。rc=1 は「どこにも無い」、rc=2 は「明示指定
    # （FF_DEV_TOOLKIT_ROOT）が在るのに使えない」で、直し方が違う。探索順は
    # FF_DEV_TOOLKIT_ROOT → cache → サイドカーで**環境変数が最優先**なので、rc=2 で
    # setup-multi-agent.sh を案内しても setup が直すのはサイドカー側であり、次回も同じ
    # 環境変数が先に勝って同じ rc=2 で止まる。効かない手順を「次の一手」として渡すのは、
    # この診断ブロックが直そうとしている欠陥そのものなので、環境変数を名指しする。
    if [ "$resolve_rc" -eq 2 ] && [ -n "${FF_DEV_TOOLKIT_ROOT:-}" ]; then
      echo "     1. FF_DEV_TOOLKIT_ROOT を修正するか unset する（この変数は cache / サイドカーより先に勝つので、setup-multi-agent.sh の再実行では解決先が変わりません）" >&2
      echo "        現在値: ${FF_DEV_TOOLKIT_ROOT}" >&2
      echo "        unset すれば Codex/Claude cache → サイドカーの探索へ進めます。拒否の理由は上の ERROR 行が示しています。" >&2
    else
      echo "     1. setup-multi-agent.sh を再実行して toolkit を配置し直す（解決できるまで別 CLI への再配分も実行できない）" >&2
    fi
  fi
  echo "     2. 別モデルの完走が 0 本なら pr-review-toolkit:code-reviewer 等の reviewer サブエージェントを read-only で起動する" >&2
  echo "     3. それも不可なら主担当のみで継続し、PR / 最終報告に「クロスレビュー未実施」と候補別の利用不可理由を残す" >&2
  echo "   このシムはレビューを実行していません（非 0 終了。レビュー済みと読まないこと）。" >&2
}

# ── 委譲 ────────────────────────────────────────────────────────────────────────
_resolve_rc=0
load_resolved_toolkit || _resolve_rc=$?
if [ "$_resolve_rc" -ne 0 ]; then
  print_claude_fallback_notice "toolkit（multi-agent.sh）を解決できない（rc=${_resolve_rc}）" 0 "$_resolve_rc"
  exit "$_resolve_rc"
fi

# codex CLI の実体を委譲前に確認する。委譲先（multi-agent.sh）は `--cli codex-cli` を固定された
# まま「主が未インストール」で止まるので、ここで降格先を名指しした方が次の一手が早い。
# 実体名は CODEX_REVIEW_CODEX_BIN で差し替えられる（tests/review-wrapper-shim が codex の
# 有無を PATH 操作なしに実測するためのシーム。通常運用で設定する必要はない）。
#
# ただし **--dry-run には掛けない**。委譲先の --dry-run はプランを出すだけで CLI を 1 本も
# 起動しないため、ここで止めると「主 CLI が使えないときにプランを確認する」という、まさに
# 確認したい状況で確認手段そのものが消える（導入先の運用手順はプランに載る CLI の事前確認を
# 求めている）。非実行モードでは警告に留め、実行モードでは従来どおり降格して rc=4 で止める。
#
# **素通りさせるだけではプランは出ない。** このシムは委譲 argv へ `--cli codex-cli` を固定で
# 足しており、codex が不在だと委譲先はその観点を fallback 先（claude-code 等）へ再割り当て
# しようとして `--cli` フィルタに弾かれ、実行対象 0 件で `ERROR: Execution plan is empty`
# （rc=1）で止まる。検査を素通りさせた分の効果が、固定 argv でそのまま打ち消されていた。
# そこで **この回だけ `--cli codex-cli` を外して**委譲する。外す条件は「--dry-run かつ
# codex が不在」に閉じており、実行モードと codex 導入済みの --dry-run は argv も rc も従来
# どおりである。
#
# `--cli` は委譲先では**分散モードのフィルタ**なので、外すと review の既定である pair
# モードへ戻る。表示されるのは `multi-agent.sh --task review` と同じプラン（pair の主
# reviewer が review 観点すべてを担当する形）であって、**このシムを --dry-run なしで
# 実行したときのプランではない** — 実行は従来どおり rc=4 で止まる。プランと実行の帰結が
# 食い違うので、下の警告文はその 2 点を必ず併記すること（片方だけだと「プランが出たの
# だから実行できる」と読める）。
#
# 外してもプランが出ない構成が 2 つあり、rc=1 の理由が違う。どちらも本分岐では直せない
# ので、警告文で読み分けられるようにする:
#   ・設定済みの pair 主 reviewer が未導入  → `ERROR: main reviewer '<名前>' is not
#     installed.`（例: 主を claude-code に設定したまま grok だけが入っている環境）
#   ・AI CLI が 1 本も無い                  → `ERROR: No AI CLIs are installed`
# 主 reviewer に既定値は無い。未設定なら委譲先は `No reviewers configured — falling back
# to the distributed plan.` で分散プランへ縮退し、残りの非従量 CLI が観点を引き受けた
# プランを rc=0 で出す（copilot だけなら分散プランの既定除外で Execution plan is empty の
# rc=1）。案内に「既定 claude-code」と書くと、reviewers 設定の無い環境で grok だけが
# 入っているときの帰結（rc=0）を rc=1 と偽る。
#
# 警告が案内する復旧手段は**このシムが受け付けるもの**に限る。委譲先の
# `--set-reviewers` はこのシムが受け付けないので、案内に書くと案内どおり渡した利用者を
# 上の未対応オプション経路が rc=2 で拒む（消費側で実測・Issue 1600）。主 reviewer の
# 差し替えは env（MULTI_AGENT_REVIEW_MAIN）かプロジェクト設定で案内し、
# `--set-reviewers` は multi-agent.sh を直接呼ぶときだけ使えると併記する。
#
# この不在判定は CODEX_REVIEW_CODEX_BIN 由来で、委譲先はこの env を見ずに PATH の `codex`
# を独立に検出する。env に存在しない値が入ったまま PATH に codex が居ると、シムは「codex
# 不在」で `--cli` を外し、委譲先は同じ実行で codex を「導入済み」と検出する（プランに codex-cli が載るかは主 reviewer の設定次第 — 未設定なら分散縮退で載り、pair の主が別 CLI なら載らない）。
# このとき上の「外さないと Execution plan is empty」は当てはまらない。判定を委譲先に
# 揃えるとシームが PATH 操作なしに不在を再現できなくなるので、判定は env のまま残し、
# 食い違いを検出して警告文で「env 由来の判定であり委譲先の検出とは別」と明示する。
_codex_bin="${CODEX_REVIEW_CODEX_BIN:-codex}"
if ! command -v -- "$_codex_bin" >/dev/null 2>&1; then
  # 委譲先が同じ実行で検出する実体（PATH の `codex`）。env の差し替えが効くのはシムの
  # 判定だけなので、両者が割れたときに限り警告へ 1 行足す。
  _delegate_sees_codex=0
  if command -v -- codex >/dev/null 2>&1; then
    _delegate_sees_codex=1
  fi
  if [ "$DRY_RUN_GIVEN" -eq 1 ] && [ "$EXCLUDE_CODEX_GIVEN" -eq 0 ]; then
    # 固定で足した `--cli codex-cli` の 2 要素だけを落とす。利用者は --cli を渡せない
    # （このシムはオプションとして受け付けない）ので、落とす対象は先頭の 1 組に限られる。
    # `--exclude-cli codex-cli` が渡っている回は落とさない（上の解釈分岐を参照）。
    _orch_kept=()
    _orch_i=0
    _orch_dropped=0
    while [ "$_orch_i" -lt "${#ORCH_ARGS[@]}" ]; do
      if [ "$_orch_dropped" -eq 0 ] \
        && [ "${ORCH_ARGS[$_orch_i]}" = "--cli" ] \
        && [ "$((_orch_i + 1))" -lt "${#ORCH_ARGS[@]}" ] \
        && [ "${ORCH_ARGS[$((_orch_i + 1))]}" = "codex-cli" ]; then
        _orch_dropped=1
        _orch_i=$((_orch_i + 2))
        continue
      fi
      _orch_kept+=("${ORCH_ARGS[$_orch_i]}")
      _orch_i=$((_orch_i + 1))
    done
    if [ "$_orch_dropped" -eq 1 ]; then
      ORCH_ARGS=("${_orch_kept[@]}")
    fi
    echo "WARNING: codex CLI（${_codex_bin}）が PATH にありませんが、--dry-run はこの検査を素通りして委譲します。" >&2
    if [ "$_delegate_sees_codex" -eq 1 ]; then
      echo "         NOTE: この不在判定は CODEX_REVIEW_CODEX_BIN（${_codex_bin}）に基づくシム側のものです。委譲先（multi-agent.sh）はこの env を見ず PATH の codex を独立に検出するため、委譲先から見ると codex は導入済みです（プランに codex-cli が載るかは主 reviewer の設定次第。以下の「外さないとプランが出ない」の説明はこの回には当てはまりません。実行は env の指す実体が無いため rc=4 で止まります）。" >&2
    fi
    echo "         このとき固定の --cli codex-cli を外して委譲します（付けたままだと codex-cli の観点の fallback 再割り当てが --cli フィルタで除外され、実行対象 0 件の「Execution plan is empty」で止まってプランが出ません）。" >&2
    echo "         --cli は委譲先では分散モードのフィルタなので、外すと review の既定である pair モードへ戻ります。表示されるのは multi-agent.sh --task review と同じプラン（pair の主 reviewer が review 観点すべてを担当する形）です。" >&2
    echo "         このシムを --dry-run なしで実行すると、従来どおり codex 不在で rc=4 停止します（プランが出たことは実行できることを意味しません）。" >&2
    echo "         実行するには codex の導入（または CODEX_REVIEW_CODEX_BIN の修正）が要ります。表示されたプランをそのまま走らせるなら multi-agent.sh を直接呼んでください。" >&2
    echo "         プランが出ない構成が 2 つあり、rc=1 の理由が違います。pair の主 reviewer（MULTI_AGENT_REVIEW_MAIN / プロジェクト設定で指定したもの）が未導入なら「main reviewer '<名前>' is not installed.」で止まります（例: 主を claude-code に設定したまま grok だけが入っている環境。MULTI_AGENT_REVIEW_MAIN=<cli> を付けて再実行すると主を変えられます。委譲先の --set-reviewers はこのシムでは受け付けません — multi-agent.sh を直接呼ぶときだけ使えます）。" >&2
    echo "         主 reviewer が未設定なら、委譲先は「No reviewers configured — falling back to the distributed plan.」で分散プランへ縮退し、残りの非従量 AI CLI が観点を引き受けたプランが rc=0 で出ます（pair のプランではありません。copilot だけの環境は既定除外で「Execution plan is empty」の rc=1 です）。" >&2
    echo "         AI CLI が 1 本も PATH に無い環境では、--cli を外しても委譲先の CLI 検出が「No AI CLIs are installed」で止まります（rc=1・プランなし）。" >&2
  elif [ "$DRY_RUN_GIVEN" -eq 1 ]; then
    # --dry-run だが --exclude-cli codex-cli が渡っている回。固定の --cli は残すので、
    # 委譲先の矛盾検査が rc=1 で止める（codex の有無に関わらず同じ帰結）。
    echo "WARNING: codex CLI（${_codex_bin}）が PATH にありませんが、--dry-run はこの検査を素通りして委譲します。" >&2
    echo "         ただし --exclude-cli codex-cli が渡っているため、固定の --cli codex-cli は外しません。委譲先の矛盾検査（--cli と --exclude-cli が同じ CLI 名）が rc=1 で止めます。" >&2
    echo "         この帰結は codex の導入状況で変わりません（同じコマンドの意味を環境で変えないため）。プランを見たいなら --exclude-cli codex-cli を外してください。" >&2
  else
    print_claude_fallback_notice "codex CLI（${_codex_bin}）が PATH に無い" 1
    exit 4
  fi
fi

exec bash "$RESOLVED_ORCHESTRATOR" "${ORCH_ARGS[@]}"
