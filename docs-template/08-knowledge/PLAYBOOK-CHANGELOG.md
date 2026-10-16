# PLAYBOOK Changelog（旧履歴）

> **Parent**: [PLAYBOOK.md](./PLAYBOOK.md) — PLAYBOOK.md の `## Changelog` から移した旧版の変更履歴。
> PLAYBOOK.md には直近の `/ace-refine` の版以降だけを残す（運用ルールは PLAYBOOK.md「行数・件数の方針」）。新しい版ほど上に置く。
> 本文は移動前の記述を逐語で保全しているため、`#ace-xxx` だけのリンクは PLAYBOOK.md の同名アンカー（[PLAYBOOK.md](./PLAYBOOK.md)）を指す。

<!-- markdownlint-disable MD051 -->

## Changelog（旧版）

### [1.64.0] - 2026-10-15

#### 追加

- ACE-559-1: 依存を外すために lockfile を再生成するときは、CI と同じ Node に同梱の npm で再生成し、追加行を含む差分全体が対象エントリの削除だけかを確かめる（Issue #418 / PR #559）

### [1.63.0] - 2026-10-15

#### 追加

- ACE-557-1: 上流の変更を受け取るテンプレートと検証コードが同じ値集合を持つなら、テンプレートを正本と宣言し、両者を読み比べるテストで固定する（Issue #556 / PR #557）

#### カウンター更新

- ACE-018: Helpful 4→5（PR #557 で status の 3 値表記を区切りの揺れ違いを含めて grep で総当たりし、Issue の対象外だった `.claude/commands/pre-commit-check.md` と FRONTMATTER_GUIDE の §1.3 / §3 の取りこぼしを着手時に拾った）

### [1.62.0] - 2026-10-15

#### 追加

- ACE-555-1: 「すべての X は」と書かれた規範の適用範囲を狭めるときは、狭めた範囲の実ファイルで必須条件を実測してから書く（Issue #412 / PR #555）

#### カウンター更新

- ACE-549-1: Helpful 1→2（PR #555 で Issue 本文の推奨 Option A を着手時に実測で確かめ、`docs/` の `active` 15 件と ASDD 2.0 正本との衝突から後続コメントの Option B を採り、AC を書き換えてから実装した再適用）

### [1.61.0] - 2026-10-15

#### 追加

- ACE-553-1: 既存ルールに例外を新設する PR では、その PR 自身の差分を新しい例外の最初の適用例として条件に照らす（Issue #406 / PR #553）

#### カウンター更新

- ACE-019: Helpful 1→2（PR #553 で Changelog だけの例外宣言を Codex が暗黙の policy split として指摘し、(a) 例外の明示で運用ルールの正本へ定義した）
- ACE-023: Helpful 1→2（PR #553 で PR #403 の additions / deletions / changed_files と `GET /pulls/311` の 404 を 1 次情報で照合してから訂正した）
- ACE-465-2: Helpful 0→1（PR #553 で注釈削除を求めた cross-model の修正案が Issue の受け入れ条件と矛盾したため、指摘の核だけ採り、例外条件を広げる側の選択肢で対応した）

### [1.60.0] - 2026-10-15

#### 追加

- 運用ルールに「事実訂正の例外」を追加: 1 次情報で誤りを示せる事実主張（PR / Issue 番号・コミットハッシュ・数値）の訂正に限る限定例外。ACE-019 に従い「末尾追記のみ」の例外を運用ルール上で明示する。条件の正本は `docs/ACE_SETUP.md` §4（Issue #406 / PR #553）

#### 変更

- ACE-020 / ACE-021 / ACE-022 / ACE-023: 運用ルール「事実訂正の例外」に基づき本文の事実誤認を訂正。ACE-021 / ACE-022: PR #403 の撤退コストを「削除 13 + 編集 7、+7/-1842 行」→「13 ファイル削除 + 8 ファイル編集、+7/-1859 行」に訂正。ACE-020 / ACE-021: Obsidian 統合の導入元を「PR #311」（実在しない）→「Issue #311 / commit `6ea43f8`（develop 直 commit）」に訂正。ACE-023 と Changelog `[1.11.0]`: 誤記の引用（-1842）は残し、意図的な引用である旨の HTML コメント注釈だけを添えた。値は PR #403 の additions / deletions / changed_files で照合し、`docs/DESIGN_PRINCIPLES.md` と一致させた（Issue #406）

<!-- 意図的な歴史的記述: 上記「-1842 行」は訂正前の旧値の記録であり訂正対象ではない（Issue #406） -->

### [1.59.0] - 2026-10-15

#### 追加

- ACE-552-1: 通過記録を書く品質ゲートには部分実行オプションを設けず、個別段は各段のスクリプトを直接呼ぶ形で提供する（Issue #389 / PR #552）

### [1.58.0] - 2026-10-15

#### 追加

- ACE-551-1: 外部の正本を写したガードテストのスナップショットだけを更新すると、ガードは緑のまま正本とずれる — 正本の更新と同時に行うか、ずれと追跡先をスナップショット側に明記する（Issue #550 / PR #551）

#### カウンター更新

- ACE-549-1: Helpful 0→1（PR #551 で着手時に PATTERNS.md と §3 範囲を実測し、移設後約 793 行と見積もってから実装した再適用）

### [1.57.0] - 2026-10-15

#### 追加

- ACE-549-1: follow-up Issue に書かれた行数などの実測値は起票時点の値として扱い、着手時に測り直して計画した変更量で受け入れ条件を満たせるかを先に計算する（Issue #511 / PR #549）

### [1.56.0] - 2026-10-15

#### 追加

- ACE-548-1: 生成物の運用手順では「生成成功・CI 成功・取得照合・長期保管」を別々の記録項目として定義し、前段の成功を後段の完了に読み替えさせない（Issue #540 / PR #548）

### [1.55.0] - 2026-10-15

#### 追加

- ACE-547-1: 配布するテンプレートの手順例が配布元のリポジトリ設定（ラベル等）を前提にするなら、実在確認と不在時の代替経路を同じ例に併記する（Issue #545 / PR #547）

### [1.54.0] - 2026-10-15

#### 追加

- ACE-546-1: 入口文書の規則が参照する正本を読者が開けないなら、ポインタで済ませず判定条件を本文に自足させる（Issue #544 / PR #546）
- ACE-546-2: 文書に載せる一覧取得コマンドは、既定の件数上限で黙って打ち切られないよう各行に上限を明示する（Issue #544 / PR #546）

#### カウンター更新

- ACE-505-2: Helpful 0→1（PR #546 で、workflow-doctor の検査対象 4 ファイル外にある同じ旧文言 6 箇所をリポジトリ全体の grep で洗い出し、follow-up #545 へ切り出した再適用）

### [1.53.0] - 2026-10-15

#### 追加

- ACE-543-1: ファイル単位でライセンスが分かれる取り込みは、README のライセンス節に対象パスを列挙し、一覧の正本を由来マニフェストに置く（Issue #542 / PR #543）
- ACE-543-2: 公開リポジトリの文書から別リポジトリへリンクする前に visibility を確かめ、private ならリンクにせず名前で書く（Issue #542 / PR #543）

### [1.52.0] - 2026-09-14

#### 追加

