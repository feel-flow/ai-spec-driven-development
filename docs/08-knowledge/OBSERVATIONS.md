# 振り返り観測台帳（Retrospective Observations）

> **運用の正本**: ff-dev-toolkit プラグインの `skills/retrospective/SKILL.md` の「観測の記録 — 観測台帳（起票の前段バッファ）」。本ファイルは `/retrospective` が記録する Problem / Keep 観測の蓄積バッファであり、手順・閾値・承認境界はスキル側だけが定義する（ここへ複製しない）。
>
> - 記録・畳み込み（同一性の判定）・昇格閾値・特急レーン・archived の条件・コミット規約は、すべてスキル側の規定に従う。**数値や判定基準を本ファイルへ複製しない** — 契約ゲートが固定しているのはスキル側の規定と、下の `Status` 値域行（本体と配布テンプレの一致・所在の接頭辞）だけで、それ以外にここへ写した規則は古くなっても検出されない
> - Frontmatter は付与しない（機械管理の蓄積ファイルで、ACE Playbook の分割ファイルと同じ扱い。`docs/MASTER.md` §Frontmatter の例外注記を参照）
> - 台帳はリポジトリごとに持つ。このファイルが無い場合、`/retrospective` がプラグインの `docs-template/08-knowledge/OBSERVATIONS.md` から作成する

## エントリ形式

新規エントリは次の形式で「エントリ一覧」の末尾へ追記する（ID は `OBS-<3 桁連番>`。既存の最大連番 +1）:

```markdown
<a id="obs-XXX"></a>

### OBS-XXX: [検索可能な主張 1 文のタイトル]

| Kind | problem または keep | Count | 1 |
| First | YYYY-MM-DD | Last | YYYY-MM-DD |
| Status | active | Issue | なし |

[本文 1〜3 文。1 文目 = 主張。problem / keep の文形と Count の意味論はスキル側「記録手順」が正本 — ここへ複製しない]

- YYYY-MM-DD: [1 行の実測メモ]（初回）

---
```

- メタ 3 行は行頭のパイプ区切りで書く（ACE Playbook のコンパクト正準フォーマットと同じ機械可読性の担保）
- `Status` の値域: `active`（蓄積中）/ `promoted`（Issue 昇格済み。`Issue` にリポジトリ修飾の発行番号 `owner/repo#N` を書く）/ `mitigated`（対策済み。対策が別の場所に定義済みのため昇格を見送った。`Issue` に対策の所在を `owner/repo#N` / `skill:<スキル名>` / `doc:<path>#<アンカー>` の書式で書く。条件の正本はスキル側）/ `archived`（休眠。条件の正本はスキル側。再発したら `active` へ戻す）
- 観測メモは再発のたびに 1 行追記する（セッション固有の長い叙述は書かない — 詳細が必要になるのは昇格時で、その時点の Issue 本文に書けばよい）

## エントリ一覧

<a id="obs-001"></a>

### OBS-001: Issue 棚卸しは、クローズ判定の前に全 Issue の主張を統合ブランチの実ファイル・設定へ一括照合すると解消済み・重複が機械的に見つかる

| Kind | keep | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

Issue の本文を読むだけで判断せず、各 Issue が指す grep パターン・行数・設定値・関連 PR の state を 1 つの Bash で develop に対して照合してからクローズ判定に入る。本文の記述が古いまま残る Issue（行数・件数・前提の CI）は照合で初めて解消済みと分かる。

- 2026-09-06: open 37 件の棚卸しで、照合により 7 件（解消済み 4 / 重複 2 / 前提消失 1）をクローズ判定できた。照合なしでは #372（lint 緑化済み）と #288（GitHub Actions 廃止）は本文どおり有効に見えた（初回）

---

<a id="obs-002"></a>

### OBS-002: 30 件超の Issue 本文を 1 つの Bash ループで取得すると出力が persisted-output へ退避され、読み直しに複数ターンを要する

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

多数の Issue 本文を一括取得すると出力上限を超えて別ファイルに落ち、Read を分割して読み直す往復が発生する → 本文はスクラッチパッドのファイルへ直接書き出し、最初の出力はタイトル・ラベル・日付の一覧に絞る。

- 2026-09-06: 33 件の `gh issue view` 出力（約 80KB）が退避され、Read 2 回で読み直した（初回）

---

<a id="obs-003"></a>

### OBS-003: 作業対象と無関係なプラグインの SessionStart hook が大容量コンテキストを注入し、セッション冒頭のコンテキストを消費する

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

Vercel を使わないリポジトリでも Vercel プラグインの SessionStart hook が約 53KB の知識グラフを注入する → プラグインの hook 発火条件をプロジェクトの依存（`vercel` / `next` の有無）で絞れるかを、再発が続いたらプラグイン側へ提案する。

- 2026-09-06: ai-spec-driven-development（Vercel 依存なし）のセッション開始で 53.2KB の注入が persisted-output に退避された（初回）

---

<a id="obs-004"></a>

### OBS-004: PLAYBOOK を文字列パッチで更新するとき、エントリ境界を終端 `---` で切ると終端欠落エントリで隣のエントリまで範囲が伸びる

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

旧形式エントリには終端 `---` を持たないものが混在するため、`---` を境界にした Helpful カウンター更新は次エントリの同名行まで巻き込んで一致数が合わなくなる → 境界は次の `<a id="ace-` アンカーで切り、書き換え前に一致行数が 1 であることを assert する。

- 2026-09-06: ACE-484-3 の Helpful +1 で assert が 2 回失敗し、境界をアンカーに変えて 3 回目で通った（初回）

---

<a id="obs-005"></a>

### OBS-005: ゲート通過を記録する仕組みが無いリポジトリでは、/close-issue の鮮度照合が毎回「判定不能」になる

| Kind | problem | Count | 4 |
| First | 2026-09-06 | Last | 2026-09-07 |
| Status | promoted | Issue | feel-flow/ai-spec-driven-development#515 |

`quality:local` がゲート記録（`record-gate-head.sh` 相当）を書かないため、`check-merge-freshness.sh` は実測対象を特定できず exit 2 を返し、実測とマージの窓は人手の再実行で埋めることになる → 再発が続けば、`quality:local` の末尾でゲート記録を書くか、pre-push hook に記録を組み込むことを本リポジトリの Issue として検討する。

- 2026-09-06: PR #498 の /close-issue で `REASON=実測対象の記録がありません`。直前に HEAD で quality:local を手動再実行して代替した（初回）
- 2026-09-06: PR #500 の /close-issue でも同じ REASON。fix commit 直前に quality:local を手動実行して代替（再発）
- 2026-09-06: PR #502 の /close-issue でも同じ REASON（3 回目・閾値到達）。マージ直前の HEAD で quality:local を手動再実行して代替
- 2026-09-06: 閾値到達により #515 へ昇格起票
- 2026-09-07: PR #519 の /close-issue でも同じ REASON（4 回目）。#515 は open。HEAD == リモート先端・作業ツリー clean・未 push 0 件を手動照合して代替した（再発）

---

<a id="obs-006"></a>

### OBS-006: Issue の AC に書く検証コマンドは、起票時に実行して「拾うべきものを拾う」ことを確かめてから書く

