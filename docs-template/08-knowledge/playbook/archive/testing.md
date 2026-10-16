# PLAYBOOK Archive — テスト (testing)

> **Parent**: [PLAYBOOK.md](../../PLAYBOOK.md) — アーカイブ済みエントリの保管場所。
> `playbook/archive/` 配下は `ace_entry_count`・カテゴリ件数ゲート・reuse 集計の対象外。
> 参照リンクが切れていた場合はこのディレクトリを ID で grep して探す。
>
> **保全本文内の相対リンクは live 基準**: 各エントリ本文は原文を verbatim 保全しているため、本文中のリンクは live の PLAYBOOK.md（`docs-template/08-knowledge/` 直下）を基準に書かれている。`#ace-xxx` だけのリンクは `../../PLAYBOOK.md#ace-xxx`、`./` や `../` で始まるリンクは `docs-template/08-knowledge/` からの相対パスに読み替えること。このディレクトリから直接辿ると (a) ファイルが存在しない、(b) anchor が無い、(c) **live ではなくアーカイブ済みの複製に着地する**（リンクチェッカーには映らない）のいずれかになる。live のエントリは [PLAYBOOK.md のエントリ一覧](../../PLAYBOOK.md#エントリ一覧) から引くこと。

---

<!-- markdownlint-disable MD051 -->

## アーカイブ済みエントリ

<a id="ace-441-1"></a>

### ACE-441-1: ドキュメントを走査するツールの正規表現を緩めるときは実ファイルで件数検証し、パターンを「実 ID の形」に制約する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | testing              |
| Origin     | PR #441 / Issue #440 |
| Related    | ACE-042 / ACE-028    |
| Date       | 2026-05-30           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: ドキュメント（PLAYBOOK 等）を走査するスクリプトの見出し検出正規表現を緩めると、その doc 自身が含む **テンプレート/例の placeholder 見出し**（code fence 内の `### ACE-XXX:` 等）まで誤検出しうる。合成 fixture のユニットテストは green でも、実ファイルに対して走らせて初めて件数ズレが露見する。パターンは「拾いたい実体の形」（ID なら数字始まり / `i`＋数字始まり）に制約してテンプレ placeholder を構造的に除外し、緩和後は必ず**本物のファイル**に対して件数を検証する。

**Context**: PR #441 で ACE エントリ ID を PR スコープ式に変える際、`check-category-size.ts` の検出正規表現を `/^### ACE-\d{3,}:/m` → `/^### ACE-[\w-]+:/m` に緩めた。ユニットテスト（合成 fixture）は通ったが、実 PLAYBOOK に `ace:check-playbook-categories` を走らせると総エントリ数が 46→47 になり `coding / architecture / testing / ...` という不自然なカテゴリが出現。原因は緩めた `[\w-]+` がエントリテンプレート（code fence 内）の `### ACE-XXX:` を実エントリとして拾ったこと。旧 `\d{3,}` は `XXX`（非数字）を弾いていたため顕在化していなかった。実装プランの正規表現案が緩すぎた欠陥を、プランの「実ファイル検証」ステップが捕捉した。

**Action**:

1. doc を parse するツールの正規表現を緩めたら、**合成 fixture だけでなく本物のファイルに対して走らせ、件数・カテゴリの妥当性を目視確認する**（プランに「実ファイル検証」ステップを必ず入れる）。
2. パターンは拾いたい実体の形に制約する。ID 検出なら `/^### ACE-(?:\d[\w-]*|i\d[\w-]*):/m`（数字始まり / `i`＋数字始まり）で doc 内のテンプレ placeholder（`ACE-XXX`/`NNN`）を除外。
3. placeholder 除外を回帰テストで固定する（`ACE-XXX` / `ACE-NNN` / `i`＋非数字 `ACE-iabc` を含めて「集計されない」ことを assert）。

---

<a id="ace-484-2"></a>

### ACE-484-2: 配布物のリンク規約は Playbook に書くだけでは適用漏れが残る — 利用者側レイアウトを再現する機械検証で固定する

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | testing              |
| Origin     | PR #484 / Issue #483 |
| Date       | 2026-08-28           |
| Helpful    | 1                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 「配布物のリンクはこう書く」という規約を Playbook に記録しても、適用は人手の grep に依存するため配布ツリーの一部に取り残しが残る。しかも配布物のリンクは **(a) パスが利用者側レイアウトで解決するか** と **(b) レンダリング文脈（Issue / PR body）で解決するか** の 2 軸で壊れるため、片方だけ直して「直った」と誤認しやすい。規約は、利用者側レイアウトを仮想的に組んで全参照を解決する**テスト**として固定しないと再発する。

**Context**: 本リポには [ACE-046](#ace-046)（PR/Issue body の相対リンクは `issues/N/` 起点で 404。配布版は plain text にする）と [ACE-447-2](#ace-447-2)（配布物内リンクは配布ツリー外を指さない）が既に記録されていたが、`docs-template/.github/ISSUE_TEMPLATE/*.md` の 14 リンクには未適用のまま残っていた。PR #484 は初手で「パスのベースを `../../docs/` に直す」だけの修正をしており、(a) は満たしたが (b) を落としていた。これを Codex CLI と Toolkit `code-reviewer` が**独立に同一箇所を Critical 検出**し、両方が根拠として既存の ACE-046 を引用した。追加した回帰テストを develop 時点の内容に対して走らせると、`docs-template/` 混入 13 ファイルと Issue body で壊れる相対リンク 18 箇所を検出して落ちる。

**Action**: 配布物のパス・リンク規約を新設または適用したら、同じ PR で機械検証を足す。検証は「利用者側レイアウト（リポジトリ直下に `.github/` と `docs/` が並ぶ）を写像で再現し、相対リンク・inline code パス・frontmatter references をすべて解決する」形にし、**修正前の内容に対して実際に落ちること**を確認してから緑にする（`scripts/distribution-github-templates.test.ts`）。テスト名は検証していることだけを名乗る（「利用者側レイアウトで解決する」と「配布ツリー内に存在する」は別物で、後者は `/init-docs` の初期セット外への参照を緑のまま通す）。関連: [ACE-046](#ace-046) / [ACE-447-2](#ace-447-2)。

<a id="ace-489-1"></a>

### ACE-489-1: 「違反ゼロ」を期待するガードは検出器が壊れても緑のまま通る — 合成入力で検出器自体を固定する

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | testing              |
| Origin     | PR #489 / Issue #488 |
| Date       | 2026-08-28           |
| Helpful    | 5                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 規約違反を検出するテストは `expect(violations).toEqual([])` の形になりやすい。この形は**検出器（正規表現・分類ロジック）が何も拾わなくなっても緑になる**。しかも入力が実ファイルだけだと、違反が 0 件に収束していく（＝規約が守られるほど検出器の稼働確認が効かなくなる）という性質まで加わる。合成入力で「拾うべきものを拾い、拾ってはいけないものを拾わない」を別テストとして固定しないと、ガードは静かに空振りに退化する。ファイル収集の liveness 検証（`files.length > 0`）はこの穴を塞がない — 塞げるのは「ファイルを集められたか」だけで、「そこから抽出できたか」ではない。

**Context**: PR #489 で配布物のリンク規約ガードを追加した際、リンク抽出の正規表現が `\]\(([^h)#][^)]*\.md)\)` の形で、`.md)` 直結にしか一致しなかった。`foo.md#section` のようなアンカー付きリンクは取りこぼし、**ガードが存在する状態で回避経路が残っていた**（配布ツリーには同じ書き方が 34 箇所ある）。Toolkit `code-reviewer` と Codex CLI が独立にこれを指摘。既存テストは実ファイル入力 + 違反ゼロ期待だったため、正規表現が壊れても検出できない構造でもあった。否定先読み（`(?!https?://|#|mailto:)`）へ変更し、抽出・パス解決・可否判定を合成入力で固定するテスト群を追加した。

**Action**: 規約ガードを書くときは、違反検出のテストと**検出器の自己検証**をセットで置く。自己検証には (a) 拾うべき代表形（今回ならアンカー付き・サブディレクトリ相対）、(b) 拾ってはいけない形（絶対 URL・ページ内アンカー・inline code）、(c) 分類関数の境界値、を合成文字列で書く。リンク抽出の正規表現では「アンカー / クエリの後置」を最初に疑う。「先頭 1 文字で除外する」形（`[^h)#]`）は `](hooks/foo.md)` のような正当な相対パスまで落とすので、除外は否定先読みで意図を明示する。関連: [ACE-484-2](#ace-484-2)（規約は機械検証で固定する）。

---

<a id="ace-508-1"></a>

### ACE-508-1: 「違反ゼロ」ガードの検出器で対象を拡張子や表記形式で狭めない — 除外は理由つきの明示リストで持ち、狭めた分だけ同クラスの欠陥が素通りする

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | testing | Origin | PR #508 / Issue #490 |
| Related | ACE-484-2 / ACE-489-1 |
| Date | 2026-09-06 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

配布物のリンクガードを docs 本体へ広げた際、相対リンクの正規表現が `.md` 限定だったため、DECISION_TREE.md の雛形表にある `.skeleton.ts` / `.sql` への初期セット外リンク 38 件を素通りし、レビュアーが目視で見つけた。展開先で切れるかどうかは拡張子と無関係なので、検出器は「相対パスで拡張子付きのファイルを指すもの」を全部拾い、拾ってはいけない正当な表記（生成物 `.github/copilot-instructions.md`、記入例 `.github/workflows/xxx.yml`、架空例 `docs/specs/*.md`）は `EXEMPT` 集合に**理由コメントつき**で載せる。「拾いすぎを避けるために対象を狭める」より「全部拾って例外を可視化する」方が、例外が増えたときに検査の骨抜きが diff で見える。合成入力の自己検証（[ACE-489-1](#ace-489-1)）には狭めなかったケース（`.ts` / `.sql`）を必ず含める。

---

<a id="ace-527-1"></a>

### ACE-527-1: 計画の一致と現在の出力の一致を別々に検証する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | testing              |
| Origin     | PR #527 / Issue #525 |
| Date       | 2026-09-08           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 計画時のハッシュを照合するだけでは、その後の手編集を検出できない。書き込み前の競合判定と完了判定は、実行時のファイルを読み直して行う。

**Context**: 固定SHAからのテンプレート出力で、verifyが古い状態を成功扱いにし、最初の出力後に編集された後続ファイルを上書きする欠陥を独立レビューで検出した。rename後に別ファイルを変更する実Gitテストで再現した。

**Action**: 全対象の事前確認に加え、各置換直前にもレビュー時の状態と照合する。最後に実際の全出力を検証し、途中変更や部分完了を成功として報告しない。保存済みの計画を再利用したcheckもテストする。

---

<a id="ace-533-1"></a>

### ACE-533-1: 探索順の契約テストは関数定義の出現位置ではなく、隔離環境でリゾルバを実行して検証する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | testing | Origin | PR #533 / Issue #491 |
| Date | 2026-09-14 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

`indexOf("select_cache_toolkit")` が当たるのは関数定義であり、sidecar 解決より前に定義がある限り呼び出し順を逆転させても緑のまま残る。探索順を固定するなら HOME / CODEX_HOME を隔離し、cache と stale sidecar を並べて `--print-toolkit-root=kv` の `source=` を断言する。ソース文字列の前後関係だけを見るテストは、対象の機構を通っていない。

---

<a id="ace-535-1"></a>

### ACE-535-1: Git fixture は local user.name を書かず、専用 config と AUTHOR/COMMITTER env に identity を閉じる

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | testing | Origin | PR #535 / Issue #529 |
| Date | 2026-09-14 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

hook の `GIT_DIR` を 1 spawn でも継承すると `git config user.name` は cwd より呼び出し元リポジトリを向く。継承 `GIT_*` を捨てたうえで local identity は書かず、プロセス固有の `GIT_CONFIG_GLOBAL` と `GIT_AUTHOR_*` / `GIT_COMMITTER_*` だけを渡す。helper の extra に `GIT_DIR` を戻さない。

---