- ACE-539-1: テンプレートツリーの角括弧は未確定値警告に畳み、消費者ツリーだけ leftover と deferred を分岐する（Issue #507 / PR #539）
- ACE-539-2: git と node を複数回 spawn する vitest は既定 5s を超えうる — SKIP_QUALITY_GATE せず it の timeout を明示する（Issue #507 / PR #539）

#### カウンター更新

- ACE-489-1: Helpful 4→5（PR #539 の leftover / deferred / docs-template 報告文言を排他固定した再適用）
- ACE-505-1: Helpful 0→1（PR #539 で「同梱 validate-docs は角括弧を検出しない」注記を検出する旨へ更新し、転記先の事実主張を実装に揃えた再適用）

### [1.51.0] - 2026-09-14

#### 追加

- ACE-537-1: バックグラウンド実行では tail -n へパイプせず、出力は素のまま流して完了後に出力ファイルを絞る（Issue #480 / PR #537）

#### カウンター更新

- ACE-449-3: Helpful 1→2（PR #538 で YAML スニペットを実スキーマへ揃える際、v2 が読む `tasks.review.cost_strategy` まで確認した再適用）
- ACE-489-1: Helpful 3→4（PR #538 の旧キー欠如テストを `perspectives.review` 連続入れ子と合成入力相当のフェンス検査へ強化した再適用）

### [1.50.0] - 2026-09-14

#### 追加

- ACE-536-1: 分類カテゴリの列挙は PLAYBOOK 一覧が正本で、他文書へ写すと再乖離する（Issue #487 / PR #536）
- ACE-536-2: 件数導出のヘッダ行数は HTML コメントをマスクしてから最初の実見出しを探す（Issue #487 / PR #536）

#### カウンター更新

- ACE-001: Helpful 11→12（PR #536 の Codex がヘッダ誤認と旧 130/800 説明残を検出）

### [1.49.0] - 2026-09-14

#### 追加

- ACE-535-1: Git fixture は local user.name を書かず、専用 config と AUTHOR/COMMITTER env に identity を閉じる（Issue #529 / PR #535）

#### カウンター更新

- ACE-459-1: Helpful 0→1（PR #535 の変更源が同じ GIT_DIR 継承）
- ACE-001: Helpful 10→11（PR #535 の Codex が共有 /tmp 設定ファイルの競合を検出）

### [1.48.0] - 2026-09-14

#### 追加

- ACE-534-1: ゲート記録器はレビューシムの版一致検査で解決せず、record-gate-head.sh の実在だけを見る（Issue #515 / PR #534）

#### カウンター更新

- ACE-001: Helpful 9→10（PR #534 の Toolkit code-reviewer が Codex 0 件のあと identity 経路の Critical を検出）

### [1.47.0] - 2026-09-14

#### 追加

- ACE-533-1: 探索順の契約テストは関数定義の出現位置ではなく、隔離環境でリゾルバを実行して検証する（Issue #491 / PR #533）
- ACE-533-2: 推奨入口と互換入口を同じコードフェンスに並べず、エラー案内は実出力の文言で書く（Issue #491 / PR #533）

#### カウンター更新

- ACE-001: Helpful 8→9（PR #533 の Codex code-review が契約テストの偽グリーンを検出）

### [1.46.0] - 2026-09-14

#### 追加

- ACE-532-1: 形式ゲートを入れるときは追記テンプレと Generate 出力ラベルも同時に正準フォーマットへ揃える（Issue #478 / PR #532）

### [1.45.0] - 2026-09-08

#### 追加

- ACE-526-1: 正本移管時に同期の所有対象も限定する（PR #526 / Issue #524）。
- ACE-527-1: 計画の一致と現在の出力の一致を分離し、実ファイルで完了を確認する（PR #527 / Issue #525）。

#### 変更

- エントリテンプレートをコンパクト正準フォーマットへ更新し、旧テーブル形式は読み取り互換とした（Issue #478）

#### カウンター更新

- ACE-484-3 (Helpful 1→2): PR #531 で prettier を `3.8.3` に固定し、`npm ci` 前提を README / 移行設計 §3.3 に書いた（Issue #485 の Action を実施）
- ACE-489-1 (Helpful 2→3): PR #531 の `prettier-pin.test.ts` が caret/tilde の合成入力で検出器自体を固定した再適用

### [1.44.0] - 2026-09-07

#### 追加

- ACE-519-1: 受け入れ条件に検査コマンドを書くときファイル引数でスコープを狭めない — Issue #517 の AC が 2 ファイル限定の grep だったため、同じ無条件主張が `.cursorrules` と `FRONTMATTER_GUIDE.md` に無検査で残った経験から抽出（Issue #517 / PR #519）
- ACE-519-2: 一方向同期のツリーでは同期可否フラグの値ごとに壊れ方が逆になる — `visibility: public` は巻き戻り、`visibility: internal` は下流コピーが凍結する非対称を実測した経験から抽出（Issue #517 / PR #519）
- ACE-519-3: 実体コピーを抱える節は自己申告（反映済み / 設計時点の案）で mirror と記録節を見分ける — ACE-045 と ACE-500-1 が同じ節に逆を指示した状況を解いた経験から抽出（Issue #517 / PR #519）

#### カウンター更新

- ACE-045 (Helpful 2→3): PR #519 で同じ付録 A が 3 度目の drift を起こし、Toolkit comment-analyzer が本エントリを根拠に Critical 判定した再演
- ACE-484-1 (Helpful 1→2): 「実際にコピーされる実体を先に特定する」に従って `sync-to-public.mjs` の同期方向を確認したことで、public 側の修正が次回同期で巻き戻る経路を発見（internal #103 として起票）
- ACE-500-1 (Helpful 0→1): 「記録節は書き換えない」が付録 A の扱いを決め、本文同期ではなく主張文の差し替えという第 3 の選択肢に到達

### [1.43.0] - 2026-09-06

#### 追加

- ACE-516-1: エラー分類を 1 クラスで変えたら写像関数の実際の switch を docstring 化し、禁止カテゴリの列挙箇所を grep で総当たりする — PR #516 で 7 箇所の列挙のうち適用判断表が漏れ、「4xx」スローガンが実写像と食い違った経験から抽出（Issue #514 / PR #516）
- ACE-516-2: ログ経路で形状情報を残すために任意オブジェクトを JSON 化せず、型名 + キー名だけを出し catch 内で対象値に再度触らない — PR #516 で `describeValue` が診断 allowlist を迂回して PII を載せる指摘を Codex / Toolkit が同時に出し、2 巡目で catch 側の toStringTag getter も指摘された経験から抽出（Issue #514 / PR #516）
- ACE-516-3: SDK エラーからのステータス推定は数値範囲でなく HTTP レスポンスの形（`response` 同伴）で判定する — PR #516 で MongoDB の 112 等が範囲チェックを通過して never-fallback に化ける失敗シナリオが示された経験から抽出（Issue #514 / PR #516）

### [1.42.0] - 2026-09-06

#### 追加

- ACE-510-1: エラーの扱いは statusCode やクラス列挙から再導出せず基底の抽象メンバで宣言させ、ラップ境界では transient のときだけ包む — PR #510 で allowlist → ステータス集合 → `category` と 2 段階で直し、ラップ時に分類が消える欠陥が 3 経路・2 巡にわたって見つかった経験から抽出（Issue #486 / PR #510）
- ACE-510-2: 節単位置換の終端に削るつもりのない節を置かず、見出し一覧の before / after を diff する — PR #510 で FALLBACK.md「適用判断ガイド」表を範囲置換で消し、2 巡目レビューまで気づかなかった経験から抽出（Issue #486 / PR #510）