| Kind | problem | Count | 2 |
| First | 2026-09-06 | Last | 2026-09-07 |
| Status | active | Issue | なし |

AC の grep を頭で組んで起票すると、検出式の穴（表記の必須化・境界の欠落）がそのまま「残存なし」の緑になり、レビューで検出器ごと差し戻される → 起票前に既知の残存 1 件を含む状態でコマンドを実行し、その 1 件が検出されることを見てから AC に書く。

- 2026-09-06: Issue #499 の AC grep が `node.js` 表記を必須にしていて「Node 20+」を拾えず、Toolkit が Warning として検出器の是正を要求した（初回）
- 2026-09-07: Issue #517 の AC grep がファイル引数で 2 ファイルに限定されており、同じ無条件主張を持つ `.cursorrules` と `docs/FRONTMATTER_GUIDE.md` を拾えなかった。起票時に引数なしで実行していれば 4 ファイル出ていた（再発。ACE-519-1 として知見化）

---

<a id="obs-007"></a>

### OBS-007: レビューシムのサイドカー不在を setup-multi-agent.sh で復旧すると、シム本体の上書きと `.bak` が作業ブランチの作業ツリーへ混入する

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

`scripts/codex-review.sh` が「multi-agent.sh が見つかりません」で落ちたとき、作業ブランチ上で setup を実行すると同梱シムの更新（数百行）と `codex-review.sh.bak` が現 PR と無関係な差分として作業ツリーに載る → setup の前後で `git status` を取り、生成差分は stash で退避して別 Issue へ切る（現 PR のレビュー対象は stash 後の差分で取り直す）。setup 側が既存シムを上書きせず差分だけ提示する形なら混入自体が起きない。

- 2026-09-06: PR #502 のセルフレビューで発生。stash 退避 + follow-up #503 起票で 1 往復（初回）

---

<a id="obs-008"></a>

### OBS-008: 旧形式エントリを抱えた PLAYBOOK に形式ゲートを allowlist 未初期化で当てると、既存分が全件赤になり新規追記の判定が埋もれる

| Kind | problem | Count | 2 |
| First | 2026-09-06 | Last | 2026-09-07 |
| Status | promoted | Issue | feel-flow/ai-spec-driven-development#504 |

`/ace-curate` 4-f の `check-entry-format.ts` は allowlist 不在を strict として扱うため、初回導入（`/ace-setup` Step 3-b の `--init-allowlist`）を済ませていないリポジトリでは curate のたびに既存旧形式が全件列挙される → 新規 ID が検出一覧に無いことを確認して進め、allowlist 初期化を別 Issue で行う。

- 2026-09-06: PR #502 の curate で 71 件が列挙、新規 ACE-502-1 は非検出。#504 を起票（初回）
- 2026-09-07: PR #519 の curate でも 71 件が全件赤（allowlist 不在 = strict）。新規 ACE-519-1〜3 は非検出だったが、rc=1 の原因切り分けに追加 1 コマンドを要した。#504 は open（再発）

---

<a id="obs-009"></a>

### OBS-009: PLAYBOOK frontmatter の `changeImpact` は ACE 同期検証が小文字を要求し、テンプレ MASTER.md の規約（LOW / MEDIUM / HIGH）と食い違う

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

テンプレ規約に合わせて大文字で書くと `sync-playbook-frontmatter.ts --check` が exit 1 になる → PLAYBOOK では小文字 `medium` を書く。再発が続けば、値域の正本をどちらかに揃える提案をツールキット側へ出す。

- 2026-09-06: PR #502 の curate で `"MEDIUM"` を書いて 1 回赤、小文字へ直して通過（初回）

---

<a id="obs-010"></a>

### OBS-010: ACE 系スキルは PLAYBOOK を `docs/08-knowledge/` 固定で参照するが、テンプレ配布リポジトリでは実体が `docs-template/08-knowledge/` にある

| Kind | problem | Count | 5 |
| First | 2026-09-06 | Last | 2026-10-16 |
| Status | promoted | Issue | feel-flow/feelflow-plugins#2142 |

既定パスで grep・frontmatter 読みを組むと全コマンドが not found で空振りし、パスを直して再実行する往復が出る → 着手時に `package.json` の `ace:*` スクリプトが指すパスで実配置を確定してからコマンドを組む（`/retrospective` の「知見ストアの実配置を確定する」と同じ手順を curate 側にも置く余地）。

- 2026-09-06: PR #502 の curate で最初の情報収集 1 ターンが全件 not found（初回）
- 2026-09-07: PR #519 の curate で `docs/08-knowledge/` に OBSERVATIONS.md だけがあり PLAYBOOK は `docs-template/` 側という配置差を、実在確認 1 ターンで特定した（再発）
- 2026-10-15: PR #547 の curate で `docs/08-knowledge/playbook/` を前提に組んだ grep が 3 回空振りし、直近 ACE コミットの `--stat` で実配置を特定した（再発・Count 3）。SSOT の curate.md は既に「配置先の解決（最初に実施）」で記録済み配置（本 repo では `docs/ACE_SETUP.md`）を読む手順を持っており、空振りは手順の読み飛ばしによるものだったため、起票せず mitigated とした
- 2026-10-15: Issue #418 / PR #559 の着手前参照で、`knowledge-lookup.sh` が既定パスと `docs-template` を除いた探索だけで解決し「Playbook なし — ACE 未導入」と報告。`--playbook docs-template/08-knowledge/PLAYBOOK.md` を付けて再実行するまで 1 往復（再発・Count 4）
- 2026-10-15: 状態移行: mitigated の対策（ace-curate の「配置先の解決」）が knowledge-lookup に及んでいない＝対策が効いていない（promotion.md 復帰条件 b）ため active へ戻し、Count 4 で昇格。SSOT develop `2ca0635` の `scripts/knowledge-lookup.sh` `resolve_store` が `ACE_PLAYBOOK_PATH`・記録済み配置を読まないことを照合して feel-flow/feelflow-plugins#2142 を起票。旧所在は feel-flow/feelflow-plugins@2ca0635 の curate.md「配置先の解決」
- 2026-10-16: Issue #512 / PR #569 の着手前参照で、ff-dev-toolkit 0.151.0 の `knowledge-lookup.sh` がまた「Playbook なし — ACE 未導入」と報告した（`docs-template/08-knowledge/PLAYBOOK.md` は実在）。curate では直近 ACE コミットの `--stat` で実配置を確かめて 1 往復（再発・Count 5。#2142 は open）

---

<a id="obs-011"></a>

### OBS-011: Codex レビューシム（`codex-review.sh`）の実行中に commit / push すると、保存済みの観点ファイルがあっても残りの観点が「worktree 変更検出」で破棄され 1 巡が無駄になる

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

シムはバックグラウンドで 3 観点を並列に回し、完了前に HEAD が動くと未完了分を破棄して exit 1 になる。code-review / test-analysis が先に保存されたのを見て次の fix commit を作ると、acceptance-criteria が失われて再実行が必要になる → 完了通知（exit code）が来るまで commit しない。個別ファイルの保存ログを「完了」と読まない。

