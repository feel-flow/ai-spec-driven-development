# PLAYBOOK Archive — アーキテクチャ (architecture)

> **Parent**: [PLAYBOOK.md](../../PLAYBOOK.md) — アーカイブ済みエントリの保管場所。
> `playbook/archive/` 配下は `ace_entry_count`・カテゴリ件数ゲート・reuse 集計の対象外。
> 参照リンクが切れていた場合はこのディレクトリを ID で grep して探す。
>
> **保全本文内の相対リンクは live 基準**: 各エントリ本文は原文を verbatim 保全しているため、本文中のリンクは live の PLAYBOOK.md（`docs-template/08-knowledge/` 直下）を基準に書かれている。`#ace-xxx` だけのリンクは `../../PLAYBOOK.md#ace-xxx`（リンク先自体がアーカイブ済みならこのディレクトリを ID で grep する）、`./` や `../` で始まるリンクは `docs-template/08-knowledge/` からの相対パスに読み替えること。このディレクトリから直接辿ると (a) ファイルが存在しない、(b) anchor が無い、(c) **live ではなくアーカイブ済みの複製に着地する**（リンクチェッカーには映らない）のいずれかになる。live のエントリは [PLAYBOOK.md のエントリ一覧](../../PLAYBOOK.md#エントリ一覧) から引くこと。

---

<!-- markdownlint-disable MD051 -->

## アーカイブ済みエントリ

<a id="ace-005"></a>

### ACE-005: 索引と実体を分離する委譲パターンでAIコンテキスト消費を抑える

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | architecture         |
| Origin     | PR #369 / Issue #368 |
| Date       | 2026-04-26           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: AI が常時参照する中心文書（MASTER.md / PATTERNS.md 等）には **索引（概要 + リンク）のみ** を置き、実体は専用ファイルに分離する委譲パターンを採用すると、AI は必要なときだけ実体ファイルをロードできるためコンテキスト消費が抑えられる。文書側の認知負荷も下がり、レビューしやすい diff になる。

**Context**: PR #369 で Decision Tree（配置判断ガイド）を docs-template に追加する際、既存の `FALLBACK.md`（PATTERNS.md 3.3 節から委譲）と同じ構造を採用。MASTER.md には 1 行リンクのみ、PATTERNS.md には「概要表 + 詳細リンク」の索引セクション（11節）、実体は新規 `DECISION_TREE.md` に集約。pr-review-toolkit / Codex の 5/5 レビューでも整合的な階層として APPROVED。

**Action**: docs-template に大型ガイド（100行超）を追加する際は、(1) MASTER.md など最上位文書には**1〜2行のリンクのみ** 追加、(2) PATTERNS.md など中間文書には「概要表 + 詳細リンク」の索引セクションを置く、(3) 実体は専用ファイルに集約。既存の参照実装: `FALLBACK.md`, `DECISION_TREE.md`。

---

<a id="ace-014"></a>

### ACE-014: 索引文書は SSOT を子に集約し、自身は誘導と 1 行サマリのみ — 数値の重複は持たない

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                             |
| ---------- | ------------------------------ |
| Category   | architecture                   |
| Origin     | PR #391 / PR #393 / Issue #295 |
| Related    | ACE-005（補強）                |
| Date       | 2026-05-06                     |
| Helpful    | 4                              |
| Harmful    | 0                              |
| Status     | active                         |

**Insight**: ACE-005 で「索引と実体を分離する委譲パターン」を導入したが、**索引側に「概要だから」と数値表をミラー掲載すると DRY 違反となり、子の閾値変更時に索引が同期漏れる事故が起きる**。索引には「子へのリンク + キーワードレベルの 1 行サマリ」のみを置く。閾値などの具体値は表ではなくテキスト中に「**500 / 800 / 1200 行** の三段階（検討 / 推奨 / 必須）」のように 1 行で要約する。これにより、子で閾値を変えても索引側は「リンク先で SSOT を確認すればよい」状態を保てる。

**Context**: PR #391 で `ORGANIZATIONAL_ROLLOUT.md`（索引）に 4 子ガイドへのリンクと並べて「文書分割の閾値」表（500/800/1200 を 3 行）を併記した。これが子文書 `document-splitting.md` の閾値表と完全に重複し、Toolkit / Gemini Code Assist が「索引が SSOT」「子が SSOT」「MASTER.md は子が SSOT として参照」の三重宣言になっていると指摘。PR #393 で索引の閾値表・アーカイブ判定表・月次ヘルスチェック項目セクションを削除し、サマリ表 1 つに集約（「**500 / 800 / 1200 行** の三段階（検討 / 推奨 / 必須）」など 1 行ずつ）。さらに索引運用ルールに「子の数値・手順を索引にコピペしない（DRY 違反）」を明記して、SSOT を子側に一本化した。

**Action**: 索引 + 子の構造を採用する際:

1. **索引冒頭に SSOT マッピング表を置く**: 各カテゴリ（閾値 / 判定基準 / 項目リスト等）について「正本はどの子ガイドか」「索引は誘導のみか SSOT か」を表で宣言。読者は「数値の正本」を 1 ホップで見つけられる。
2. **索引には数値表を置かない**: 表を作る場合は「サマリ」列のみ（具体値は 1 行のキーワードに留める）にする。「行数 / 判断 / 詳細リンク」のような 3 列以上の表は子に委譲。
3. **索引の運用ルールに「子の内容をコピペしない」を明記**: 将来の作業者（人 / AI）が「親にも書きたい」誘惑を抑止する保険文。
4. **数値変更時のチェックリスト**: 子の閾値を変えたら `grep -rn "<旧数値>" docs-template/ docs/` で他文書の散らばりを確認 → 索引のサマリ行のキーワードが依然正確か（「500/800/1200」を「200/400/800」に変えたら索引も）を確認。
5. **書籍 / 仕様書からの引用は子側で「準拠出典」として明記**: 「書籍 第14章準拠」「RFC ZZZZ 準拠」を子の SSOT 行に書き、索引には「（詳細は子）」のリンクのみ。一次出典が書かれていない索引数値は孤立しやすく、別 SSOT が割り込みやすい。

---

<a id="ace-021"></a>

### ACE-021: テンプレ配布リポでは「リポ自身が使うインフラ」と「テンプレ利用者が受け取る成果物」を物理的に分離する

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | architecture         |
| Origin     | PR #403 / Issue #402 |
| Related    | ACE-005              |
| Date       | 2026-05-07           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 「リポジトリ自身が動くプロジェクトでもあり、かつ他者がコピーするテンプレートでもある」二重用途のリポでは、**配布対象ディレクトリ（例: `docs-template/`）にリポ自身の運用インフラを置くと、テンプレ利用者にもノイズが伝播する**。リポメンテナの利便（自分のドキュメント管理を Obsidian でやりたい等）と、テンプレ利用者の最小構成（URL 参照だけで使い始めたい）は本質的に競合する。物理的な分離（別ディレクトリ）でしか解決できず、`.gitignore` や条件分岐では足りない（テンプレを clone する人は `.gitignore` 込みで受け取る）。

**Context**: 本リポは AI 仕様駆動開発の **テンプレートを配布する** ことが第一目的で、利用者は `docs-template/` をコピーして 7 文書ベースで使い始めることを想定している。しかし Issue #311 / commit `6ea43f8`（develop 直 commit）で Obsidian 統合を `docs-template/.obsidian/`、`docs-template/08-knowledge/OBSIDIAN_GUIDE.md`、`docs-template/08-knowledge/OBSIDIAN_EVALUATION.md` 等に配置したことで、**テンプレ利用者にも Obsidian 前提のインフラが付随**するようになった。さらに自動 backlinks 生成が `docs-template/` 配下の全 .md に `## Linked from` セクションを付与する設計だったため、利用者がコピーした瞬間「Obsidian で開く前提のテンプレ」になる。利用者が Obsidian を使わない場合これらは全部ノイズで、AI に読ませた際のトークン消費にも直結する。PR #403 で全削除に至った最大の構造的理由がこれ。

**Action**: 二重用途リポを設計する際:

1. **「テンプレ利用者がコピーするか？」を各ディレクトリに対して明示する**: README に「`docs-template/` は配布対象、`docs/` はリポ解説、`scripts/` はリポ運用」のような **配布境界マップ** を 1 表で書く。新規ファイル追加時にどちらかを選ばせる強制力にする。
2. **リポ自身の運用インフラは配布ディレクトリ外に置く**: Obsidian/Notion/Hugo など特定ツールに依存する設定・スクリプト・ドキュメントは `docs-template/` の外（リポルート直下や `.repo/`、`tools/` 等）に置く。配布対象に入れるのはツール非依存の素の Markdown だけにする。
3. **配布物の Markdown には自動生成セクションを書き込まない**: backlinks/TOC/メタ情報は配布物本体の中ではなく、別ファイル（`backlinks.json` など）として生成し、それを使いたい利用者が opt-in で参照する形にする。利用者の本文を mutate しない。
4. **PR レビュー時に「これは配布されるファイルか？」を必ず問う**: `docs-template/` 配下の変更は **テンプレ利用者の受け取りに影響する変更** である。コードレビューチェックリストに「テンプレ利用者は Obsidian/特定ツールがなくても使えるか？」を含める。
5. **撤退コストの試算を導入時に行う**: 「もし採用しないことになったら何ファイル消すことになるか？」を導入 PR の段階で試算する（PR #403 では 13 ファイル削除 + 8 ファイル編集、+7/-1859 行）。撤退コストが大きすぎる導入は、配布境界外でまず試行するか、採用判断を先延ばしにする。

---

<a id="ace-464-1"></a>

### ACE-464-1: 集約レポートの stale 混入は「削除」でなく「読む側を今回の実行計画にスコープ」して断つ

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値           |
| ---------- | ------------ |
| Category   | architecture |
| Origin     | PR #464      |
| Date       | 2026-07-03   |
| Helpful    | 0            |
| Harmful    | 0            |
| Status     | active       |

**Insight**: 共有ディレクトリを glob して集約するレポートが前回実行の成果物（stale）を拾う問題を「stale を削除する」で直そうとすると、消しすぎ（他実行・ユーザーのファイル破壊）vs 残しすぎ（別 task 再利用・同名残骸）のジレンマから逃れられない。読む側を「今回の実行計画（例: `EXECUTION_PLAN` の cli:perspective エントリ）が産んだファイルだけ」にスコープすれば、プラン外は原理的に読まれず、ディスクは非破壊のまま stale が混入しない。

**Context**: `multi-agent.sh` のレポートが `${OUTPUT_DIR}/${cli}/*.md` を無条件収集し前回だけ実行した perspective を「今回の結果」として混入。当初「実行前クリーンアップ（削除）」で対処したが、cross-model レビューが破壊性（共有 --output-dir のユーザーファイル/他 CLI 結果の消失）と残留（別 task 再利用・rename 時の stale）を反復指摘し収束しなかった。

**Action**: 集約/レポートが「今そこにある成果物を全部読む」設計は stale 混入源。まず consumer を「今回の既知集合（実行計画・マニフェスト）」にスコープする。同名上書き漏れ対策の削除が要るなら「今回どうせ再生成する自分の出力先だけ」に限定し（他は非破壊）、出力欠落は削除で隠さず「⚠️ No output」として可視化＋exit code に反映する。

<a id="ace-465-1"></a>

### ACE-465-1: パース後どこからも読まれないデッドフラグ/デッド設定は「実装 vs 削除」を既定動作との重複と命名スキーマの整合で判定する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値           |
| ---------- | ------------ |
| Category   | architecture |
| Origin     | PR #465      |
| Related    | ACE-449-3    |
| Date       | 2026-07-03   |
| Helpful    | 0            |
| Harmful    | 0            |
| Status     | active       |

**Insight**: 未使用フラグ / config キーを見つけたとき「せっかくあるから実装する」に流れる前に 2 点を確認する。(1) その機能が意図する挙動が**既定動作で既に実現されていないか**、(2) config のキー名が**実装が実際に消費する識別子と一致しているか**。両方が「削除」を指すなら、実装は既定動作の焼き直し＋二重命名スキーマの維持コストにしかならない。削除して案内と実態を一致させる。削除する場合の回帰テストは「フラグが消えたこと」でなく「**未知オプションとして fail-loud（exit 1）になったこと**」を検証する（元の欠陥が silent-ignore だったため、silent 経路が消えたことを証明する）。

**Context**: PR #465 で `multi-agent.sh --delegate-toolkit` を削除（Issue #451）。このフラグは parse 後どこからも読まれず（[ACE-449-3](#ace-449-3) の飾りキーと同型）、指定しても exit 0 で silent に無視されていた。実装案（`agent-config.yaml` の `toolkit_delegation` を読む）を検討したが、(1) その CLI 割り当ては `build_distributed_plan`（既定の分散プラン）とほぼ同一で重複、(2) `toolkit_delegation` のキー（`code-reviewer` 等 = pr-review-toolkit サブエージェント名）は orchestrator の perspective 実体名（`code-review` / `error-handler-hunt`）と一致せず対応 perspective ファイルも存在しない、という二重の不整合が判明。削除を選び、`--delegate-toolkit` が exit 1 + `Unknown option` を返す回帰テストを固定した。

**Action**: パース後未使用のフラグ / config キーを見つけたら、まず (a) `grep` でそのキーを読むコードの実在を確認（[ACE-449-3](#ace-449-3)）、(b) 意図する挙動が既定動作と重複しないか、(c) キー名が実装の消費識別子と一致するかを見る。実装が既定の焼き直し or 命名スキーマの新設・維持を要するだけなら削除する。削除時は使用例を全ドキュメントから消し（`grep` で 0 件確認）、回帰テストは「未知オプション → exit 1 + エラーメッセージ」の fail-loud を検証する。

<a id="ace-510-1"></a>

### ACE-510-1: エラーの扱い（フォールバック可否・再試行可否）は statusCode やクラス列挙から再導出せず、基底の抽象メンバで各サブクラスに宣言させる — ラップ境界では「一時障害のときだけ包む」規則と対にしないと、包んだ瞬間に分類が消える

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | architecture | Origin | PR #510 / Issue #486 |
| Related | ACE-505-1 |
| Date | 2026-09-06 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

docs-template のエラー例で、禁止カテゴリをクラス列挙（allowlist）→ HTTP ステータス集合へ直したところ、type-design-analyzer が「どちらも整数値域からの再導出で、サブクラス追加時に強制されない（`SecurityError` のステータス変更で黙って外れる、`InternalError` が 5xx だから再試行される）」と指摘した。`abstract readonly category: "never-fallback" | "transient" | "permanent"` を基底に置き、`isNeverFallback` / `isRetryableError` を category 判定にすると、サブクラス追加時にコンパイルが宣言を要求し、判定関数側の集合は不要になる。ただし分類は**ラップ境界で消える**: サービス固有型（`PaymentError` = transient）で正規化済みエラーを無条件に包むと 401 が transient に化け、fallbackInProdOnly と再試行が認証失敗を一時障害として扱う（決済・メール・正典 `processUser` の 3 経路で同じ欠陥がレビュー 2 巡にわたって見つかった）。「transient のときだけサービス固有型で包み、それ以外はそのまま伝播」を全ラップ箇所に適用し、`grep "new XxxError("` で cause が AppError の箇所を総当たりする。

---

<a id="ace-516-1"></a>

### ACE-516-1: エラー分類を 1 クラスで変えたら、写像関数の実際の switch を docstring に列挙し、禁止カテゴリの列挙箇所を grep で総当たりする — 「4xx は never-fallback」のようなスローガンは実写像（404 = permanent、429 = transient）と食い違い、適用判断表・チェックリスト・SKILL の表のどれか 1 つが必ず取り残される

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | architecture | Origin | PR #516 / Issue #514 |
| Related | ACE-510-1 |
| Date | 2026-09-06 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

`UpstreamRejectedError.category` を permanent → never-fallback に 1 行変えたところ、禁止カテゴリの列挙が `ErrorCategory` コメント・FALLBACK.md §1 リスト・チェックリスト「4 種」・適用判断ガイド表・SKILL.md §3 表 / §7 コメント / §8 判断基準表の 7 箇所に写し取られており、Issue の追記だけでは適用判断表が漏れ、レビュー 1 巡目で silent-failure-hunter が拾った。さらに docstring と §1 に書いた「上流の 4xx は never-fallback」は `normalizeExternalError()` の実際の switch（401/403 → 認証、404 → NotFoundError = permanent、409 → Conflict、429 → transient、残りの 4xx だけ UpstreamRejected）と一致せず、`default:` が 1xx〜3xx まで拒否扱いにしていた既存欠陥も分類の格上げで顕在化した。分類を変えるときは (1) 写像関数の switch をそのまま docstring に書き写す（スローガンにしない）、(2) `grep -rn "認証・認可\|禁止カテゴリ\|N 種"` で列挙箇所を総当たりし、表・コメント・チェックリストを同じコミットで更新する、(3) 格上げで「本番で throw に変わる」経路が既定分岐に含まれていないか `default:` を読む。

---

<a id="ace-516-3"></a>

### ACE-516-3: SDK エラーから HTTP ステータスを推定するとき、数値の範囲（100〜599）だけで採用しない — MongoDB の WriteConflict(112) など別ドメインの整数番号が範囲に収まる。HTTP レスポンスの形（`response` オブジェクトの同伴）を必須条件にする

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | architecture | Origin | PR #516 / Issue #514 |
| Related | ACE-516-1 |
| Date | 2026-09-06 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

SendGrid の `ResponseError` は HTTP ステータスを数値の `code` に入れるため、`readHttpStatus()` に「`code` が 100〜599 の整数なら採用」を足した。silent-failure-hunter が「MongoDB の `MongoServerError.code` は 112 / 189 / 251 / 262 など範囲内の値を多数持ち、リポジトリ層のマッパーを飛ばして `retryWithBackoff` に渡す誤用（FALLBACK.md 自身が『よくある』と警告する経路）では、再試行すべき WriteConflict が `UpstreamRejectedError(upstreamStatus: 112)` = never-fallback になって 1 回目で投げる」と具体化した。範囲は必要条件であって十分条件ではない。SendGrid は `response.headers / body` を持ち Mongo エラーは `response` を持たないので、「`response` が非 null オブジェクト かつ 範囲内」を採用条件にした。他 SDK の独自番号と衝突しうるヒューリスティックは、値域ではなく**形**（同伴フィールドの存在）で判定する。

---

<a id="ace-526-1"></a>

### ACE-526-1: 文書の正本を移すときは同期の所有対象も限定する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | architecture         |
| Origin     | PR #526 / Issue #524 |
| Date       | 2026-09-08           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 正本を移すという説明だけでは、既存の一方向同期が新しい合意を上書きする。公開可否と編集元の所有権を分離し、移管対象だけを同期の作成・上書き・凍結判定から除外する。

**Context**: ASDD 2.0の標準を公開側で編集する方針に合わせ、9パスの限定リストと同期保護を追加した。保護対象の既存ファイルと欠落ファイル、対象外の通常文書を同時に検証した。

**Action**: 移管するパスを列挙し、同期実行側の保護を先に統合する。コピーを止めるだけでなく、orphanなどの報告も所有権と一致させる。対象外の既存同期と公開条件は維持する。

---