#### カウンター更新

- ACE-045 (Helpful 1→2): PR #510 で SKILL.md に複製された AppError サブクラス定義が「正典は PATTERNS.md」のポインタコメント付きのまま署名変更に追随せずコンパイル不能になり、複製を基底 + 1 例に縮約して他は参照に置換した再演

### [1.41.0] - 2026-09-06

#### 追加

- ACE-508-1: 「違反ゼロ」ガードの検出器で対象を拡張子や表記形式で狭めない — PR #508 で相対リンクの検出正規表現が `.md` 限定だったため DECISION_TREE.md の雛形 `.skeleton.ts` / `.sql` への初期セット外リンク 38 件を素通りし、Toolkit code-reviewer が目視で検出した経験から抽出（Issue #490 / PR #508）
- ACE-508-2: 大量の機械的文書変換はサブエージェントへ委譲し、検出器は自分で先に赤にしてから渡す — PR #508 で 78 リンクの案内テキスト化を規約明示で委譲し 1 往復で通った経験と、委譲側の走査が検出器と同じ盲点を共有していた経験から抽出（Issue #490 / PR #508）

#### カウンター更新

- ACE-484-1 (Helpful 0→1): Issue #490 の「SKILL.md と実態が食い違う」を、着手前に ff-dev-toolkit 同梱版の docs-template を確認して「プラグイン側は案内テキスト化済み・public 側だけが遅れている」と実体を特定してから設計判断した再適用
- ACE-489-1 (Helpful 1→2): PR #508 で走査を findOutOfSetLinks() に切り出し、報告文に参照元と展開先の参照先が含まれることを合成入力で固定した再適用（pr-test-analyzer の指摘で適用）

### [1.40.0] - 2026-09-06

#### 追加

- ACE-505-1: 別実体の文書から規則文を転記するときは、転記先の実体で各事実主張を再検証する — PR #505 で ff-dev-toolkit の init-docs SKILL.md の置換ポリシーを `.claude/commands/init-docs.md` へ写した際、「/validate-docs が検出する」「全文書共通の Frontmatter」が公開リポ側では偽で、Toolkit comment-analyzer と Codex が独立に指摘した経験から抽出（Issue #482 / PR #505）
- ACE-505-2: 名称統一の横断修正では品質ゲートの glob 対象外ディレクトリも grep 範囲に含める — PR #505 で `.claude/commands/setup-ai-config.md` の `review-config.yaml` 残存が lint / format の対象外のためレビューまで残った経験から抽出（Issue #466 / PR #505）

#### カウンター更新

- ACE-045 (Helpful 0→1): PR #505 で git-workflow.md の標準チェックリストを 10 項目にしたが、同テンプレートが運用原則として参照する workflow-principles.md の mirror（標準チェックリストテンプレート）が旧 8 項目のまま残り、Toolkit code-reviewer の Warning で同期した再演

### [1.39.0] - 2026-09-06

#### 追加

- ACE-502-1: 実行環境の下限（engines）を上げたら、その環境を表す型定義パッケージのメジャーも同じ PR で揃える — PR #500 で `mcp/package.json` の `engines.node` を `>=24` にした際に `@types/node` が `^20` のまま残り、Toolkit code-reviewer の Suggestion で発覚して Issue #501 / PR #502 へ分離された経験から抽出

#### カウンター更新

- ACE-498-1 (Helpful 0→1): PR #502 の `@types/node` 24 系更新で、更新後パッケージと推移依存 `undici-types` の `engines` 不在を `>=24.0.0` と照合して完了報告に明記した再適用

### [1.38.0] - 2026-09-06

#### 追加

- ACE-500-1: 「移行前の記録」節を持つ文書で基準値が変わっても記録節は書き換えない — PR #498 / #500 で NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md §2.1（旧 ci.yml の記録）の Node マトリクスを 2 回続けて現行値へ書き換え、Toolkit と Codex が独立に指摘した経験から抽出

#### カウンター更新

- ACE-489-1 (Helpful 0→1): Issue #499 の AC に書いた検出 grep が `node.js` 表記を必須にしていて「Node 20+」を拾えず、残存があるのに緑になっていた。検出器自体を合成ケースで確かめる同エントリの再演

### [1.37.0] - 2026-09-06

#### 追加

- ACE-498-1: 脆弱性解消の依存更新では、更新後パッケージの engines を自分の engines 宣言と照合する — PR #498 で markdownlint-cli2 0.20→0.23 の更新により Node 要件が 22 へ上がったのに `engines` が `>=20` のまま残り、Toolkit と Codex が独立に Warning 検出した経験から抽出

#### カウンター更新

- ACE-484-3 (Helpful 0→1): lockfile 更新の副作用で package.json と lockfile の同期崩れが直り、同エントリの「`npm ci` が通る状態を維持する」が root / mcp とも成立した再適用

### [1.36.0] - 2026-08-28

#### 追加

- ACE-489-1: 「違反ゼロ」を期待するガードは検出器が壊れても緑のまま通る — PR #489 でリンク抽出の正規表現がアンカー付きリンクを取りこぼし、ガードがある状態で回避経路が残っていたのを Toolkit と Codex が独立検出した経験から抽出

#### カウンター更新

- ACE-484-2 (Helpful 0→1): 「配布物のリンク規約は機械検証で固定する」を適用してガードを追加し、同エントリの「テスト名は検証していることだけを名乗る」に従ってテスト名も是正した再適用

### [1.35.0] - 2026-08-28

#### 追加

- ACE-484-1: テンプレート欠陥の修正は「実際にコピーされる実体」を先に特定する — Issue #483 の 8 件を照合したところ 2 件が再現せず、`/init-docs` の実際のコピー元が ff-dev-toolkit プラグイン同梱の docs-template だと判明した経験から抽出
- ACE-484-2: 配布物のリンク規約は Playbook に書くだけでは適用漏れが残る — ACE-046 が記録済みだったのに ISSUE_TEMPLATE の 14 リンクへ未適用で、Codex と Toolkit が独立に同一箇所を Critical 検出した経験から抽出
- ACE-484-3: フォーマッタを caret 範囲で許すと push ゲートが環境依存で赤くなる — prettier 3.9.6 と lockfile 3.8.3 の整形差で未変更 3 ファイルが落ち、`npm ci` も同期崩れで塞がっていた経験から抽出（Issue #485）

#### カウンター更新

- ACE-046 (Helpful 1→2): 「配布版テンプレはリンクを外して inline code にする」が PR #484 の Critical をそのまま解決。Codex と Toolkit code-reviewer が独立に本エントリを根拠として引用した
- ACE-447-2 (Helpful 0→1): 「配布物内リンクは配布ツリー外を指さない」を 7 ファイル・13 箇所へ適用し、公開リポの `blob/HEAD/` 絶対 URL 化で解消した再適用

### [1.34.0] - 2026-07-03

#### 追加