- 2026-09-06: PR #505 の 2 巡目で acceptance-criteria 完了前に fix commit を作り、3 巡目の再実行で 1 回分を空費（初回）

---

<a id="obs-012"></a>

### OBS-012: Markdown 内 TypeScript コード例の構文・型欠陥（`try` の無い `catch`、基底の署名変更に追随しないサブクラス）が品質ゲートを素通りし、レビュアーの目視でしか見つからない

| Kind | problem | Count | 2 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | promoted | Issue | feel-flow/ai-spec-driven-development#512 |

`quality:local` は fenced TypeScript を検査しない。写経される文書で同じ欠陥クラスが同一 PR 内で 2 回（1 巡目 SKILL.md §5、2 巡目 §6）再発した → fenced TS を抽出して構文チェック（少なくとも）するゲートを追加する（#512）。

- 2026-09-06: PR #510 の 1 巡目で SKILL.md §5 の `} catch` 断片、2 巡目で §6 の同型を Toolkit code-reviewer が検出（初回・2 回目）
- 2026-10-16: 完了照合: #512 は PR #569 で closed になった。構文の欠陥は develop `6e1bbce` の `scripts/check-md-typescript.mjs`（`quality:local` 6 段目 `check:md-ts`）で検出できるようになった。ただし主張に含まれる型の欠陥（サブクラスへ伝播しない引数＝TS2554）は #512 の範囲外で未対策のため、mitigated への移行は保留し、promoted のまま残す

---

<a id="obs-013"></a>

### OBS-013: 設計判断を含む文書 PR では、Toolkit の type-design-analyzer を含めて 4 観点を並列に回すと、個別パッチでは閉じない根本原因（分類の再導出）が 1 巡目で指摘される

| Kind | keep | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

code-reviewer / silent-failure-hunter が挙げた「`InternalError` が再試行される」「`SecurityError` のステータス変更で禁止から外れる」「`isRetryable` が既定判定を置換できる」は、type-design-analyzer の「`abstract readonly category` で宣言させる」1 案で同時に消えた。個別に直していたら 3 パッチと 2 巡目の再指摘になっていた。

- 2026-09-06: PR #510 の 1 巡目（初回）

---

<a id="obs-014"></a>

### OBS-014: 厳密一致の置換スクリプトと prettier --write を同じブランチで交互に走らせると、再整形された表・折り返し行で後続の置換が空振りし、失敗検出と commit を 1 コマンドに連結していると部分コミットになる

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

Markdown 内コード例の編集を Python の厳密一致置換で当て、その後 prettier --write で整形すると、次の巡回では三項演算子の折り返しや表セルの余白が変わっていて同じ書き方の置換が 0 件になる。置換の assert 失敗を commit と同じシェル呼び出しに並べていたため、3 件中 1 件だけがコミットされ追加コミットが要った。

- 2026-09-06: PR #516 で 2 回発生（1 巡目 fix の readHttpStatus 折り返し、2 巡目 fix の FALLBACK.md 表セル余白）。置換 → prettier → 検証 → commit を別コマンドに分けるか、置換を正規表現で余白非依存にすると回避できる（初回）

---

<a id="obs-015"></a>

### OBS-015: 品質ゲートをバックグラウンド実行中にその対象ファイルを編集すると、実行結果が最終ツリーと一致する保証を失い無効になる

| Kind | problem | Count | 1 |
| First | 2026-08-28 | Last | 2026-08-28 |
| Status | mitigated | Issue | doc:docs/AI_GIT_WORKFLOW.md#ステップ4-テスト検証test |

`pnpm check` / `npm run quality:local` 等のゲートをバックグラウンドで回している間にソースを編集すると、ゲートは開始時に作業ツリーをスナップショットせず各ステージが逐次ファイルを読むため、完了した実行は旧内容と新内容が混在し得る「最終ツリーと一致する保証がない結果」でありコミット前ゲートとして使えない → ゲート実行中は対象ファイルを編集せず、待ち時間には**読み取りだけ**の作業（docs 読み・既存 Issue 検索・ADR や修正案の下書きはゲート対象外のスクラッチ領域で）を充てる。編集したらその実行を無効と見なして測り直す（レビューシムが HEAD 移動で明示的に abort する OBS-011 と異なり、ゲートは無言で結果を返す）。

- 2026-08-28: feel-flow/youtube-plan PR #409 で `pnpm check`（約 2 分）の待ち時間にレビュー指摘の修正を入れ、完了した実行が無効になり 1 回分を空費（ゲートは計 3 回、必要だったのは 2 回）（初回）

---

<a id="obs-016"></a>

### OBS-016: zsh では終了コード取得の bash イディオムがそのまま動かない — `PIPESTATUS` は小文字 1 始まり、`status` は読み取り専用のため、パイプ越しのゲート判定が黙って空振りする

| Kind | problem | Count | 3 |
| First | 2026-09-07 | Last | 2026-10-15 |
| Status | mitigated | Issue | doc:plugins/ff-dev-toolkit/PUBLIC-SURFACE.md#2-1-契約hookshooksjson-が登録する入口 |

長時間ゲートの結果をパイプで `tail` に流すと `${PIPESTATUS[0]}` が空になり（zsh は `pipestatus` で 1 始まり）、続けて `status=$?` で受けようとすると `read-only variable: status` で代入行から落ちる → ゲートはログファイルへリダイレクトし、次行で `rc=$?` を受けてから `grep` で中身を読む。

- 2026-09-07: PR #519 で `npm run quality:local` の終了コードを 2 回取り損ね、確証のためゲートを 2 回追加実行した（1 回 40 秒前後）。3 回目にログ経由 + `rc=$?` で確定（初回）
- 2026-10-15: PR #552 の precheck 実行で `${PIPESTATUS[0]}` を書き、ff-dev-toolkit の exit-code guard（`pipestatus` タグ）が実行前に止めた。ログへリダイレクト + `rc=$?` へ書き直す 1 回のやり直しで済んだ
- 2026-10-15: PR #553 の merge-cleanup 実行で `${PIPESTATUS[0]}` を書き、exit-code guard（`pipestatus` タグ）が実行前に止めた。ログへリダイレクト + `rc=$?` へ書き直す 1 回のやり直しで済んだ
- 2026-10-15: 状態移行（再発ではない）: Count 3 で閾値に到達したが、2 回目・3 回目とも ff-dev-toolkit の `hooks/guard-exit-code.sh` が実行前に阻止し、元の害（ゲート判定の空振り）は再発していないため昇格を見送り `mitigated` とした。対策の所在は feel-flow/feelflow-plugins の `plugins/ff-dev-toolkit/PUBLIC-SURFACE.md`「2-1. 契約」が登録する PreToolUse フック `hooks/guard-exit-code.sh`（ff-dev-toolkit 0.151.0 で実体を確認）

---

<a id="obs-017"></a>

### OBS-017: 依存バージョンの指摘を「失敗シナリオなし」で Suggestion に落とす前に、その依存が既に CI の annotation で警告を出していないか確認する

| Kind | problem | Count | 1 |
| First | 2026-09-07 | Last | 2026-09-07 |
| Status | active | Issue | なし |