- ACE-469-1: opt-in 公開ゲートの fail-safe は構造破壊入力（閉じデリミタ欠落）で破れる — PR #469 の sync-to-public.mjs で、frontmatter パーサが閉じデリミタ未確認のまま値を採用し本文走査で internal 文書が公開されうる欠陥を Toolkit + Codex が独立検出した経験から抽出
- ACE-469-2: コピーして使う雛形ファイルに opt-in フラグの許可値を焼き込まない — PR #469 の一括 visibility 付与で spec-template.md に public を書き、雛形コピー経由で新規 spec が公開既定になる漏洩リスクを Codex が Critical 検出した経験から抽出

#### カウンター更新

- ACE-449-2 (Helpful 0→1): FRONTMATTER_GUIDE §5.5 の記法例（インラインコメント）が同期スクリプトを fail させる乖離を検出し、例文をパーサ対応 + 回帰テストで固定した再適用
- ACE-464-3 (Helpful 0→1): sync-to-public.mjs の不正 visibility / 壊れた frontmatter 検証を「1st pass で全分類 → 書き込みゼロで exit 1」の入口 fail-loud 集約として設計した再適用

### [1.33.0] - 2026-07-03

#### 追加

- ACE-465-1: パース後どこからも読まれないデッドフラグ / デッド設定は「実装 vs 削除」を既定動作との重複と命名スキーマの整合で判定する — PR #465 で `multi-agent.sh --delegate-toolkit` を、既定の分散プランと重複し `toolkit_delegation` のキー名も perspective 実体と不一致だったため削除した経験から抽出
- ACE-465-2: cross-model が指摘した「互換性破壊」も、修正案が Issue の明示的決定と矛盾するなら盲従せず実害（呼び出し元の実在）を検証して判断する — PR #465 で Codex のみが breaking change を指摘したが、互換レイヤー案は Issue #451 案2 と矛盾し呼び出し元も実在しないため意図的 breaking change として明記した経験から抽出

#### カウンター更新

- ACE-445-1 (Helpful 4→5): Toolkit 4 観点が pass した breaking change を Codex（cross-model）のみが検出
- ACE-449-3 (Helpful 0→1): `toolkit_delegation` という別の「読まれない飾りキー」を削除して実態と一致させた

### [1.32.0] - 2026-07-03

#### 追加

- ACE-464-1: 集約レポートの stale 混入は「削除」でなく「読む側を今回の実行計画（EXECUTION_PLAN）にスコープ」して断つ — PR #464 で multi-agent.sh のレポートが glob で前回 perspective を混入する問題を、削除ではなくプラン駆動の読み取りに転換して解決した経験から抽出
- ACE-464-2: cross-model レビューが実質的な新指摘を出し続けるなら各指摘を patch せず設計を疑え・停止は「新規 Critical/Important 不在」 — PR #464 で Codex を 9 round 回し、削除ベース設計への指摘が収束せずプラン駆動へピボットして構造的に解消した経験から抽出
- ACE-464-3: 複数経路が同じ untrusted トークンを消費するなら消費地点ごとの silent skip でなく入口で一度 fail-loud 検証する — PR #464 で traversal ガードが read/clear のみで write 経路が無防備＋silent continue が malformed plan を隠蔽していた指摘から抽出

#### カウンター更新

- ACE-001 (Helpful 7→8): Toolkit が pass した設計を Codex が traversal/stale 等で反復検出
- ACE-445-1 (Helpful 3→4): Claude 系 Toolkit 全 pass 箇所を cross-model が指摘
- ACE-447-3 (Helpful 0→1): 9 round の cross-model を「新規 Critical/Important 不在」で停止判断（code PR へ適用）

### [1.31.0] - 2026-07-02

#### 追加

- ACE-462-1: 安全ゲートをスキップするか判定するループでは空文字・想定外入力を安全側（ゲート実行）に倒す — PR #462 で pre-push の削除 push スキップ判定 `case *[!0]*` が空 local_sha を「全ゼロ」と同一視しゲート回避する fail-open を Toolkit silent-failure-hunter が検出した経験から抽出

### [1.30.0] - 2026-07-02

#### 追加

- ACE-459-1: git hook 環境から spawn するサブプロセス git は GIT\_\* を除去しないと実リポジトリを破壊する — PR #459 で worktree からの push 中に pre-push → vitest → テストフィクスチャの git が GIT_DIR を継承し、実ブランチへのコミット混入・core.bare=true 書き換えが発生した経験から抽出
- ACE-459-2: linked worktree での並行開発は「メインと同じ」前提が3箇所で破れる — PR #459 で husky 不発（.husky/\_ untracked）・gitignore の symlink すり抜け・共有 config 汚染を1セッションで全部踏んだ経験から抽出
- ACE-460-1: git diff の出力をパスで分類するツールは --no-renames を付ける — PR #460 の review-level.sh で rename 表記がセンシティブパス判定をすり抜ける実バグを Toolkit pr-test-analyzer が実測検出した経験から抽出

#### 更新

- ACE-445-1（同系列レビュアーの全員一致こそ cross-model の出番）Helpful: 2 → 3 — PR #459 で Claude code-reviewer「指摘なし」の乖離計算バグを Codex が Critical 検出、PR #460 では逆に Codex code-reviewer PASS の rename バグを Claude pr-test-analyzer が検出。cross-model の価値が双方向であることを補強

### [1.29.0] - 2026-07-02

#### 追加

- ACE-449-1: `set -e` 下の bash 関数は末尾を `[[ cond ]] && cmd` で終わらせない — PR #449 で `multi-agent.sh --dry-run` が完全無出力で死ぬ既存バグ（`apply_task_defaults`）を発見・修正し、silent-failure-hunter の水平走査で `load_config` にも同一クラスが残存（実機再現）した経験から抽出
- ACE-449-2: 「既定から外す」変更はデータの空化ではなく明示的なゲート条件で実装し、ドキュメントに書いたオプトイン手順はその場で回帰テストに固定する — PR #449 で Copilot の review perspectives 空化が `--cli copilot-cli` オプトインを無言 no-op にし、Codex cross-model が検出。ゲート実装 + 空プラン exit 1 + 9 テスト固定で解消した経験から抽出
- ACE-449-3: 「設定駆動」を謳う config を編集する前に、そのキーが実際にスクリプトから読まれているか確認する — PR #449 で `agent-config.yaml` の perspectives が実装から一切読まれない飾りキー（実体はスクリプト内ハードコード + `review-config.yaml` は symlink）と判明した経験から抽出

#### 更新

- ACE-445-1（同系列レビュアーの全員一致こそ cross-model の出番）Helpful: 1 → 2 — PR #449 で Claude 系 code-reviewer が「信頼度80以上の問題なし」とした copilot オプトイン no-op を、Codex（gpt-5.4）の code-reviewer / silent-failure-hunter が Critical として独立検出した事例として補強

### [1.28.0] - 2026-06-23

#### 追加