Review Response Policy の「失敗シナリオのない指摘は Suggestion」は、失敗シナリオを差分だけから探すと成立していないように見える。依存の非推奨警告は実行ログ側にしか現れないため、見送り判断の前に `gh run view` の annotation を読む → 根拠が既に存在していれば Warning として現 PR で対応できる。

- 2026-09-07: PR #519 で actions のバージョンピン留め指摘を「失敗シナリオなし」として見送った直後、マージ後の CI annotation に `actions/checkout@v4` / `actions/setup-node@v4` が Node.js 20 を対象としており Node 24 へ強制されている旨の非推奨警告が出ていた。見送り前に annotation を読めば現 PR 内で閉じられた（初回）

---

<a id="obs-018"></a>

### OBS-018: read-only レビューエージェントの実行中はブランチを checkout せず `git show <ref>:<path>` で読む — checkout は実行中エージェントの足元のファイルを差し替える

| Kind | keep | Count | 1 |
| First | 2026-09-07 | Last | 2026-09-07 |
| Status | active | Issue | なし |

並列エージェントの禁止事項は「エージェント側がビルドしないこと」だけでなく、オーケストレータ側が作業ツリーを動かさないことも含む。先に返ってきた観点の指摘を検証したくなっても checkout せず、`git show <branch>:<path>` で PR ブランチの内容を読めば、待ち時間を事実確認に使いながら実行中のエージェントを壊さない。

- 2026-09-07: PR #519 で comment-analysis が先に完了し code-review が実行中だったため、`git show origin/<branch>:<path>` で Critical / Warning 6 件を全件実測（すべて正確と確認）。checkout は code-review 完了後まで待ち、競合ゼロで 1 fix commit に束ねられた（初回）

---

<a id="obs-019"></a>

### OBS-019: 観測台帳の OBS ID は最大連番 +1 で採番するため、未マージの open PR が同じ ID を先取りしていても push が fast-forward で通り、衝突が無警告で成立する

| Kind | problem | Count | 1 |
| First | 2026-09-07 | Last | 2026-09-07 |
| Status | active | Issue | なし |

スキルが持つ衝突対策は「push が non-fast-forward で拒否されたら再採番する」だけで、先取り側がまだマージされていない場合は拒否が起きず素通りする（ACE の PR スコープ式 ID にはこの穴がない） → 採番の前に `gh pr list --state open --json number,headRefName` の各 PR で `gh pr diff <N> | grep 'OBS-0'` を掃き、未マージの先取りを確認する。衝突に気づけるのは相手 PR のマージ時で、そこでは他文書からのアンカー参照まで壊れる。

- 2026-09-07: PR #519 の振り返りで OBS-015〜017 を採番して push（fast-forward で成功）したが、open PR #518 が別内容の OBS-015 を定義済みで `docs/AI_GIT_WORKFLOW.md` からアンカー参照も持っていた。自分の 3 件を OBS-016〜018 へ繰り下げる追加コミットを要した（初回）

---

<a id="obs-020"></a>

### OBS-020: `multi-review.sh --base <branch>` はローカルの ref を解決するため、fetch 済みでもローカル追跡ブランチが古いとレビュー範囲が黙って上位集合へ広がる

| Kind | problem | Count | 1 |
| First | 2026-09-07 | Last | 2026-09-07 |
| Status | active | Issue | なし |

`--base develop` はリモート追跡ではなくローカルの `develop` を解決するため、`git fetch` だけしてローカル ref を更新していないと、既にマージ済みの他 PR の差分まで含めてレビューさせる。エラーにならず結果も返るので、レビュー観点が PR 外の差分へ分散していることに気づけない → 起動前に `git rev-parse --short develop origin/develop` の一致を確認する（または `--base origin/develop` を渡す）。

- 2026-09-07: PR #522 のレビューでローカル `develop` が #519 マージ前で止まっており、PR 実差分 1 ファイル 7+46 行に対し 7 ファイル 114+82 行を対象にレビューさせた。出力に「`ci.yml` の新設」（#519 で既にマージ済み）が含まれていたことで気づき、ref を更新して再実行した（初回）

---

<a id="obs-021"></a>

### OBS-021: スクリプト末尾に条件分岐の報告行を置くと全体の終了コードが分岐の成否になり、本体の失敗が exit 0 に化ける — バックグラウンド実行では完了通知の exit code しか見えないため誤報になる

| Kind | problem | Count | 1 |
| First | 2026-09-07 | Last | 2026-09-07 |
| Status | active | Issue | なし |