- ACE-447-1: 別ドキュメントへの anchor 付きリンクは実見出しの slug と一致させる — label↔URL ミラー（ACE-016）だけでは壊れたアンカーを作りうる — PR #447 で Issue テンプレの `PATTERNS.md#エラーハンドリング` が実見出し `## 3. エラーハンドリング`（slug `#3-エラーハンドリング`）と不一致でリンク切れになり Codex code-reviewer が検出した経験から抽出
- ACE-447-2: 配布物（docs-template/）内のリンクは配布ツリー外を指さない — ドッグフード絶対URLの相対化で `../../../` がツリーを脱出する — PR #447 で配布側 Issue テンプレの撤退コスト参照が `../../../docs/DESIGN_PRINCIPLES.md` となり「配布物が自己完結しない」と Codex が検出した経験から抽出
- ACE-447-3: 大規模 doc PR の cross-model レビューは clean verdict に収束しない — ゲートは「Critical 不在＋実 Important 全対応」、green を待ってループしない — PR #447 で Codex を3ラウンド回し毎回 REJECTED（Critical=0・doc 整合 nit のみ）だった経験から抽出

#### 更新

- ACE-445-1（同系列レビュアーの全員一致こそ cross-model の出番）Helpful: 0 → 1 — PR #447 で「5 観点」表記が実 6 項目という数え違いが opus 全ブランチレビュー（同系列）を通過した一方、Codex cross-model の comment-analyzer / code-reviewer が独立検出した事例として補強

### [1.27.0] - 2026-06-19

#### 追加

- ACE-445-1: Claude 系レビュアーが「既存と整合的だから OK」と全員一致した箇所こそ cross-model レビューの出番 — 同系列の合意は正しさの証明ではない — PR #445 で subagent task レビュー ×2 + 最終 opus レビューが全員承認し opus は明示的に修正に反対した loose な `Number.parseInt` を、Codex (gpt-5.4) の silent-failure-hunter / code-reviewer が入力検証ギャップ（`"800abc"`→800 等）として検出。共有ヘルパー `parsePositiveIntEnv` に抽出し `/^[0-9]+$/` で厳密化した経験から抽出

#### 更新

- ACE-001（異なる AI モデルは異なるカテゴリの問題を検出）Helpful: 6 → 7 — PR #445 で Claude 系 3 レビュー（subagent task ×2 + opus 最終 whole-branch）が全員 APPROVED した loose parseInt を Codex が単独検出。同系列レビューの全員一致が cross-model の出番を示すシグナルだった事例として補強

### [1.26.0] - 2026-05-30

#### 追加

- ACE-443-1: framework リポは自テンプレをドッグフードするため知見ベースは `docs-template/` 配下 — AI レビュアーの「docs-template→docs」パス提案は実在確認してから採否を決める — PR #443 で Gemini が `.cursorrules`/`AGENTS.md` の `docs-template/...` 参照を `docs/...` に変更提案したが、本リポに `docs/08-knowledge/` が不在でリンク切れになるため `ls` 確認の上で不採用とした経験から抽出

#### 更新

- ACE-018（横断変更は着手前に grep で全 SSOT を列挙）Helpful: 3 → 4 — PR #443 で ACE 採番ポインタを `.cursorrules`/`AGENTS.md` に追加したが repo 自身の `.github/copilot-instructions.md` を取りこぼし、Toolkit code-reviewer が Warning 検出。同セッション内で advisor（#441 で AI_GIT_WORKFLOW/CLAUDE.md）・user（Codex/AGENTS.md）に続く 3 度目の「全サーフェス列挙漏れ」で、着手前 grep 列挙の運用徹底の重要性を再確認
- ACE-016（anchor link は label と URL の両方に書く / explicit anchor で slug 変更耐性）Helpful: 3 → 4 — PR #443 で §4 見出しリネームに伴う inbound link 切れを explicit anchor `<a id="ace-ops-template">` 付与で予防（全角括弧で auto-slug が脆いケース、explicit anchor 適用の 3 例目）。advisor が編集前に予防的指摘
- ACE-014（索引文書は SSOT を子に集約）Helpful: 3 → 4 — PR #443 で採番メカニクスを ACE_SETUP §4 + PLAYBOOK §エントリID規則 の SSOT のみに置き、AGENTS.md/.cursorrules/SETUP\_\* はポインタに統一。grep で新規ポインタファイルへの非重複（DRY）を検証

### [1.25.0] - 2026-05-30

#### 追加

- ACE-441-1: ドキュメントを走査するツールの正規表現を緩めるときは実ファイルで件数検証し、パターンを「実 ID の形」に制約する — PR #441 で ACE 検出正規表現を緩めた際、code fence 内のエントリテンプレ `### ACE-XXX:` を誤検出して実 PLAYBOOK 集計が 46→47 になり、実ファイル検証ステップで捕捉した経験から抽出（PR スコープ式 ID の初適用エントリ）
- ACE-441-2: pre-commit hook は正式品質ゲート（quality:local）の軽量サブセット — pr-ready 前に必ず full ゲートを回す — PR #441 で markdownlint hook は全 commit 0 error だったが `quality:local` の `format:md:check`（prettier）が 3 ファイルで落ちた経験から抽出

#### 更新

- ACE-016（anchor link は label と URL の両方に書く）Helpful: 2 → 3 — PR #441 でマージ方針 SSOT リンク（ace-cycle.md / ace-curate.md / AI_GIT_WORKFLOW.md の「§運用パターン（マージ方針）」）が `#` フラグメント無しのファイルリンクで先頭着地する欠陥を Toolkit comment-analyzer と Copilot が独立検出。全角括弧で auto-slug が脆いため explicit anchor `<a id="ace-merge-policy">` を付与して解消（ACE-016 の explicit anchor 適用の 2 例目）
- ACE-018（横断 grep で SSOT 列挙）Helpful: 2 → 3 — PR #441 でマージ方針反転の残骸スイープを「編集した 5 ファイル」に限定したところ、advisor が AI_GIT_WORKFLOW.md / CLAUDE.md の取りこぼしを検出。元の ACE-012 carve-out が適用された 5 サイトと同じ全集合をリポジトリ全体 grep で列挙すべきだった事例（ACE-018 の指摘構造と完全一致）
- ACE-042（テンプレ placeholder の符号統一）Helpful: 0 → 1 — PR #441 で参照リンク形式の「`XXX` はエントリ ID をそのまま使用。新規は `ace-438-1`」記述が `[ACE-ace-438-1](#ace-ace-438-1)` の接頭辞重複を招くと Gemini が指摘。placeholder `XXX` の置換対象（接頭辞 `ACE-`/`ace-` を除いた部分）を明示して解消

### [1.24.0] - 2026-05-20

#### 更新

- ACE-016（anchor link は label と URL の両方に書く）Helpful: 1 → 2 — PR #438 で `.github/ISSUE_TEMPLATE/bug.md` L32（`[PATTERNS.md#エラーハンドリング](.../PATTERNS.md)`）と `infra.md` L26（`[ARCHITECTURE.md#インフラ](.../ARCHITECTURE.md)`）の「ラベルに `#anchor` を含むのに URL 側にフラグメント欠落」パターンを **Copilot review が「ACE-016 で言及されているパターン」と PLAYBOOK エントリ名を明示引用して指摘** した事例。Gemini Code Assist も独立に同じ 2 箇所 + `feature.md` L22/L23 の placeholder 形 `#該当セクション` を medium 指摘し、AI レビューワー（Copilot/Gemini）が PLAYBOOK を内化して同パターンを継続検出する運用が確立
- ACE-046（PR/Issue body 内の相対リンクは絶対 URL 化）Helpful: 0 → 1 — PR #437（PR テンプレ 4 箇所）と同一の `blob/HEAD/` 絶対 URL 化方針を PR #438 で `.github/ISSUE_TEMPLATE/` 配下 16 箇所に **機械的に再適用** した事例。`grep -rn '\.\./\.\./docs' .github/ISSUE_TEMPLATE/` → 0 件 / `grep -rn 'blob/HEAD/' .github/ISSUE_TEMPLATE/` → 16 件で受け入れ条件を実証ベースで確認し、子 Issue #436 を一発でクローズ。同一知見が複数 PR（#437 と #438）で再利用された事例として補強