`git push` の rc を変数へ取っても、最後の行が `[ "$rc" -eq 0 ] && echo 成功 || tail ログ` だとスクリプトの終了コードは `tail` の成功（0）になる。バックグラウンドへ回った実行では完了通知の exit code しか見えないため、失敗した push を成功として報告してしまう（`echo "PUSH_RC=$?"` を末尾に置く形も同じく 0 を返す） → 本体の rc は末尾で `exit "$rc"` として明示的に伝播させ、人間向けの報告行はその前に置く。完了通知の exit code は「最後のコマンドの成否」であって本体の成否ではない。[OBS-016](#obs-016) の zsh 変数由来とは機構が別で、対処も別（あちらはログ経由で受ける、こちらは伝播させる）。

- 2026-09-07: PR #519 のセッションで 2 回発生。1 回目は non-fast-forward で失敗した push を「✓ push 成功」と誤報してユーザーへの報告を訂正、2 回目はログの `PUSH_RC=1` を読んで初めて pre-push ゲート失敗と判明した（初回）

---

<a id="obs-022"></a>

### OBS-022: `mcp` の spawnSync 系テストは `testTimeout` 未設定（既定 5 秒）で境界に張り付いており、pre-push ゲートが非決定的に赤くなって push を止める

| Kind | problem | Count | 2 |
| First | 2026-09-07 | Last | 2026-09-14 |
| Status | active | Issue | なし |

`mcp/vitest.config.ts` は `include` だけを指定し `testTimeout` を持たないため既定 5000ms。`tests/validate-frontmatter.test.ts` は各ケースで `spawnSync` により `validate-docs.mjs` を起動するので 1 ケースが数秒に達し、実行ごとに落ちるケースが入れ替わる → 赤を見たら落ちたケース名を 2 回の実行で比較し、変わるなら flaky と判定して回帰と切り分ける（同じケースが落ちるなら回帰）。恒久対策は `testTimeout` の引き上げか spawn 回数の削減で、`SKIP_QUALITY_GATE=1` での迂回は #517 が Actions を第二のゲートに据えた前提そのものを崩すので使わない。同型の症状は internal リポジトリの Issue でも追跡されている。

- 2026-09-07: PR #519 後続の `ci.yml` コメント 1 行追加で push が 2 回中止。1 回目 2 件・2 回目 1 件と落ちるケースが変わり flaky と確定（いずれも `Test timed out in 5000ms`）。コメント 1 行のためにゲートを迂回する価値がないと判断し、当該コミットを取り下げた（初回）
- 2026-09-14: PR #539 のレビュー修正 push で root の `export-toolkit-templates.test.ts`（symlink CLI、git+node を複数回 spawn）が 5110〜6396ms で既定 5s 超過。単体再実行は 1.6s。`{ timeout: 15_000 }` を付けてゲートを通した（ACE-539-2）

---

<a id="obs-023"></a>

### OBS-023: バックグラウンド実行のコマンドを tail 等へパイプすると、出力が終了までバッファされ途中経過が空になる

| Kind | problem | Count | 2 |
| First | 2026-08-28 | Last | 2026-08-28 |
| Status | mitigated | Issue | doc:docs/AI_GIT_WORKFLOW.md#ステップ4-テスト検証test |

長時間コマンドを `cmd | tail -6` のようにパイプしてバックグラウンド起動すると、`tail -n` が末尾確定のため EOF を待ち、進捗確認のために出力ファイルを読んでも空のままになる。途中で失敗していても早期に気づけない → バックグラウンドでは出力を加工せず素のまま流し、絞り込みは完了後にホストが保存した出力ファイルへ対して行う。「パイプしない」という知識だけでは、長い出力を要約したい動機のほうが強く再発する。`grep` / `head` は EOF 待ちとは別の挙動なので、同じ「終了までバッファ」には畳まない。[OBS-016](#obs-016) の zsh `PIPESTATUS` 由来とは機構が別で、対処も別（あちらは終了コードの取り方、こちらは途中経過の可視性）。

- 2026-08-28: feel-flow/youtube-plan PR #409 で `pnpm check 2>&1 | tail -25` をバックグラウンド起動し、出力ファイルが 2 回とも空。完了通知を待つしかなく途中失敗に気づけなかった（初回）
- 2026-08-28: 起票した同一セッションで `pnpm check 2>&1 | tail -8` を再度バックグラウンド起動し、同じ症状。前景実行（timeout 付き）へ切り替えて解消（再発）

---

<a id="obs-024"></a>

### OBS-024: macOS で grok-cli の read-only sandbox が docker.sock symlink で拒否されるときは MULTI_AGENT_GROK_READONLY_PROFILE=ff-review-ro で完走できる

| Kind | keep | Count | 2 |
| First | 2026-09-14 | Last | 2026-09-14 |
| Status | active | Issue | なし |

dry-run で grok-cli が `runtime-socket deny resolution failed` と出ても、プランから外さず `~/.grok/sandbox.toml` の `ff-review-ro`（`extends = "read-only"` / `restrict_network = false`）を環境変数で指定すると review が完走する。ホストが grok でも CLI 経路を残せる。

- 2026-09-14: PR #538 の `/multi-review` で grok-cli が完走し、codex-cli と合わせてクロスモデルが成立した。claude-code は spend limit で INCOMPLETE（初回）
- 2026-09-14: PR #539 でも同じプロファイルで grok-cli が完走。claude-code は週次 spend limit で再び INCOMPLETE（指摘なしではなく未確認）

---

<a id="obs-025"></a>

### OBS-025: 依存未導入のチェックアウトで `quality:local` を走らせると tsc の TS2688 で落ち、原因が「npm ci 未実行」だと読めない

| Kind | problem | Count | 3 |
| First | 2026-10-15 | Last | 2026-10-16 |
| Status | mitigated | Issue | feel-flow/ai-spec-driven-development#565 |

`quality:local` は意図的に `npm ci` を含まないため、ルートと `mcp/` の `node_modules` が無いと最初の `build:mcp` が `Cannot find type definition file for 'node'` で落ち、型定義の不備に見えて 1 回ゲートを空費する → ゲート冒頭で `node_modules` の有無を検査し、無ければ `npm ci`（ルートと `mcp/`）を名指しして止めよ。

- 2026-10-15: PR #543 の PR 前ゲートで TS2688 により exit 2。`node_modules` が両方とも不在だと確認し、`npm ci` を 2 か所で実行してから再実行で通過（初回）
- 2026-10-15: Issue #406 / PR #553 の PR 前ゲートで、ルートの `node_modules` はあったが `mcp/node_modules` が無く TS2688 で exit 2。`npm --prefix mcp ci` 後の再実行で通過
- 2026-10-16: PR #562 の PR 前ゲートで `mcp/node_modules` が無く [3/8] が `'vitest' は認識されていません` で exit 1。`npm --prefix mcp ci` 後はルートの `node_modules` 不在で [4/8] が同じ形で落ち、`npm ci` 後に 3 周目を回した（Count 3 で昇格）
- 2026-10-16: 対策完了を照合。PR #566（1520ca03）で `scripts/quality-local.sh` が段の前に root / mcp の `node_modules` を確かめ、不在なら名指しで `npm ci` / `npm --prefix mcp ci` を案内して exit 1 で止まることを develop で確認し、mitigated へ移した

---

<a id="obs-026"></a>

### OBS-026: AGENTS.md の「スコープ外の問題」節が「即座に GitHub Issue を作成」の旧文言のままで、workflow-doctor が FAIL を出す

| Kind | problem | Count | 1 |
| First | 2026-10-15 | Last | 2026-10-15 |
| Status | mitigated | Issue | feel-flow/ai-spec-driven-development#544 / doc:AGENTS.md#スコープ外問題の取り扱い |

入口文書が「発見 = 起票」のままだと、AGENTS.md を読む CLI（Codex など）は YAGNI → 同 PR インライン → 既存 bundle 追記 → bundle 単位で起票の 4 段判定を経ずに Issue を量産する → AGENTS.md の該当節を 4 段判定へ書き換え、CLAUDE.md とのパリティを workflow-doctor で確認せよ。

- 2026-10-15: PR #543 後の振り返り冒頭で `workflow-doctor.sh --offline` が `AGENTS.md:427` を FAIL（fail=1 warn=1）（初回）
- 2026-10-15: 実害（Issue 量産の誘導）が入口文書に常駐する種類のため、利用者の起票方針（actionable は承認待ちなしで起票）に従い閾値未達で #544 へ起票
- 2026-10-15: 状態移行（再発ではない）promoted → mitigated。#544 は PR #546（squash 78d9da3）で closed。`AGENTS.md`「スコープ外問題の取り扱い」を 4 段判定へ書き換え、`CLAUDE.md` にも同じ節を置いたことを develop 78d9da3 で確認。`workflow-doctor.sh --offline` は fail=0 warn=0。同じ旧文言が残る他 6 ファイルは #545（Epic #530 配下）で追跡中

---

<a id="obs-027"></a>

### OBS-027: `finish.sh precheck` が separate-push で生成する MERGE_COMMAND は、`delete_branch_on_merge=true` のリポジトリでは head 削除 push が `cannot lock ref` で落ち、マージ成功でも rc 1 を返す

| Kind | problem | Count | 2 |
| First | 2026-10-15 | Last | 2026-10-16 |
| Status | promoted | Issue | feel-flow/feelflow-plugins#2135 |

base を別 worktree が保持していると precheck は `--delete-branch` を外し、lease 付きの削除 push を `&&` で連結する。GitHub がマージ時に head を消すリポジトリでは、この削除が必ず失敗する。その結果マージ成否の判別に `gh pr view` / `ls-remote` での実測が 1 回余計に要る → precheck は削除の生成前にリポジトリ設定か ref の実在を確かめ、ref が無ければ削除をスキップして成功扱いにせよ。

- 2026-10-15: PR #546 のマージで MERGE_COMMAND が rc 1。`gh pr view` は MERGED、`git ls-remote` は該当 ref なし、`delete_branch_on_merge=true` を確認（初回）
- 2026-10-15: toolkit 側の修正で構造的に解消できる種類のため、利用者の起票方針（actionable は承認待ちなしで起票）に従い閾値未達で feel-flow/feelflow-plugins#2135 へ起票
- 2026-10-16: PR #564 のマージで MERGE_COMMAND の削除 push が `! [rejected] (delete) ... (stale info)` で失敗。マージは成功、`delete_branch_on_merge=true` で ref は既に無かった。feel-flow/feelflow-plugins#2135 へ再発をコメント

---

<a id="obs-028"></a>

### OBS-028: Bash ツールから `rg` を検索パス無しで起動すると、非 TTY の stdin を読み続けて無言でハングする

| Kind | problem | Count | 1 |
| First | 2026-10-15 | Last | 2026-10-15 |
| Status | promoted | Issue | feel-flow/feelflow-plugins#2136 |

ripgrep はパスを省略すると、stdin が TTY でない限り cwd ではなく stdin を検索する。Bash ツールの stdin には EOF が来ないため、出力の無いまま 120 秒のタイムアウトまで待ち、同じ呼び出しで連結した別のコマンドを原因と誤認しやすい → `rg` には検索パス（`.`）を必ず付けるか `</dev/null` を付けよ（codex の stdin 待ちと同じ型）。

- 2026-10-15: PR #547 で `rg ... -g '!node_modules'`（パス無し）が 2 回タイムアウトして exit 144。最初は連結していた `npx prettier` を疑い、切り分けに 1 往復かかった（初回）
- 2026-10-15: toolkit の Bash ガードで構造的に防げる種類のため、利用者の起票方針（actionable は承認待ちなしで起票）に従い閾値未達で feel-flow/feelflow-plugins#2136 へ起票

<a id="obs-029"></a>

### OBS-029: 先行試行で生成・保存・取得の実測が揃った docs-only Issue にレビュー対応を実装と同額で見込むと、乖離率 0.25 の過大見積もりになる

| Kind | problem | Count | 1 |
| First | 2026-10-15 | Last | 2026-10-15 |
| Status | active | Issue | なし |

「共通運用の設計判断を含む」ことを理由に、レビュー対応を実装と同額で見込んだ。しかし設計判断の材料となる実測は、Issue コメントの先行試行ですでに揃っており、作業は文書化だけで済んだ → 見積もりの前に、Issue コメントに判断材料の実測が揃っているかを確かめる。揃っていれば、docs-only の fast 経路を前提にレビュー対応を小さく見積もれ。

- 2026-10-15: Issue #540 / PR #548。AI 予定 4.0h → 実績 1.0h（最小値、wallclock 0.1h）、fast 経路で Codex 指摘 0 件・fix 1 行（初回）

---

<a id="obs-030"></a>

### OBS-030: zsh の Bash ツールで `gh api` の URL 引数に未引用の `?ref=` を書くと NOMATCH で落ち、zsh-glob ガードはこの位置引数の形を検出しない

| Kind | problem | Count | 1 |
| First | 2026-10-15 | Last | 2026-10-15 |
| Status | promoted | Issue | feel-flow/feelflow-plugins#2138 |

ガードが検出するのは、`-` で始まる語の `=` より右側にある glob 文字だけだった。そのため、位置引数の URL に含まれる `?` は素通りし、実行時に `no matches found` で呼び出しが落ちる → `gh api` に渡すクエリ付きパスは必ず引用せよ。

- 2026-10-15: PR #548 の調査で、サイト側の文書を `gh api repos/.../contents/...?ref=develop` で取得しようとして失敗した。引用して再実行し、1 往復を失った（初回）
- 2026-10-15: toolkit の Bash ガードで構造的に防げる種類のため、利用者の起票方針に従い閾値未達で feel-flow/feelflow-plugins#2138 へ起票

---

<a id="obs-031"></a>

### OBS-031: 節を別ファイルへ移すときの参照洗い出しを「ファイル名→キーワード」の一方向 grep だけで済ませると、語順が逆の言及・同一ファイル内の § 参照・行番号指しの参照が残り、レビュー後の追加 fix になる

| Kind | problem | Count | 1 |
| First | 2026-10-15 | Last | 2026-10-15 |
| Status | active | Issue | なし |

移設した節を指す表記は「PATTERNS.md「エラーハンドリング」」の形だけでなく、「エラーパターンは PATTERNS.md に準拠」（語順が逆）、移設元に残った「（§3）」、「docs/PATTERNS.md:145」（行番号）の形でも現れ、一方向の正規表現はこれらを拾わない → 移設前の洗い出しでは、両方の語順・移設元ファイル内の `§N` / `セクション N`・`<file>:<行番号>` の 3 形を別々に grep せよ。

- 2026-10-15: Issue #550 / PR #551。一方向 grep で 13 箇所を張り替えた後、マージ前の確認で 3 箇所（PATTERNS.md §9 コメント・GETTING_STARTED.md・git-workflow.md の例示）が見つかり、3 本目のコミットになった（初回）

---

<a id="obs-032"></a>

### OBS-032: pre-push がフル品質ゲートを実行するリポジトリで、push の直前に同じゲートを手動実行すると同一 HEAD でゲートが 2 回走る

| Kind | problem | Count | 3 |
| First | 2026-10-15 | Last | 2026-10-15 |
| Status | promoted | Issue | feel-flow/ai-spec-driven-development#558 |

`.husky/pre-push` が `npm run quality:local`（ゲート記録の書き込みを含む）を毎回実行するため、commit 直後に手動で回した結果は push の時点でそのまま再計測される → push する予定のコミットでは手動実行を省き、pre-push の実行をゲート実測と記録として扱う。手動実行は push しない段階の確認（commit 前の挙動確認）に限る。

- 2026-10-15: Issue #389 / PR #552。3 回の push すべてで直前に手動実行しており、フルゲート 6 回のうち 3 回が同一 HEAD の重複だった（初回）
- 2026-10-15: Issue #412 / PR #555。初回 commit 前と fix commit 前の 2 回とも手動実行し、続く 2 回の push の pre-push が同じ内容で再実行した（4 回中 2 回が重複）
- 2026-10-15: Issue #556 / PR #557。fix commit 前に手動で回したゲートを、直後の push の pre-push が同じ内容で再実行した。Count 3 で #558 へ昇格（Epic #496 の sub-issue）

---

<a id="obs-033"></a>

### OBS-033: Claude Code のクラウドセッションでは GitHub GraphQL が 403 で遮断され、`gh pr view` 等に依存する `finish.sh precheck` / `cleanup` / `knowledge-lookup` が判定不能で止まる

| Kind | problem | Count | 1 |
| First | 2026-10-15 | Last | 2026-10-15 |
| Status | active | Issue | なし |

クラウドセッションの `gh` は REST（`gh api repos/...`）と CCR 経路（`/pulls/{n}/ccr/review_threads` 等）しか通らないため、GraphQL 前提の固定手順は rc 2 / rc 1 で止まり、同じ検査を REST で手組みし直すことになる → 固定手順の gh 呼び出しを REST / CCR 経路へ寄せるか、GraphQL 不通を検出したら REST の同等手順へ自動で切り替える。

- 2026-10-15: Issue #406 / PR #553。precheck（AC 照合ゲート）・merge-cleanup・knowledge-lookup の 3 箇所が GraphQL 403 で止まり、レビュースレッド・CI・リモート ref・ローカル OID の照合を REST と `git ls-remote` で手動実行した（初回）

---

<a id="obs-034"></a>

### OBS-034: 新規 clone のクラウドセッションでは `origin/HEAD` が未設定で、`finish.sh knowledge-commit probe` が既定ブランチを解決できずに止まる

| Kind | problem | Count | 1 |
| First | 2026-10-15 | Last | 2026-10-15 |
| Status | active | Issue | なし |

clone 方式によっては `refs/remotes/origin/HEAD` が作られず、ACE / 観測台帳の書き込み口が最初の probe で rc 1 になり 1 回やり直す → セッション開始時（SessionStart hook 等）に `git remote set-head origin --auto` を済ませるか、書き込み口が未設定を検出したら自分で解決する。

- 2026-10-15: Issue #406 / PR #553 の `/ace-curate` で probe が「origin/HEAD を解決できません」で停止。`git remote set-head origin --auto` 後の再実行で `protection=unknown` を得た（初回）

---

<a id="obs-035"></a>

### OBS-035: Codex CLI が無い環境でも、リポジトリの Codex 自動レビュー（PR open 時と `@codex review`）を待てばクロスモデルの観点を確保できる

| Kind | keep | Count | 2 |
| First | 2026-10-15 | Last | 2026-10-15 |
| Status | active | Issue | なし |

`/multi-review` の fast 経路は Codex レーンを CLI 前提で組むため、CLI 未導入だと主担当の直読だけで完了扱いになるが、GitHub 側の Codex 自動レビューは同じ head に対して実指摘を返す → CLI 不在時は PR 上の Codex 自動レビューの完了を待ってからマージ判断し、修正が規則を組み替えた回は `@codex review` で 2 巡目を依頼する。

- 2026-10-15: Issue #406 / PR #553。主担当の直読は指摘 0 件だったが、Codex 自動レビューが 1 巡目 2 件・2 巡目（`@codex review`）3 件の妥当な指摘を返し、すべてマージ前に解消した（初回）
- 2026-10-15: Issue #418 / PR #559。主担当の直読と品質ゲートが通した lockfile 再生成について、Codex 自動レビューが npm 10 による `libc` 制約 10 件の消失を検出し、npm 11 で再生成して解消した

---

<a id="obs-036"></a>

### OBS-036: `npm run -s <script>` は登録されていない script でも「Missing script」を出さずに rc 1 で終わるため、ゲートの失敗と script の不在を見分けられない

| Kind | problem | Count | 1 |
| First | 2026-10-15 | Last | 2026-10-15 |
| Status | active | Issue | なし |

`/ace-curate` の同期検証は「npm script 登録済みなら npm run」を第 1 候補とするが、`-s` を付けて叩くと未登録でも空ログ・rc 1 になり、同期検証が赤と読める → 候補を選ぶ前に `grep -n '"<script>"' package.json` で登録を確かめ、未登録なら同梱の `ace-run-ts.sh` 経路を使う。

- 2026-10-15: Issue #412 / PR #555。`ace:check-playbook-frontmatter` が未登録のまま `npm run -s` で叩いて rc 1・空ログになり、ログを読み直して不在と気づくまでに 1 往復かかった（初回）

---

<a id="obs-037"></a>

### OBS-037: 文書の version を上げるとき frontmatter の `changeImpact` を前回の値のまま残すと、bump の段（patch / minor）と食い違い、レビューで差し戻される

| Kind | problem | Count | 1 |
| First | 2026-10-15 | Last | 2026-10-15 |
| Status | active | Issue | なし |

`version` を手で上げると、同じ frontmatter にある `changeImpact` が前回の変更の値のまま残りやすく、文書自身の更新規則（low → patch / medium → minor）と矛盾する → version を上げる編集では、`changeImpact` を今回の変更の影響度から決め直し、bump の段と同じ編集で揃える。

- 2026-10-15: Issue #556 / PR #557。OPERATIONAL_GUIDE を 2.1.1（patch）に上げたが `changeImpact: medium` のまま残し、Codex の GitHub レビューが P2 で指摘した。fix commit と pre-push ゲートが 1 回ずつ増えた（初回）

---

<a id="obs-038"></a>

### OBS-038: `/multi-review` の統合レポートは、型付き verdict 行の書式が崩れたレーンの指摘を `stray-token` として黙って落とすため、統合レポートだけを読むと Suggestion を取りこぼしうる

| Kind | problem | Count | 1 |
| First | 2026-10-15 | Last | 2026-10-15 |
| Status | active | Issue | なし |

レビュアーが `- verdict: suggestion failure_scenario=no ...` のように、重大度を `severity=` キーを付けずに位置で書くと、typed-verdict のパーサーがその行を拒否する。統合レポートには載らず、生成ログに 1 行出るだけになる → 統合レポートに加えて、各レーンのレポート本文（`.review-results/<cli>/<perspective>.md`）を直接読み、ログの `rejected` 行が指す指摘を拾い直す。

- 2026-10-15: Issue #556 / PR #557。claude-code の test-analysis が出した Suggestion 1 件（MASTER.md と VALID_STATUS_VALUES の一致テスト）について、統合レポートの生成ログに `rejected (stray-token)` が出た。統合レポート本体での欠落は確かめていない。レーンのレポート本文を読んで拾い、対応した（初回）

---

<a id="obs-039"></a>

### OBS-039: `/ace-refine` の大量整理で、移送・保全・一意性検証をスクリプト 1 本で回せる前提を見積もりに入れないと、乖離率 0.33 の過大見積もりになる

| Kind | problem | Count | 1 |
| First | 2026-10-16 | Last | 2026-10-16 |
| Status | active | Issue | なし |

アーカイブ 64 件・圧縮 30 件の refine を、移送と検証は手作業、要約はサブエージェント委譲と差し戻し前提で積んだが、実際は verbatim 移送・provenance 付与・一意性検証を 1 本の node スクリプトで行い、要約はコントローラが直接書いて 1 回で通った → 件数の多い refine は「機械的な移送はスクリプト 1 本 + 判断が要る要約だけ件数比例」で積め

- 2026-10-16: Issue #561 / PR #562。AI 予定 4.5h → 実績 1.5h（hook 実測 wallclock 1.1h）、乖離率 0.33（初回）

---

<a id="obs-040"></a>

### OBS-040: CI checks が無い、または Windows で全件ゲートが完走しないリポジトリでは、WSL の Linux クローンで全件ゲートを回すとマージ判定の根拠が得られる

| Kind | keep | Count | 2 |
| First | 2026-10-16 | Last | 2026-10-16 |
| Status | active | Issue | なし |

Windows の Git Bash では `tests/run-all.sh` が 2 時間超で完走せず、PR 単位の CI も無いため、`finish.sh precheck` が `RERUN_FULL_GATE=yes` のまま判定不能になる。WSL へブランチを `git clone` して高速モードの全件ゲートを回すと 140 suite が完走し、Windows では見えない赤（公開ミラー対象ファイルの番号参照）も検出できた → Windows ホストで全件ゲートが要る PR は、最初から WSL の Linux クローンで回す

- 2026-10-16: feel-flow/feelflow-plugins PR #2145。WSL で 2 回実行し、1 回目で `sync-forbidden-patterns` の赤を検出、修正後 139 passed / 0 failed（初回）
- 2026-10-16: Issue #512 / PR #569。Windows では `quality-local.test.ts` が読み込み時に落ちて `quality:local` が完走しない（#570）。そこで WSL のクリーンクローンで `npm ci` 後に 3 回ずつ全 9 段を通し、AC の実測（壊したブロックを入れて 6 段目で止まる）とマージ判定の根拠にした（再発）

---

<a id="obs-041"></a>

### OBS-041: Bash の heredoc 経由で Python に改行コードのエスケープを含む文字列を渡すと、エスケープが剥がれて実制御文字が埋まり、生成物が壊れる

| Kind | problem | Count | 1 |
| First | 2026-10-16 | Last | 2026-10-16 |
| Status | active | Issue | なし |

`python - <<'EOF'` の中に改行コードのエスケープ（バックスラッシュ r / n）を書いて別ファイルへ書き出すと、Bash ツールから Python の文字列リテラル評価までのどこかでエスケープが剥がれ、出力先に実際の CR / LF が入る。JS ファイルへのパッチでは文字列リテラルが行をまたいで構文が壊れ、Markdown への追記では見出しとコードスパンが途中で改行された → 改行コードの表記を含む内容の生成・修正は Bash の heredoc を通さず、Write / Edit ツールで直接書く

- 2026-10-16: PR #562 の作業中、`archive.mjs` の CRLF 対応パッチで発生。ファイルを Write で書き直して 1 往復を失った（初回）。同じセッションで本エントリ自体を heredoc の Python で台帳へ追記した際にも見出しが途中で改行され、Write で書いた差し替え用ファイルから直した

---

<a id="obs-042"></a>

### OBS-042: Git Bash から `wsl.exe -- bash -lc '...'` に渡したコマンド文字列の中の `$?` は正しく展開されず、失敗したコマンドの終了コードが 0 に見える

| Kind | problem | Count | 2 |
| First | 2026-10-16 | Last | 2026-10-16 |
| Status | active | Issue | なし |

`wsl.exe -d Ubuntu -- bash -lc 'false; echo "probe:$?"'` は `probe:0` を出す。終了コードを `$?` で読む検証を `bash -lc` の引数文字列に埋め込むと、実際は exit 1 のスクリプトが exit 0 に見え、存在しないバグを追って `bash -x` で 2 往復した → WSL での検証はスクリプトファイルへ書いて `MSYS_NO_PATHCONV=1 wsl.exe -d <distro> -- bash <ファイルの /mnt パス>` で実行し、終了コードはファイル内で読む

- 2026-10-16: Issue #565 / PR #566 の Linux 検証で、`quality-local.sh` が依存不在で exit 1 を返すのに `EXIT=0` と表示された。スクリプトファイル経由の再測定で `rc:1` を確認（初回）
- 2026-10-16: Issue #512 / PR #569 の WSL 検証。PowerShell から `wsl -- bash -lc '... $n ... $?'` を渡すと、ループ変数 `$n` と `$?` が外側のシェルで展開され、ログ名が `ql-.log`・`rc=0` 固定になった。Git Bash から `wsl.exe -- bash /mnt/c/...` を呼んだ回は、パスが `C:/Program Files/Git/mnt/c/...` に書き換えられて exit 127 になった。どちらもスクリプトファイルを PowerShell 経由で渡し直して解消（再発）

---

<a id="obs-043"></a>

### OBS-043: 検証スクリプトの対象ファイルを `git diff <base>` で決めると、まだ追跡していない新設ファイルが lint・整形検査から漏れる

| Kind | problem | Count | 1 |
| First | 2026-10-16 | Last | 2026-10-16 |
| Status | active | Issue | なし |

`git diff --name-only origin/develop -- '*.md'` はコミット前の未追跡ファイルを含まないため、新設した Markdown だけが markdownlint・prettier に掛からず「全段 EXIT=0」と報告された。実装者が個別に lint を回して MD051 違反を見つけ、判断待ちで 1 往復した → 作業ツリーの検証対象は `git diff` に加えて `git ls-files --others --exclude-standard` で未追跡ファイルも含めるか、コミット後に `git diff <base>...HEAD` で数える

- 2026-10-16: Issue #567 / PR #568。PLAYBOOK-CHANGELOG.md（新設）の移動した本文にある `#ace-045` リンクが MD051 で赤になることを、検証スクリプトが拾わなかった（初回）

---

<a id="obs-044"></a>

### OBS-044: Windows の `core.autocrlf=true` では、作業ツリーの改行が index とずれたまま `git status` は clean に見え、整形ゲートが偽の赤を出したりシェルスクリプトが壊れたりする

| Kind | problem | Count | 1 |
| First | 2026-10-16 | Last | 2026-10-16 |
| Status | active | Issue | なし |

`.gitattributes` に `*.md text eol=lf` を足す前にチェックアウトしたファイルは、作業ツリーで CRLF のまま残る。git は正規化して比べるので `git status` は clean だが、prettier は CRLF を整形違反として数える。`eol` 属性の無い `.sh` は、`git stash` の往復などで git が書き直すと CRLF になり、bash が読めなくなる → 整形ゲートが触っていないファイルで大量に赤くなったら、まず `git ls-files --eol` の `w/crlf` を確かめ、未変更ファイルは削除して checkout し直す。シェルスクリプトにも `eol=lf` を付ける

- 2026-10-16: Issue #512 / PR #569。`format:md:check` が 142 ファイルで赤になり、原因は CRLF のまま残った 213 ファイルだった。再チェックアウトで解消した。同じセッションで、`git stash` / `pop` の往復のあと `scripts/quality-local.sh` が CRLF になった（初回）

---

<a id="obs-045"></a>

### OBS-045: 依存を 1 つ追加しただけでも、ローカルの npm の版が lockfile を書いた版と違うと、無関係な欄の削除が lockfile の差分に混ざる

| Kind | problem | Count | 1 |
| First | 2026-10-16 | Last | 2026-10-16 |
| Status | active | Issue | なし |

`npm install -D --save-exact <pkg>` は、追加した依存のほかに lockfile 全体を手元の npm の形式で書き直す。そのため、optional 依存の `libc` 欄が消えるような、版の違いだけによる差分が入る。プラットフォーム別バイナリの選別に効く欄なので、そのままコミットすると別 OS の `npm ci` の結果が変わりうる → 依存を足したら `git diff package-lock.json` を読み、追加した依存の行以外の差分は元に戻してからコミットする

- 2026-10-16: Issue #512 / PR #569。npm 11.5.2 で `typescript` を追加したところ、`libc` 欄の削除が 10 か所混ざった（16+/30-）。lockfile を戻し、`typescript` の 2 か所（15 行）だけを足し直した（初回）

---