### [1.23.0] - 2026-05-20

#### 追加

- ACE-046: PR/Issue body 内の相対リンクは `pull/N/` または `issues/N/` 起点で展開される — リポローカルテンプレでは `blob/HEAD/` 絶対 URL を使い、配布版は plain text にする — PR #437 で `.github/pull_request_template.md` の 4 箇所を絶対 URL 化した経験 + HEAD リクエスト実証データ（`repo/docs/X.md` は 404、`blob/HEAD/docs/X.md` は 200）から抽出

#### 更新

- ACE-001（クロスモデルレビュー）Helpful: 5 → 6 — PR #437 で Toolkit code-reviewer は「Critical/Important なし、承認推奨」だったが Gemini Code Assist が medium 2 件（L39 絶対 URL 化漏れ + L54 リンクテキスト一貫性）を独立検出。Toolkit 単独では catch できない漏れを Gemini が補完した事例で、auto-attach 経路の費用対効果を再確認
- ACE-044（review 指摘スコープを編集セクション境界で判定）Helpful: 1 → 2 — PR #431 で `../docs/` 指摘を「pre-existing で L15/L54 を巻き込む」として別 Issue #430 / #433 系に分割した判定が PR #437 で本格対応として完遂。「別 Issue 化判定 → 後続 PR で纏めて対応」のサイクルが機能した事例として補強

### [1.22.0] - 2026-05-20

#### 追加

- ACE-045: 設計文書内の「mirror 付録（実体の参照用コピー）」は本体改稿で silent drift する — mirror を持つなら本体改稿で同期、または mirror を削って外部参照に置換 — PR #431 で `docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md` 付録 A が本体 PR テンプレ簡略化と drift し Toolkit code-reviewer I1 (88%) が検出した経験から抽出

#### 更新

- ACE-001（クロスモデルレビュー）Helpful: 4 → 5 — PR #431 で Toolkit comment-analyzer (Suggestion 4 件) + Toolkit code-reviewer (Critical C1 + Important I1) + Copilot (3 inline comments) + Gemini Code Assist (org 設定で auto-attach、2 inline comments) の **4 系統が独立検出**。Gemini auto-attach により追加コストなしでレビュースタックが拡張された事例
- ACE-014（索引文書 SSOT 集約）Helpful: 2 → 3 — PR #431 で `quality:local` の chain 列挙を **README + PR テンプレ + 付録 A の 3 箇所**に持っていた SSOT 違反を、`§3.3` 1 箇所に集約 + 他 2 箇所を参照型に整理した事例。Related に [ACE-045](#ace-045) を追加
- ACE-016（anchor link は label と URL の両方に書く）Helpful: 0 → 1 — PR #431 で `[\`docs/...\` §3.3](../docs/...)`が label に`§3.3`を含むが URL に`#anchor`欠落のパターンを Toolkit code-reviewer C1 (95%) が再検出。fix は`<a id="quality-local-detail"></a>`を §3.3 見出し直前に付与し、参照側を`#quality-local-detail` で固定（PLAYBOOK 外で初適用）。explicit anchor 採用で heading slug 変更（日本語 / コードフェンス / コロン混在）への耐性も獲得
- ACE-044（review 指摘スコープを編集セクション境界で判定）Helpful: 0 → 1 — PR #431 で 2 種類のスコープ判定をドッグフード: (a) Gemini の `../docs/` 相対パス指摘は touched ファイル内 (L28) だが pre-existing で L15/L54 を巻き込むため **spawn task で別 Issue 化**、(b) Appendix A drift は別ファイルだが **「mirror であることが明示」carve-out** で同 PR 内 fix commit に統合（[ACE-045](#ace-045) Action 2 として運用ルール化）

### [1.21.0] - 2026-05-20

#### 追加

- ACE-043: 品質ゲート script の chain と文書の「統括内容」記述は drift する — 自然文サマリではなく実体 script 名で列挙する — PR #429 で `quality:local` の chain に `build:spec-index` を追加した際、`FRONTMATTER_GUIDE.md §2` 表 / `NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md §3.2-3.3` の自然文サマリ記述が drift しており PR #416 review が pre-existing 誤記として検出 (Issue #417) した経験から抽出
- ACE-044: review 指摘を取り込むスコープは「編集セクション境界」で判定する — 触ったセクション内の隣接 stale は同 PR、別ファイル / 別セクションは別 issue — PR #429 で Toolkit comment-analyzer が同 §3.2-3.3 内の W1 / W2（pre-existing）と README.md:74 / PR テンプレ:28（S2/S3）を検出し、3 段階のスコープ判定で前者を同 PR fix commit、後者を #430 で別対応とした経験から抽出

#### 更新

- ACE-025（スクリプトの対象範囲を実装列挙で書く）Helpful: 0 → 1 — PR #429 で「不在で no-op」のような慣用語ではなく「specs=0 で `dist/spec-index.json` を空索引として書き出し exit 0」と実装挙動を字面で書く事例として補強。Related に [ACE-043](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/08-knowledge/playbook/archive/documentation-quality.md#ace-043) を追加

### [1.20.0] - 2026-05-20

#### 追加

- ACE-042: テンプレファイル内の同一概念 placeholder は同一シンボル + 大文字で統一する — PR #428 で `<a id="ace-xxx">` / `### ACE-XXX:` / `<a id="ace-NNN">` の 3 種混在を Copilot + Gemini が独立に placeholder rot リスク / 主語曖昧さの異なる切り口で検出した経験から抽出

#### 更新

- ACE-001（クロスモデルレビュー）Helpful: 3 → 4 — PR #428 で Toolkit code-reviewer（Changelog 同期違反 + 表セル幅）/ Toolkit comment-analyzer（SSOT 違反 4 ファイル）/ Copilot（placeholder 符号統一）/ Gemini（主語曖昧さ）の 4 モデルが互いに重ならない構造問題を独立検出
- ACE-014（索引と実体の SSOT 集約）Helpful: 1 → 2 — PR #428 で 2 種類の SSOT 違反を同時検出（(a) 同じ anchor 命名規則を 4 文書に重複、(b) frontmatter `version` を bump して Changelog 項目を追加し忘れた索引-実体の同期漏れ）
- ACE-018（横断 grep で SSOT 列挙）Helpful: 1 → 2 — PR #428 で受入基準 2 文書だけ列挙したが advisor が「実 mutation point である `.claude/commands/ace-curate.md` の anchor テンプレも更新しないと silent rot」と指摘 → enforcement 点列挙が不足していた事例
- ACE-035（ドッグフード + advisor）Helpful: 1 → 2 — PR #428 で着手後 advisor を呼び、(a) ace-curate.md の mutation point ギャップ、(b) implementation-notes 取り扱い、(c) anchor の手動 navigation 検証必要性 の 3 件を pre-substantive で発見

### [1.19.0] - 2026-05-20

#### 追加

- ACE-001〜041 の各エントリ直前に explicit anchor (`<a id="ace-NNN"></a>`) を 41 件付与（Issue #425）
- エントリテンプレート / 記述ガイドラインに anchor 命名規則を追加（小文字 + ハイフン + 3 桁ゼロパディング）
- 他ドキュメントからの ACE 参照を `[ACE-NNN](path/to/PLAYBOOK.md#ace-nnn)` 形式に統一（旧 3 形式を撤去）

### [1.18.0] - 2026-05-20

#### 追加

- ACE-038: 「データ収集待ち」を要求する受入基準でも、ロールバック容易な変更は先行実装 + 試行中ステータス明記でフィードバックループを早める — PR #423 で Issue #421 受入基準（5 PR 運用待ち）を 1 行 diff + 試行中明記の組み合わせで先行実装した経験から抽出
- ACE-039: AI プロンプトテンプレに「分析観点リスト」と「分類カテゴリリスト」が並存する場合、新観点追加時はカテゴリ対応を観点側に明記する — PR #423 で Gemini Code Assist が「観点 7 のカテゴリ対応が L62 リストに無い」と検出した medium 指摘から抽出
- ACE-040: AI プロンプトテンプレ内で同概念を複数の語で表現すると AI 出力品質が下がる — 一次定義（SSOT）の語彙に統一する — PR #423 で「spec 乖離 / 逸脱 / 変更した点」の 3 表記揺れが comment-analyzer S3 で検出された経験から抽出。ACE-024 の dual
- ACE-041: マージ後 cleanup の未追跡ファイルガードに引っかかったら、独立した chore PR で .gitignore 追加して cleanup を継続する — PR #423 cleanup 中に `.codex/config.toml` 未追跡で止まり chore PR #427 で解消した経験から抽出

#### 更新

- ACE-035（ドッグフード + advisor）Helpful: 0 → 1 — PR #423 description で「採用しなかった選択肢（5 PR 待ち）」「ロールバック条件」を明記したことが観点 7 用 raw material のドッグフードとして機能した実例

### [1.17.0] - 2026-05-19

#### 追加

- ACE-035: 新規 process パターンを Playbook に追加するときは「ドッグフード + advisor / second opinion」で運用上の構造問題を検出する — PR #420 でドッグフードした implementation-notes.md の扱い (a) → (b) pivot 経験から抽出。advisor を呼ばずにマージしていたら develop ルートで構造的衝突が起きていた具体例
- ACE-036: 外部知見（SNS / ブログ / 社内 wiki）を Playbook に取り込む前に既存 ACE エントリ全件と grep 照合する — Anthropic エンジニア公開プロンプトを ACE-034 として取り込む際の照合手順から抽出。ACE-018（自リポ横断 grep）と相補的
- ACE-037: ACE エントリの新規追加は対応する運用手順（workflow / self-review / ace-cycle）への組み込みを同 PR で済ませる — PR #420 で Playbook + git-workflow + ace-cycle を同時改稿した経験と Copilot 整合性指摘から抽出

#### 更新

- ACE-001（クロスモデルレビュー）Helpful: 2 → 3 — PR #420 で Copilot（semantic 矛盾検出） + Gemini Code Assist（SSOT 同期検出）の役割分担を観察、別カテゴリ問題が並列レビューで発見された

### [1.16.0] - 2026-05-19

#### 追加

- ACE-034: 実装中は implementation-notes.md を作業ブランチに並走させて spec 乖離・トレードオフ・判断理由を捕捉する — Anthropic エンジニア公開実装プロンプト（"keep a running implementation-notes file with decisions / changes / tradeoffs"）と本リポ Playbook (ACE-001〜033) を grep 照合した結果未抽出と判明。コミット diff に残らない in-flight な判断ログを並走させることで ACE Phase 1 Generate の入力品質を底上げする（ACE-009 / ACE-023 / ACE-032 を補強）

### [1.15.0] - 2026-05-19

#### 追加

- ACE-031: ドキュメントを書くときは配布境界に基づいて「想定読者」を意識する — PR #416 で frontmatter ガイドが「採用者向け」を謳いつつ配布境界 P2 外の MCP サーバーを value 主張として紹介していた事例。配布境界と想定読者の不一致が判明（ACE-021 を補強）
- ACE-032: 機能撤去型の改稿後は、残った value 主張・周辺記述・論理連鎖が全て成立しているか改めて読み直す — PR #416 で MCP value 撤去後に「AI ツールが索引で絞り込む」value 主張だけが宙に浮き、`MCP test` 記述が周辺取り残しになり、`§5.4.2` 「AI 提供用」表現が `§2.1` と矛盾した事例（ACE-022 を補強）
- ACE-033: 対応表で全行 / 全 cell が uniform になったら、表自体が情報を持っていないサイン — PR #416 の §7.1 表が MCP 行撤去後に 5 行中 4 行 ✅ uniform になり情報量が薄くなった事例。共通項を 1 文に集約し差別化情報のみ表にする（ACE-026 / ACE-030 を補強）

#### 更新

- ACE-023: Helpful +1（PR #416 で MCP 関連の事実主張を撤去する際、`mcp/package.json` の依存宣言まで一次情報照合したことで unused `js-yaml` 依存を発見、Issue #418 を起票）
- ACE-029: Helpful +1（PR #416 で MCP value 撤去時に `mcp/src/index.ts` の import 文を実体確認することで `js-yaml` が宣言済みなのに未使用という乖離を検出、Issue #418 として別 Issue 化）

### [1.14.0] - 2026-05-19

#### 追加

- ACE-028: 外部ツールの「現状」仕様を書くときは公式ドキュメントを WebFetch / WebSearch で必ず照合する — PR #414 で Copilot / Codex CLI が MCP 非対応と書いたが、両者とも 2026 年現在対応済み（VS Code Agent mode GA 2025-04 / `codex mcp add`）、Cursor の `.cursorrules` も deprecated と判明。LLM training cutoff 起因の事実誤認を防ぐ（ACE-023 を補強）
- ACE-029: 外部ツール依存物（shell script の依存コマンド、shebang、インストーラオプション）を文書化するときは実体を読んで列挙する — PR #414 で `.husky/pre-commit` の要件を「sh.exe 必要」と書いたが、実体は `grep`/`xargs` も使用しており「sh + coreutils」が正解。Git for Windows のインストーラオプションも「インストールすれば OK」では不十分（ACE-025 を補強）
- ACE-030: 対応表で `⚠️` を多用したら判定軸自体が間違っているサイン — PR #414 で Cursor の MCP を「⚠️ 一部対応」と書いたが、実態は完全実装で判定軸自体が崩壊。判定軸を「対応有無」から「対応方法・条件」に切り替えるのが正解（ACE-026 を補強）

### [1.13.0] - 2026-05-19

#### 追加

- ACE-025: スクリプトの「対象範囲」を文書化するときは glob 表現ではなく実装上の対象列挙方式まで踏み込む — PR #411 で `validate-docs.mjs` の検証対象を「`docs-template/**/*.md`」と glob 表現で書いたが、実装は `CORE_DOCS` 配列で固定 7 ファイル列挙方式だった。Toolkit code-reviewer W1 + Copilot review が独立検出（ACE-023 を補強）
- ACE-026: 同名関数が複数ファイルに併存する場合は機能対応表で並列説明する — PR #411 で `parseFrontMatter` 3 実装（utils.ts / validate-docs.mjs / build-spec-index.mjs）を単数形で一括説明したが、`>-`/`|` 処理・配列構文・ネスト map 等で挙動差があった。Toolkit comment-analyzer が Critical C1/C2 検出、Copilot/gemini も独立指摘
- ACE-027: 配布対象ファイル内の行番号 hard-coded 参照は採用後に即陳腐化するため heading anchor 化する — PR #411 で `docs-template/MASTER.md:147` 等 6 箇所以上の行番号参照を使用。配布対象は採用者のコピー先で確実にズレるため、heading anchor 形式に置換（ACE-016 を補強）

### [1.12.0] - 2026-05-07

#### 追加

- ACE-024: SSOT で確立した用語を再利用する前に既存定義との衝突を確認する — PR #409 で「コア 7 文書 + ルート直下」見出しがフレームワーク既定の「コア 7 文書」（MASTER/PROJECT/ARCHITECTURE/DOMAIN/PATTERNS/TESTING/DEPLOYMENT）と意味衝突。Toolkit comment-analyzer + Copilot が独立に Critical 検出（ACE-014 / ACE-018 を補強）

#### 更新

- ACE-014: Helpful +1（PR #409 で MASTER.md 内 2 箇所の表が drift リスクを生んだため、SSOT を README に集約し片方を pointer 化。索引集約パターンの再確認）
- ACE-018: Helpful +1（PR #409 で「サブフォルダ内ファイルに番号プレフィックスを付けない」ルールを書く際、既存 6 件の違反（best-practices/0X-_, github-copilot/0X-_）を grep で検出すべきだった反省。ルール導入前の SSOT 列挙の重要性が再確認）
- ACE-019: Helpful +1（PR #409 で best-practices/0X-_, github-copilot/0X-_ を「読み順を強く示したい複数パートの分割文書」例外として明示。暗黙の policy split を Toolkit + Copilot が両方 Critical 検出）

### [1.11.0] - 2026-05-07

#### 追加

- ACE-023: ドキュメント中の事実主張（PR/Issue 番号・ハッシュ・数値）は執筆時に 1 次情報で照合する — PR #405 で「PR #311」「-1842 行」と書いた値が実態と乖離（実態: Issue #311 / commit 6ea43f8 直 commit、-1859 行）し Toolkit が Critical 検出。ACE-002 を「事実関係全般」に拡張

<!-- 意図的な歴史的記述: 上記「-1842 行」は PR #405 で誤記した値の引用であり訂正対象ではない（Issue #406） -->

### [1.10.0] - 2026-05-07

#### 追加

- ACE-020: 自動コンテンツ生成ツールは自身のマーカー文字列を本文に含むドキュメントを破壊する — `obsidian-sync.mjs` が `## Linked from` を section header と誤認し OBSIDIAN_GUIDE.md を 379→26 行に破壊した再帰汚染バグから抽出
- ACE-021: テンプレ配布リポでは「リポ自身が使うインフラ」と「テンプレ利用者が受け取る成果物」を物理的に分離する — Obsidian インフラを `docs-template/` 配下に置いたことで配布物が Obsidian 前提になった構造的問題から抽出（ACE-005 を補強）
- ACE-022: 機能削除時は consumer だけでなく定数・型・ユーティリティも grep して取り残しを防ぐ — PR #403 で `BACKLINKS_SECTION_*` 定数が dead code として残存、Toolkit code-reviewer が検出（ACE-018 を補強）

### [1.9.0] - 2026-05-06

#### 追加

- ACE-018: 横断的な番号・順序変更は着手前に grep で全 SSOT を列挙する — 想定の 2〜3 倍のファイルに散らばっている
- ACE-019: 既存ルール違反になる新パターンは「例外」として明示的に名乗らせる — 暗黙の policy split は Toolkit/Copilot が Critical として検出する（ACE-012 への carve-out 整備）

### [1.8.0] - 2026-05-06

#### 追加

- ACE-015: 表を導入したら散文の主張を表に対して再読する — 「N 段階」「太字の領域」型の自己矛盾は人手レビューで見落とされる
- ACE-016: Markdown の anchor link は label と URL の両方にフラグメントを書く — `\[text#anchor\]\(url\)` 形式は無効（ACE-013 を補強）
- ACE-017: 並列 review agent は worktree を巻き戻す副作用を持ち得る — `git status` 監視と `git restore --source=HEAD` で復旧する

### [1.7.0] - 2026-05-06

#### 追加

- ACE-012: PR マージ・push 前は必ず `git status` でブランチを確認する（develop 直 push 事故防止）
- ACE-013: 並列 reviewer の指摘は古い snapshot 由来の誤検知を含む — 実態 grep で双方向検証する
- ACE-014: 索引文書は SSOT を子に集約し、自身は誘導と 1 行サマリのみ — 数値の重複は持たない（ACE-005 を補強）

### [1.6.0] - 2026-04-30

#### 追加

- ACE-011: Prettier × markdownlint MD060 衝突は当該テーブルだけに `<!-- prettier-ignore -->` を付与する局所抑制で解く

### [1.5.0] - 2026-04-30

#### 追加

- ACE-010: Issue クローズ前は commit log でなく現在のファイル実体を grep 照合する — silent regression を検出する

### [1.4.0] - 2026-04-26

#### 追加

- ACE-007: Claude Code skill 内のツール参照は名称・subagent_type を実機 / system prompt で照合する
- ACE-008: クロスリポジトリ操作する skill は全 gh コマンドに `--repo` 必須・mention は `@<assignee>` を使う
- ACE-009: 長時間 Orchestrator の失敗の真因は upstream Issue spec 曖昧さ — 探索型 refine が必要

#### 更新

- ACE-001: Helpful +1（PR #374 で 4 reviewer が独立に Critical 検出、クロスモデルレビューの価値再確認）
- ACE-002: Helpful +1（PR #374 で `Task` ツール名 / `gh state` UPPERCASE / `gh` フラグなど実機照合の重要性が再確認）
- ACE-004: Helpful +1（PR #374 で「同じ 4 観点」主張と実装の乖離・Architectural 継続動作と Out-of-Scope の矛盾を検出）

### [1.3.0] - 2026-04-26

#### 追加

- ACE-005: 索引と実体を分離する委譲パターンでAIコンテキスト消費を抑える
- ACE-006: サンプル付きテンプレファイルには⚠️SAMPLEバナーと固有化手順を必ず併設する

### [1.2.0] - 2026-03-18

#### 追加

- ACE-004: ドキュメントの動作説明は実装メカニズムと一致させる

#### 更新

- ACE-001: Helpful +1（PR #350 でクロスモデルレビューの有効性が再確認）
- ACE-002: Helpful +1（コマンド実在確認の重要性が再確認）

### [1.1.0] - 2026-03-10

#### 追加

- ACE-001: クロスモデルレビューの検出パターン差異
- ACE-002: CLIフラグの実機確認必須ルール
- ACE-003: bash 3.2 macOS互換性の知見
- GitHub Discussion #320 にナラティブ版を投稿

### [1.0.0] - YYYY-MM-DD

#### 追加

- 初版作成：Playbook テンプレート、運用ルール、エントリテンプレートを定義
