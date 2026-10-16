# PLAYBOOK Archive — ドキュメント品質 (documentation-quality)

> **Parent**: [PLAYBOOK.md](../../PLAYBOOK.md) — アーカイブ済みエントリの保管場所。
> `playbook/archive/` 配下は `ace_entry_count`・カテゴリ件数ゲート・reuse 集計の対象外。
> 参照リンクが切れていた場合はこのディレクトリを ID で grep して探す。
>
> **保全本文内の相対リンクは live 基準**: 各エントリ本文は原文を verbatim 保全しているため、本文中のリンクは live の PLAYBOOK.md（`docs-template/08-knowledge/` 直下）を基準に書かれている。`#ace-xxx` だけのリンクは `../../PLAYBOOK.md#ace-xxx`（リンク先自体がアーカイブ済みならこのディレクトリを ID で grep する）、`./` や `../` で始まるリンクは `docs-template/08-knowledge/` からの相対パスに読み替えること。このディレクトリから直接辿ると (a) ファイルが存在しない、(b) anchor が無い、(c) **live ではなくアーカイブ済みの複製に着地する**（リンクチェッカーには映らない）のいずれかになる。live のエントリは [PLAYBOOK.md のエントリ一覧](../../PLAYBOOK.md#エントリ一覧) から引くこと。

---

<!-- markdownlint-disable MD051 -->

## アーカイブ済みエントリ

<a id="ace-015"></a>

### ACE-015: 表を導入したら散文の主張を表に対して再読する — 「N 段階」「太字の領域」型の自己矛盾は人手レビューで見落とされる

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #395 / Issue #296  |
| Date       | 2026-05-06            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: 「以下の **二段階の目安** で…」と散文で書きながら直後の table が **3 行**、「**AI に丸投げすると事故る領域は太字** : 要件定義と設計」と書きながら table の 領域 列が **5 行すべて太字** ── このような「散文の主張 vs 表の実体」の自己矛盾は、人間が書いた直後の自己レビューでは catch しにくく、Cross-Model Review で初めて検出される。原因は、表を作りながら散文を書くと「思い描いている表」と「最終的に書いた表」がずれていることに気付かないため。**表を書いたら散文に戻って read-aloud し、表を実際に数えてから断定的な数値・形式の言及をすること**。

**Context**: PR #395 で書籍ギャップ補強として 5 章分のガイドラインを追記した際、`AI_GIT_WORKFLOW.md` step 6 PR サイズ章で「**二段階の目安**」と書きつつ table が 3 行（推奨 / 警告 / 要分割）、`AI_SPEC_DRIVEN_DEVELOPMENT.md` 3.1.3「読み解き方」 bullet で「**太字の領域は**要件定義と設計」と書きつつ table の領域列が **要件定義 / 設計 / コード生成 / テスト / ナレッジ** すべて太字（GFM では強調用途で領域名を一律太字にしていた）── どちらも筆者の自己レビュー / `npm run quality:local` (markdownlint / prettier / MCP check) では検出されず、Toolkit `comment-analyzer` が Critical として両方を独立検出。さらに同じ章では「**実装層は**コード生成・テスト生成・パターン検出」と書きながら table 上「パターン検出」は「ナレッジ」行の AI 役割であり実装層ではないという、**3 つ目の散文-table 不一致**まで検出された。

**Action**: 表を含むドキュメントを書く際に:

1. **table を確定させてから散文を書く**: 順序を「散文 → table」ではなく「table → 散文」にする。table 完成後、表のセル内容を「N 行ある」「X 列が太字」「Y 行は Z 列に属する」という事実から散文を書き起こす。
2. **「N 段階」「N 通り」「太字の」「上の表で」のような数値・形式言及は最後にチェック**: PR 提出前の自己レビューで、これらのキーワードに hit する箇所を全部 grep し、表の現状と一致しているか目視確認。`grep -nE "(段階|通り|太字|上の表|N 行)" <ファイル>` を新ガイド作成のチェックリスト項目として常用する。
3. **散文が table を「要約」する場合は要約の事実性を二重チェック**: 「実装層は X / Y / Z」のような分類言及は、その X / Y / Z すべてが table の対応行にあるか確認。matrix を散文で言い換える際は、行・列のラベルからコピペするのが安全。
4. **Cross-Model Review を必ず通す**: 散文-table 矛盾は人間の単独レビューで通り抜ける典型。Toolkit / Copilot / Gemini のいずれかは概ね catch するため、ガイド系 PR では並列レビューを省略しない。
5. **数値境界は排他的整数で書く**: 「200 行以下 / 200〜400 / 400 超」のような両端重複ではなく「200 行以下 / 201〜400 / 401 行以上」のように境界が排他になる書き方を使う（boundary inclusivity の曖昧さも自己矛盾の一種）。

---

<a id="ace-016"></a>

### ACE-016: Markdown の anchor link は label と URL の両方にフラグメントを書く — `\[text#anchor\]\(url\)` 形式は無効

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #395 / Issue #296  |
| Related    | ACE-013（補強）       |
| Date       | 2026-05-06            |
| Helpful    | 4                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: `\[docs/X.md#section\]\(../docs/X.md\)` のように **anchor をラベル文字列にだけ書き、URL に書き忘れる**形式は GitHub Markdown / GFM で anchor として機能せず、リンク先のファイル冒頭にしか飛ばない。執筆時にはラベルに `#section` が含まれているのを見て「anchor 設定済み」と錯覚しやすいが、リンクとして機能するのは **URL 側の `#section` だけ**。**anchor を含む cross-doc link を書いたら、必ず URL 部分に `#anchor` がコピーされているか目視で確認する**。両方の AI reviewer（Copilot + Gemini Code Assist）が独立に同じ指摘を出した場合は高確度の anchor バグなので、即時 fix commit にまとめる。

**Context**: PR #395 で `.github/pull_request_template.md` line 15 に `詳細: \[docs/AI_GIT_WORKFLOW.md#ステップ6-pr作成\]\(../docs/AI_GIT_WORKFLOW.md\)` と書いた（ラベルに `#ステップ6-pr作成` あり、URL に欠落）。`npm run quality:local` の markdownlint / prettier / MCP check は **anchor の存在検査をしないため** sliently 通過し、PR ready 後に Copilot review と Gemini Code Assist が**独立に同じ Critical 指摘**を返した。両者とも fix suggestion で `(../docs/AI_GIT_WORKFLOW.md#ステップ6-pr作成)` を提案しており、自分でも C1 として既に Toolkit comment-analyzer 経由で検出していたため、3 経路一致で confidence 100。同 PR の `AI_SPEC_DRIVEN_DEVELOPMENT.md` 内 link `docs/AI_GIT_WORKFLOW.md` は anchor を持たない普通の cross-doc link で問題なし、つまりラベルに anchor を書いた場合だけ起きるエラーパターン。

**Action**: cross-doc link を書く際:

1. **anchor を含む場合の必ず通る形式**: `\[label\]\(path#anchor\)` または `\[label#anchor\]\(path#anchor\)`（label と URL の両方に書くか、URL のみに書くか。**ラベルのみに書くのは禁止**）。
2. **PR 提出前の grep チェック**: `grep -nE "\]\(\.\./[^)]+\)" <変更ファイル>` で cross-doc link を抜き出し、ラベル側に `#` があるなら URL 側にも `#` があるか視認。CI で完全自動検出は難しいが、PR 提出前のセルフレビューで意識的に行うと catch できる。
3. **GitHub の anchor 生成規則**: `### ステップ6: PR作成` → `#ステップ6-pr作成`（ASCII を lowercase、コロン削除、空白を `-`、Unicode 文字は保持）。Japanese 見出しでも anchor は機能するが、英数字記号の正規化規則を覚えておく。
4. **複数 AI reviewer の同一指摘は最優先で fix**: Copilot + Gemini + Toolkit が独立に同じ箇所を Critical 指摘した場合、誤検知の確率は極めて低い。ACE-013 では「逆に false positive を疑う」習慣を推奨したが、**3 経路一致は true positive と判定**してよい。
5. **anchor 自動チェックの将来拡張余地**: lint レベルでは markdown-link-check や remark-validate-links のような外部ツールで cross-doc anchor を validate できる。本リポジトリの quality:local には未組込（PR #395 時点）。導入する場合は別 issue で議論。

---

<a id="ace-018"></a>

### ACE-018: 横断的な番号・順序変更は着手前に grep で全 SSOT を列挙する

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #397 / Issue #396  |
| Related    | ACE-014 / ACE-015     |
| Date       | 2026-05-06            |
| Helpful    | 5                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: 「ステップ 8 を 10 に動かす」「順序を A→B→C から A→C→B に変える」のような **番号・順序変更は、想定の 2〜3 倍のファイルに散らばっている** ことが多い。本リポジトリでも当初想定 6 ファイルが、実際には 8 ファイル（CLAUDE.md / AI_GIT_WORKFLOW.md / PRACTICAL_GUIDE.md / MASTER.md / DEPLOYMENT.md / git-workflow.md / ace-cycle.md / ace-curate.md）+ レビュー指摘で取り残し 2 ファイル（knowledge-management.md / DEPLOYMENT.md 別箇所）の計 10 ファイルに及んだ。**着手前に複数のキーワードで grep を仕掛けて SSOT chain を全部列挙し、TodoWrite に登録してから編集を始める**。

**Context**: PR #396/#397 で 10 ステップ Workflow の順序を「ACE 8 → Merge 9 → Cleanup 10」から「Merge 8 → Cleanup 9 → ACE 10」に変更。最初に Issue 起票時には 6 ファイルしか想定しておらず、実装中に追加 2 ファイル（ace-cycle.md / ace-curate.md）を発見。さらに Toolkit comment-analyzer のレビューで **既存リスト・ナビゲーション表など別 2 ファイルの取り残し**が検出され、fix commit で対応。grep キーワードは 1 種類（`"ステップ8: ACE"` だけ）では不十分で、`"マージ前"`、`"Merge\s*→.*Cleanup"`、`"Workflow Step:\s*8"` など **意味的に等価な複数表現を網羅的に**走査する必要があった。

**Action**: 番号・順序変更タスクに着手する前に:

1. **意味的に等価な grep パターンを 5 種類以上用意する**:
   - 番号への直接参照（`grep -rn "ステップ8\|Step 8\|step\s*8"`）
   - 順序の散文表現（`grep -rn "ACE → Merge\|Implement.*Test.*Self-Review"`）
   - 状態説明文（`grep -rn "マージ前\|マージ後\|レビュー完了後"`）
   - 関連メタデータ（`grep -rn "Workflow Step:"`）
   - 散文中の段階数言及（`grep -rn "9 ステップ\|10 ステップ\|N 項目"`）
2. **検出された全ファイルを TodoWrite に登録**: 着手前に「修正対象 N ファイル」を可視化することで、レビューで取り残しが見つかったときに「想定外」ではなく「予定外」として扱える（議論が早い）。
3. **取り残しチェックを PR の受け入れ条件に含める**: 「grep `"<旧表現>"` でヒットなし」という客観的な完了基準を Issue 本文に書く。Toolkit / Copilot review はこの種の網羅性を catch しやすい。
4. **ナビゲーション表・対応マトリクス・チェックリストを意識的に探す**: 「ステップ詳細」だけ更新して「ナビゲーション表」を忘れる事故が多い（PR #397 で発生）。表の説明文・列ラベルもキーワード検索の対象にする。
5. **「歴史的経緯」 callout は意図的な残存として grep 対象から除外**: 「書籍ギャップとの関係」「PR #XXX で順序見直し」のような callout は意図的に古い表現を保持するため、grep 結果から人手で除外する。callout の存在自体を別 grep で確認する（`grep -rn "書籍ギャップとの関係"`）。

---

<a id="ace-023"></a>

### ACE-023: ドキュメント中の事実主張（PR/Issue 番号・ハッシュ・数値）は執筆時に 1 次情報で照合する

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #405 / Issue #404  |
| Related    | ACE-002 / ACE-018     |
| Date       | 2026-05-07            |
| Helpful    | 2                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: ドキュメント中で具体的な PR 番号・コミットハッシュ・数値を書くとき、**記憶や類推で書いた値は高確率で誤りを含む**。執筆中に `gh` / `git` で照合する習慣を持つ。`#N` 表記は Issue 番号・PR 番号の両方で commit メッセージに登場し混同しやすい。

**Context**: PR #405 で「PR #311 (2026-02-12)」を 4 箇所に書いたが `gh pr view 311` → 404、実態は **Issue #311 を参照する commit `6ea43f8`（PR を経ず develop へ直 commit）**。撤退コスト数値「13 削除 + 7 編集、+7/-1842 行」も実態は「13 削除 + 8 編集、+7/-1859 行」（`gh pr view 403 --json additions,deletions,changedFiles` で取得可能）。Toolkit code-reviewer が両方 Critical 検出 → fix commit `b4b5191`。ACE-002（CLI フラグ実機照合）を事実関係全般に拡張した位置付け。

<!-- 意図的な歴史的記述: 上記「-1842」「7 編集」は PR #405 で誤記した値の引用であり訂正対象ではない（Issue #406）。実値は 13 削除 + 8 編集、+7/-1859 行 -->

**Action**:

1. **PR / Issue 番号**: `gh pr view <N>` / `gh issue view <N>` で実在性と所属を確認。`#N` が両方ありうるため不明なら両方照会
2. **コミットハッシュ**: `git log --first-parent` で merge commit 経由か直 commit かを判定（直 commit はガードレール全部スキップしている）
3. **数値**: `gh pr view <N> --json additions,deletions,changedFiles` で 1 次情報取得、または `git show --stat <merge-commit>`

---

<a id="ace-024"></a>

### ACE-024: SSOT で確立した用語を再利用する前に既存定義との衝突を確認する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #409 / Issue #408  |
| Related    | ACE-014 / ACE-018     |
| Date       | 2026-05-07            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: SSOT として新設するドキュメントで「コア 7 文書」のような **フレームワーク内で確立された用語** を再利用するときは、**個数や名称が偶然一致しても意味が同じとは限らない**。新ドキュメントが既存用語を別の意味で使うと読者は誤った mental model を獲得する。Toolkit + Copilot の独立 reviewer が両方 Critical として検出する典型パターン。

**Context**: PR #409 で `docs-template/README.md` を SSOT 新設した際、ルート直下のセットアップ系 7 ファイル（`MASTER.md` + `GETTING_STARTED_*` 3 種 + `SETUP_*` 3 種）を **「コア 7 文書 + ルート直下」** という見出しで列挙した。しかしフレームワーク既定の「コア 7 文書」は `MASTER.md` / `PROJECT.md` / `ARCHITECTURE.md` / `DOMAIN.md` / `PATTERNS.md` / `TESTING.md` / `DEPLOYMENT.md` の 7 ファイル（番号付きフォルダ配下に分散）を指す（`CLAUDE.md` L123-131 等で定義）。個数が偶然 7 で一致したことが衝突を見えにくくした。Toolkit comment-analyzer が C2 として検出、Copilot review も SSOT としての用語整合性を独立検出。fix commit `ab9c968` で見出しを「ルート直下のセットアップ系ドキュメント」に変更し、冒頭で正しい「コア 7 文書」定義を明示した。

**Action**:

1. **SSOT 新設前に固有名詞・カテゴリ名を列挙する**: 新ドキュメントで使う用語（数値、ラベル、見出し）を着手前にピックアップ
2. **各語について grep で既存定義を探す**: `grep -rn "<用語>" docs-template/ CLAUDE.md ai_spec_driven_development.md README.md` で既存利用箇所を全て確認
3. **既存定義があり別の意味で使う場合は別の語を採用**: 衝突するなら命名を変える（例: 「ルート直下のセットアップ系ファイル」のように修飾を加える）
4. **同じ意味で使うなら既存定義へリンク**: SSOT 内で再定義せず、既存ドキュメントへの参照に留める
5. **数や種別の偶然の一致は危険シグナル**: 「7」「コア」「メイン」「標準」のような汎用語が個数まで一致するときは、用語衝突の確率が高いと意識する

---

<a id="ace-025"></a>

### ACE-025: スクリプトの「対象範囲」を文書化するときは glob 表現ではなく実装上の対象列挙方式まで踏み込む

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #411 / Issue #410  |
| Related    | ACE-023 / ACE-043     |
| Date       | 2026-05-19            |
| Helpful    | 1                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: スクリプトの検証対象を「`docs-template/**/*.md`」のような glob 表現で説明されると、読者は「該当パターンに合致する全ファイルが対象」と誤解する。実装が「固定リスト配列で列挙された 7 ファイルのみ存在チェック」のような **glob ではない対象列挙方式** だった場合、glob 表現は嘘になり、読者は「拡張文書を追加すれば CI で守られる」と誤期待する。

**Context**: PR #411 で frontmatter ガイド §2/§4.1 に「`validate-docs.mjs` は `docs-template/**/*.md` のコア 7 文書を検証」と書いたが、実装は `scripts/validate-docs.mjs:16-59` の `CORE_DOCS` 配列で 7 ファイルを列挙し、`scripts/validate-docs.mjs:153-172` で `fs.existsSync` で逐次チェックする形だった。**glob walk は一度も行っていない**。Toolkit code-reviewer W1 と Copilot review が独立検出。実害として、拡張文書（GLOSSARY/DECISIONS/FAQ 等）や PLAYBOOK は frontmatter を持っていても CI 検証されないが、ガイドの記述からはそれが分からない。fix commit で表組みの「入力」列を「`docs-template/` 配下の **固定 7 ファイル**（CORE_DOCS 配列で列挙）」に変更し、§4.1 の検証スクリプト列を「✅ CI 検証 / ❌ CI 対象外」の 2 値表に整理した。

**Action**:

1. **glob 表現を使う前にスクリプト本体を読む**: `walkMarkdown(dir)` 型の glob walk か、`CORE_DOCS`/`KNOWN_FILES` 型の固定リストか、`if (path.match(filter))` 型の条件フィルタかを確認
2. **対象列挙方式を 1 行で明示**: 「固定 N ファイル（X 配列で列挙）」「`docs/specs/**/*.md` を glob 走査」「`*.md` のうち frontmatter 持ちのみ」のように方式名を含めて書く
3. **CI 対象外との対比表を作る**: 「✅ CI 検証」と「❌ CI 対象外」を同じ表で並べる。読者は「自分が書こうとしているファイルがどちらか」を即判定したい
4. **拡張手順を併記**: 固定リスト方式の場合は「拡張対象にしたい場合は X 配列に追加 or 別スクリプト化」と書いておく
5. **glob と固定リストの混在に注意**: 「対象は `docs/**/*.md` だが、一部除外あり」のようなパターンは特に誤解されやすいので除外ルールも明記

---

<a id="ace-026"></a>

### ACE-026: 同名関数が複数ファイルに併存する場合は機能対応表で並列説明する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #411 / Issue #410  |
| Related    | ACE-023               |
| Date       | 2026-05-19            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: リポジトリ内に同名（例: `parseFrontMatter`）で実装が異なる関数が複数存在するとき、「パーサーは ... という制約がある」のように **単数形・一括化** で説明すると、ある実装で通る書き方を別実装で書いて壊れる。**機能 × 実装の対応表** で並列化するのが安全。

**Context**: PR #411 で frontmatter ガイド §5.4.2 に「`mcp/src/utils.ts:33` と `scripts/validate-docs.mjs:74` の `parseFrontMatter` は (...) `>-` / `|` を空文字に丸める、配列は `[a,b,c]` 形式か `- item` 行のみ対応」と単数形で一括説明した。実態は 3 実装で対応機能が異なる:

- `mcp/src/utils.ts`: `>-` のみ flatten、`|` は literal、配列は `[a,b]` と `- item` 両対応
- `scripts/validate-docs.mjs`: `>-`/`|` どちらも特別扱いなし、配列構文 (`[a,b]`/`- item`) は warning
- `scripts/build-spec-index.mjs`: `>-`/`|` 両方 flatten、配列両対応、ネスト map は明示的 skip

Toolkit comment-analyzer が Critical C1/C2 として独立検出、Copilot review、gemini-code-assist も指摘。fix commit で **3 実装 × 5 機能** のチェック対応表に書き直し、「実用上の指針」（どのテンプレが安全か）を併記した。

**Action**:

1. **同名関数を grep で全列挙**: `grep -rn "function parseFrontMatter\|parseFrontMatter\s*=\|parseFrontMatter\s*:" --include='*.{ts,js,mjs,py}'` で実装を全部見つける
2. **サポート機能の集合を縦軸に**: 各実装で扱う YAML/データ機能を全部列挙（配列、ネスト、複数行文字列、コメント、エスケープ等）
3. **`✅ / ❌ / ⚠` の 3 値で対応表を作る**: 機能 × 実装の表で対応状況を一目化
4. **「実用上の指針」を併記**: 「テンプレからずらすときは X 実装を通るか確認」「どの書き方が全実装で安全か」を具体的に書く
5. **複数実装併存自体を解消すべきかも検討**: 対応表が複雑になったら、共通ライブラリ化や 1 実装への統一を別 Issue で提起する

---

<a id="ace-027"></a>

### ACE-027: 配布対象ファイル内の行番号 hard-coded 参照は採用後に即陳腐化するため heading anchor 化する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #411 / Issue #410  |
| Related    | ACE-016               |
| Date       | 2026-05-19            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: `docs-template/MASTER.md:147` のような **行番号 hard-coded 参照** は二重に脆い: (a) 元ファイルの編集で即ズレる、(b) 配布対象 (`docs-template/`) の場合はテンプレ採用者がコピー後に編集するため**確実に**ズレる。**heading anchor / セクションタイトル文字列参照**に置き換えると編集に強い。

**Context**: PR #411 で frontmatter ガイドが `docs-template/MASTER.md:147` (Frontmatter version 参照)、`:363-365` (Spec Kit 拡張宣言)、`:404-413` (spec 6 ステータス表)、`:623-637` (ステータスワークフロー)、`README.md:121`、`PLAYBOOK.md:35,146,280-282` 等、行番号参照を 6 箇所以上で使用。Toolkit code-reviewer S1 が「`docs-template/` は配布対象 (DESIGN_PRINCIPLES.md P2) なので採用者のコピー先で即ズレる」と指摘。検証時点では参照行は全て正確だったが、すぐ陳腐化するリスクが高い。fix commit で全て見出しテキスト形式 (`docs-template/MASTER.md「ステータスワークフロー」`) に置換した。

**Action**:

1. **配布対象 (`docs-template/`) 内ファイルへの参照は heading anchor を強制**: `MASTER.md:147` → `MASTER.md「プロジェクト識別情報」セクション` or GitHub Markdown の slug anchor `MASTER.md#プロジェクト識別情報`
2. **頻繁に編集される SSOT ファイル（MASTER.md / PLAYBOOK.md / 各種運用ガイド）への参照も heading anchor 推奨**
3. **行番号 hard-code は「コード行で論証が必要」な場合のみ**: スクリプト実装の根拠を示す時など。その場合も commit hash を併記して「時点」を明示する（例: `validate-docs.mjs:108-135 (4e59e7c 時点)`）
4. **PR 提出前に grep で棚卸し**: `grep -rnE '\.md:\d+|\.ts:\d+|\.mjs:\d+' docs/ docs-template/` で行番号参照を全列挙し、配布対象 / SSOT への参照を heading anchor 化
5. **GitHub Markdown の anchor slug ルールを把握**: 日本語見出しは小文字化されず空白は `-` に変換、特殊文字は除去される。`#プロジェクト識別情報` のように見出し文字列そのままで動く

---

<a id="ace-028"></a>

### ACE-028: 外部ツールの「現状」仕様を書くときは公式ドキュメントを WebFetch / WebSearch で必ず照合する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #414 / Issue #413  |
| Related    | ACE-023               |
| Date       | 2026-05-19            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: SaaS / IDE / CLI ツール（GitHub Copilot, Cursor, Codex CLI 等）の対応状況・設定方法・推奨ファイル名は **数ヶ月単位で変化** し、LLM の training cutoff より新しい場合は **「古い知識のまま断定する」事故** が起きる。「最新仕様を整理する」型のドキュメントを書く場合、各事実主張ごとに **公式ドキュメント URL を WebFetch / WebSearch で必ず照合** し、出典 URL も併記する。

**Context**: PR #414 で `docs/FRONTMATTER_GUIDE.md` §7.1「AI ツール別 frontmatter 対応状況」を執筆した際、「Copilot は MCP 非対応 ❌」「Codex CLI は MCP 非対応 ❌」「Cursor の指示ファイルは `.cursorrules`」「Cursor の MCP は一部対応」と一般論で書いた。Toolkit comment-analyzer と code-reviewer が独立に公式ドキュメントを照合し、すべて事実誤認と判明: (a) Copilot は VS Code Agent mode 等で MCP GA 済み (2025-04)、(b) Codex CLI も `codex mcp add` で MCP 対応済み、(c) Cursor の `.cursorrules` は 0.43+ で deprecated → `.cursor/rules/*.mdc` 推奨、(d) Cursor の MCP は tools/resources/dynamic context すべて完全実装。本ガイドの中核セクションで「Copilot ユーザーは MCP 経由で `spec_lookup` を使えない」という誤った技術判断を導くリスクがあった。fix commit で対応表を「全 4 ツール ✅、自動呼出 vs 明示設定」軸に再構築し、4 ツールの公式ドキュメント URL を表下に併記した。

**Action**:

1. **「現状仕様」を含む対応表は WebFetch/WebSearch を fact-check の前提に組み込む**: 「GitHub Copilot の MCP 対応状況は？」「Cursor の最新 rules ファイル形式は？」のような問いには **必ず公式ドキュメント URL を取得して照合** してから書く
2. **LLM training cutoff より新しい変化が起きやすい領域を意識**: IDE 拡張機能 (`docs.github.com`, `cursor.com/docs`, `developers.openai.com`)、CLI tool 仕様 (`cli.github.com`)、SaaS API 変更、ライブラリの API stable/deprecated は特に rot しやすい
3. **出典 URL を本文に併記**: 「参考一次情報: [GitHub Copilot MCP](URL) / [Cursor MCP](URL)」のように本文に書き残すと、後で読者・レビュアーが照合しやすく、自分の knowledge cutoff 起因の事故を防げる
4. **執筆時点でわからない場合は明示**: 「2026-05 時点では...」のような時点明示か、「最新仕様は公式ドキュメントを参照」とエスケープする
5. **レビュアー（特に並列レビュー）に WebFetch を期待**: Toolkit comment-analyzer は WebFetch を使って公式情報と照合してくれる。仕様系の主張があるドキュメントは並列レビューを必ず通す

---

<a id="ace-029"></a>

### ACE-029: 外部ツール依存物（shell script の依存コマンド、shebang、インストーラオプション）を文書化するときは実体を読んで列挙する

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #414 / Issue #413  |
| Related    | ACE-025               |
| Date       | 2026-05-19            |
| Helpful    | 1                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: shell スクリプトや hook の「実行要件」を文書化するときは、**shebang だけで判断せず、ファイル本体を読んで使用コマンド（`grep`, `xargs`, `awk`, `find` 等）を列挙する** こと。インストーラ依存の「PATH に通す方法」を書くときは **インストーラの具体オプション名を引用する**。どちらも実体を見ずに一般論で書くと、Windows 等の追加要件のある環境で詰む。

**Context**: PR #414 で frontmatter ガイド §7.2「実行環境別」表に「`.husky/pre-commit` (`#!/bin/sh`) → Windows native では sh.exe 必要」と書いたが、GitHub Copilot review が「`.husky/pre-commit` の実体は `grep -E ... | xargs npx ...` で coreutils も使うため、sh.exe だけでは不足。**`sh + coreutils (grep/xargs)`** が要件」と指摘。また「Git for Windows をインストールすれば `sh.exe` が PATH に通る」と書いたが、Git for Windows のインストーラオプション（「Use Git from Git Bash only」「Use Git from the Windows Command Prompt」「Use Git and optional Unix tools from the Command Prompt」の 3 択）によって `Git\usr\bin` が PATH に追加されるかが変わるため断定できない。さらに gemini-code-assist が「`scripts/*.sh` は `bash` ではなく `sh` で起動を」と suggest したが、`head -1 scripts/*.sh` で確認すると全部 `#!/bin/bash` or `#!/usr/bin/env bash` shebang のため `bash` 実行が整合（gemini の suggest は誤り）。fix commit で (a) `.husky/pre-commit` 要件を「sh + coreutils」に詳細化、(b) Git for Windows の具体オプション名 "Use Git and optional Unix tools from the Command Prompt" を案内、(c) 落とし穴に「`scripts/*.sh` は `#!/bin/bash` shebang のため bash 起動」を明記した。

**Action**:

1. **shell hook / script の「実行要件」を書く前に本体を grep**: `grep -oE '\b(grep|xargs|awk|find|sed|sort|uniq|cut|tr|tee|jq)\b' .husky/* scripts/*.sh` のように依存コマンドを抽出
2. **shebang を一覧で確認**: `head -1 scripts/*.sh` で全 shebang を出す。`#!/bin/sh` か `#!/bin/bash` で起動方法が変わる
3. **インストーラ依存の「PATH」記述はオプション名を引用**: Git for Windows なら「インストーラの "Use Git and optional Unix tools from the Command Prompt" オプション」のように具体的に。「インストールすれば OK」は事故の元
4. **「PATH 通っていなければ手動追加」のフォールバックを併記**: `C:\Program Files\Git\usr\bin` 等の具体パスを書いておくと、ユーザーが詰んだときに自力解決できる
5. **未検証の主張は弱める**: 「Windows + Git Bash で `/merge-cleanup` も動く」のような実機検証していない主張は、「⚠️ 大半は動作（未検証）」のように記号と注釈で正直に表現

---

<a id="ace-030"></a>

### ACE-030: 対応表で `⚠️` を多用したら判定軸自体が間違っているサイン

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #414 / Issue #413  |
| Related    | ACE-026               |
| Date       | 2026-05-19            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: ツール対応表で `✅ / ❌` で判定できず **`⚠️ 一部対応` のような曖昧記号を使う** と、読者は「一部って何？」を想像で埋めて誤った技術判断につながる。`⚠️` が出てきたら **判定軸自体を見直し**、具体的な条件（「✅ 要設定」「✅ Agent mode のみ」等）に切り替えるのが正解。

**Context**: PR #414 で frontmatter ガイド §7.1「AI ツール別」表で Cursor の MCP 列に「⚠️ 一部対応（要設定）」と書いたが、Toolkit comment-analyzer が「Cursor は MCP の初期採用者で、tools/resources/dynamic context すべて完全実装。`一部` というニュアンスは実態と乖離。さらに `要設定` という caveat は Claude Code を除く全ツール（Cursor/Copilot/Codex）に等しく適用される条件のため、Cursor だけにこの注記を付けるのは inconsistent」と指摘。本質的には「MCP 対応の有無」軸自体が崩壊しており、正しい判定軸は「**自動呼出 vs 明示設定**」だった。fix commit で表の判定軸を再構築し、4 ツール全部 `✅` にしたうえで Claude Code は「✅ 自動呼出」、他 3 ツールは「✅ 要設定（.cursor/mcp.json / mcp.json / codex mcp add）」のように具体的な設定方法を併記した。

**Action**:

1. **対応表で `⚠️` を使いたくなったら判定軸を疑う**: `⚠️` は「✅ でも ❌ でもない曖昧領域」を表すが、これは判定軸が現実に合っていないサイン
2. **判定軸を「対応有無」から「対応方法・条件」に切り替える**: 「MCP 対応 ✅/❌」ではなく「MCP の組み込み方（自動 / 設定ファイル / インストール時オプション）」のように具体化
3. **`⚠️` を残す場合は具体的な条件を併記**: 「⚠️ Agent mode のみ」「⚠️ 大半動作（未検証）」のように **何が条件なのか** を即座に分かる形で記述
4. **複数ツール／環境を比較する表は「全 ✅ + 違い列」の形を優先**: 「全部対応している、違いは設定方法だけ」とわかる方が、対応状況の意思決定が容易
5. **レビュー時に `⚠️` をカウント**: PR で対応表を追加するときは `⚠️` 出現数を数え、3 つ以上あれば判定軸の見直しを必ず検討

---

<a id="ace-031"></a>

### ACE-031: ドキュメントを書くときは配布境界に基づいて「想定読者」を意識する（採用者向け / コントリビューター向け / リポメンテナ向け）

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #416 / Issue #415  |
| Related    | ACE-021               |
| Date       | 2026-05-19            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: 配布対象テンプレリポジトリでは、各ドキュメントが **「採用者（テンプレを自プロジェクトに取り込む人）向け」「コントリビューター向け」「リポメンテナ向け」のいずれを想定読者にしているか** を意識して書く。これが曖昧だと「採用者には届かないインフラ機能（MCP サーバー等）」を「採用者向け value」として紹介してしまい、読者を混乱させる。

**Context**: PR #411 / #414 で frontmatter ガイドを「テンプレ採用者向けの導入ガイド」として執筆したが、本リポジトリ自身が運用する MCP サーバー (`mcp/` ディレクトリ、`docs/DESIGN_PRINCIPLES.md` P2 で配布境界外 ❌ No) を「採用者が `spec_lookup` / `spec_search` で minimal context を得る」型の value 主張として記述してしまった。ユーザーから「mcp を入れると（採用者環境で）起動するのか？」と直接質問が出て、ガイドが配布境界を踏み外していたことが判明。PR #416 で MCP value 主張を全撤去し、§1.2 を「CI / 別ツールへの索引提供」視点に書き直して採用者にとっての value を実態に合わせた。

**Action**:

1. **ドキュメント執筆前に想定読者を 1 文で書き出す**: 「このガイドは X を Y するための Z 向け」（採用者 / コントリビューター / リポメンテナ）
2. **配布境界 (`docs/DESIGN_PRINCIPLES.md` P2) と読者を突き合わせる**: 採用者向けガイドで参照するのは「✅ Yes」のディレクトリだけ（`docs-template/` 等）。「❌ No」のディレクトリ（`mcp/` / `scripts/` / `.claude/` 等）は採用者には届かない
3. **「リポ自身が運用するインフラ」を value 主張として書かない**: 配布境界外のものは「コントリビューター向けの実装メタ情報」として注釈付きで残すか、別ドキュメントに切り出す
4. **想定読者と配布境界のズレを PR 説明に明記**: 「このガイドは X 向けで、Y は配布境界外なので除外」と書くと、レビュアーが整合性をチェックしやすい
5. **採用者向けドキュメントは「採用後にも参照される運用ガイド」「採用前に読む手順書（frontmatter なし）」に分ける**: 後者は `docs-template/README.md:121` で「frontmatter を持たないテンプレ」として明示されている

---

<a id="ace-032"></a>

### ACE-032: 機能撤去型の改稿後は、残った value 主張・周辺記述・論理連鎖が全て成立しているか改めて読み直す

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #416 / Issue #415  |
| Related    | ACE-022               |
| Date       | 2026-05-19            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: ドキュメントから機能・主張を撤去するとき、(a) **残った value 主張の実現メカニズムが消えていないか**、(b) **周辺記述（表のセル、別セクションの言及、参考リンク等）に取り残しがないか**、(c) **撤去で論理連鎖が宙に浮いていないか** を改めて読み直す。撤去は追加より見落としが起きやすい。

**Context**: PR #416 で frontmatter ガイドから MCP 関連の value 主張を撤去した際、(a) §1.2「AI ツールに索引で絞り込ませる」という value 主張は残したが、それを実現するメカニズム（MCP `spec_lookup` / `spec_search`）を消したため **実現手段の無い value 主張** が宙に浮いた。Toolkit comment-analyzer W2 が「`dist/spec-index.json` を読む AI 経路が MCP 経由しかなく、MCP 撤去後は実現手段なし」と検出。(b) §2 表の「`npm run quality:local` ... `MCP test`」記述も周辺記述として取り残し（gemini-code-assist が指摘）。(c) §5.4.2 line 299「AI 提供用なら `mcp/src/utils.ts`」が §2.1 の新フレーミング（採用者には配布されない）と矛盾（code-reviewer W1）。fix commit で 3 件まとめて修正。

**Action**:

1. **撤去 PR では各 value 主張をリストアップして「メカニズムは残っているか」をチェック**: 「X できる」と書いてあるなら「X を実現するのは何で、それは残ったか」を確認
2. **`grep` で撤去対象キーワードの残存を全文走査**: `grep -nE "(MCP|spec_lookup|spec_search)" docs/FRONTMATTER_GUIDE.md` のような形で周辺記述の取り残しを検出
3. **撤去後にガイド全体を頭から通し読みする**: セクション内の整合だけでなく、セクション間の論理連鎖（§1.2 で言った話を §5.4.2 で違うこと言っていないか）を確認
4. **撤去で「全行 uniform」になった表がないか確認**: 1 列・1 行を抜いた結果、表の情報量がゼロに近づくケースは表自体の再構成が必要（ACE-033 と関連）
5. **レビュアーへの依頼に「撤去で論理穴が生じていないか」を明示**: 「§X 改稿で論理的整合性が保てているか確認してほしい」と PR 説明に書くと、レビュアーが意識して検証する

---

<a id="ace-033"></a>

### ACE-033: 対応表で全行 / 全 cell が uniform になったら、表自体が情報を持っていないサイン

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #416 / Issue #415  |
| Related    | ACE-026 / ACE-030     |
| Date       | 2026-05-19            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: ツール / 環境 / 実装の比較表で **全行 / 全 cell が同じ値（全 `✅` 等）になっているなら、その軸は表として情報を持っていない**。差別化情報のある軸だけを残し、共通部分は 1 文の散文に集約するのが正解。表は「違いがある」前提のデータ表現形式であって、共通項を述べる手段ではない。

**Context**: PR #416 で frontmatter ガイド §7.1「AI ツール別」表から MCP 行を撤去した結果、5 行中 4 行が `✅ ✅ ✅ ✅` の uniform になり、Toolkit code-reviewer S2 が「表として情報量が薄い、4 ✅ 行は 1 文に集約すべき」と指摘。差別化情報は「プロジェクト指示ファイル名」1 行のみだった。fix commit で共通機能を「4 ツール共通で機能する: (a) frontmatter テキストを context として読む、(b) スクリプト実行、(c) 規律遵守」のように 1 文に集約し、表は「プロジェクト指示ファイル」1 列だけの小型表に縮小した。

**Action**:

1. **対応表を書いたら全 cell の値を見て判定**: 全行 / 全列が同じ値になっていないか確認
2. **uniform 行は散文に降格**: 「全 X で ✅」型の行は「X 全部で機能する: (a)/(b)/(c)...」のように 1 文に集約
3. **差別化情報が 1 行以下になったら表を 1 列にする**: 「行ヘッダ + 1 列の値」の小型表は読みやすく、表として機能する
4. **「対応有無の表 vs 対応方法の表」を意識**: 対応有無は ✅/❌ で十分だが、対応方法（設定ファイル名、コマンド、URL 等）の差を見せたいなら別の表として組み直す
5. **撤去 PR で特に発生しやすい**: 機能撤去で表の行・列が減ったら、残った表が uniform になっていないか必ず確認（ACE-032 と連動）

---

<a id="ace-043"></a>

### ACE-043: 品質ゲート script の chain と文書の「統括内容」記述は drift する — 自然文サマリではなく実体 script 名で列挙する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                          |
| ---------- | --------------------------- |
| Category   | documentation-quality       |
| Origin     | PR #429 / Issue #417        |
| Related    | ACE-023 / ACE-025 / ACE-018 |
| Date       | 2026-05-20                  |
| Helpful    | 0                           |
| Harmful    | 0                           |
| Status     | active                      |

**Insight**: 品質ゲート script（`quality:local` のような複数 npm script を `&&` で連結したもの）の中身を文書で「validate / lint / prettier を統括」のような **自然文サマリ** で要約すると、`package.json:scripts.*` の実体が変わったときに文書側が drift する。drift は同じ周辺を編集する別 PR の review (Toolkit / Copilot 等) が偶発的に検出するパターンが多く、検出までのラグが長い (PR #414 → PR #416 review → Issue #417 → PR #429 で 1 ヶ月以上)。自然文サマリの代わりに **実体 script 名を順序通り列挙する** 形式で書けば、`package.json` を変更する PR で grep にヒットし、同 PR 内で文書側も同期できる。

**Context**: PR #414 で `quality:local` に `format:md:check` を追加した際、`docs/FRONTMATTER_GUIDE.md §2` 表の「`quality:local`: 上記の validate / lint / prettier を統括」記述は更新されなかった。さらに後の PR で `build:spec-index` が定義 (`package.json:14`) されたが `quality:local` chain には組み込まれず、`docs/FRONTMATTER_GUIDE.md §2` 表が「`build:spec-index` も統括しているかのように読める」記述のまま放置された。PR #416 で Toolkit code-reviewer が **pre-existing 誤記** として検出 → Issue #417 起票 → PR #429 で `package.json` に `build:spec-index` を追加するとともに `FRONTMATTER_GUIDE.md §2` と `NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md §3.2-3.3` の bash ブロック / 表 / 「中身の順序」記述を実体と整合。修正中、Toolkit comment-analyzer がさらに §3.2 line 89 の「`format:md` は存在しません」（実態は存在する）と §3.3 line 94 の「中身の順序」での `format:md:check` 欠落を追加検出し、同 PR の fix commit で潰した。

**Action**:

1. **品質ゲート script を変更する PR では `package.json:scripts.*` と文書の chain 記述を双方向 grep**: `grep -rn 'quality:local' docs/` で言及箇所を全列挙し、自然文サマリではなく実体 script 名を列挙形式で書き直す
2. **「統括」「相当」「同等」のような曖昧語を避ける**: 「上記の validate / lint / prettier を統括」より「`build:mcp → check → mcp test → test:ace-scripts → validate -- docs-template → build:spec-index → format:md:check → lint:md` を順に実行」のような **実体列挙** が drift しにくい
3. **スクリプト挙動の説明では慣用語 (no-op / safe / handles gracefully) を避ける**: 「不在で no-op」のような表現は読み手の前提次第で「何もしない」「失敗しない」「副作用なし」の解釈が分かれる。`scripts/build-spec-index.mjs` の不在時挙動は厳密には「specs=0 で `dist/spec-index.json` を空索引として書き出し exit 0」であり、出力先・出力内容・exit code・副作用を字面で書く方が retrievable で誤読されにくい（ACE-025 を補強）
4. **「pre-existing な誤記」を起票するときは検出元 PR と原典 PR を明示**: Issue #417 のように「PR #416 review で発見、PR #414 起源」と書けば、修正 PR (#429) でも history を辿りやすい
5. **drift 修正 PR では同セクション内の隣接記述も再走査**: 触ったセクション (= heading 配下) の他の事実主張も Toolkit / Copilot に再読させる（[ACE-044](#ace-044) と組み合わせる）

---

<a id="ace-045"></a>

### ACE-045: 設計文書内の「mirror 付録（実体の参照用コピー）」は本体改稿で silent drift する — mirror を持つなら本体改稿で同期、または mirror を削って外部参照に置換

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                          |
| ---------- | --------------------------- |
| Category   | documentation-quality       |
| Origin     | PR #431 / Issue #430        |
| Related    | ACE-014 / ACE-043 / ACE-044 |
| Date       | 2026-05-20                  |
| Helpful    | 3                           |
| Harmful    | 0                           |
| Status     | active                      |

**Insight**: 設計文書（design doc / 仕様書）の付録に「実体ファイルの参照用コピー」を載せると、実体ファイルを改稿した瞬間 mirror が silent に drift する。`format:md:check` / markdownlint は内容の一致を検査しないため自動検出されず、後から読んだ人は「mirror = 実体」と誤認したまま古い snapshot を信じる。chain drift（ACE-043）/ 索引の数値重複（ACE-014）と源流を共有するが、本件は「同一文書内に実体のコピーを抱える」mirror パターン特有の落とし穴で、`grep` で気付かなければ次の chain 変更まで silent rot する。

**Context**: PR #431 で `.github/pull_request_template.md` の Self-Review Results を簡略化（旧 chain 列挙 → `npm run quality:local` 1 行）した際、Toolkit code-reviewer I1 (88%) が `docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md` 付録 A (L211-258) を検出。付録 A 冒頭の「`.github/pull_request_template.md` には**反映済み**。以下は採用時点の**参照用コピー**。」という注記が本 PR で本体を改稿した瞬間「反映済み」が嘘になり、付録 A の参照用コピーが本体と乖離。Toolkit は同 PR 内 fix commit でテンプレ本体と付録 A を同時更新するよう推奨し、mirror を持つ場合の同期責任を明示した。同型の bug は ACE-014（索引文書の数値重複）/ ACE-043（chain の自然文サマリ drift）と源流を共有するが、本件は「同一文書内に実体のコピーを抱える」mirror パターンに特化。

**Action**:

1. **設計文書内に mirror 付録を作らない**: 外部ファイル（PR テンプレ / 設定ファイル等）の現行スナップショットが必要なら、(a) 付録ではなく `[該当ファイル](path)` への参照 URL のみ置く、(b) 「採用時点」のような時系列情報が重要なら git tag / commit SHA への永続リンクを使う
2. **mirror を持つ判断をした場合は本体改稿 PR で同期**: ACE-044 の「touch ファイル外 = 別 issue」原則の **carve-out 例外**として、mirror であることが文書内に明示されている付録は同 PR で同期する（mirror 注記自体が「本体と整合させる」契約として機能する）
3. **mirror 注記には「自動同期されません」を明記**: 「以下は採用時点の参照用コピーで、自動同期されません。一次情報は `path/to/source`」のように一次情報の場所を明示し、本体と mirror どちらを信じるかを読者が判断できるようにする
4. **mirror の存在を grep で発見可能にする**: コードフェンス内の特徴的なヘッダや mirror 注記の定型句（「参照用コピー」「採用時点」「反映済み」等）で着手前に grep し、本体改稿時に未認識の mirror を見落とさない仕組みにする

---

<a id="ace-046"></a>

### ACE-046: PR/Issue body 内の相対リンクは `pull/N/` または `issues/N/` 起点で展開される — リポローカルテンプレでは `blob/HEAD/` 絶対 URL を使い、配布版は plain text にする

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                                                                    |
| ---------- | --------------------------------------------------------------------- |
| Category   | documentation-quality                                                 |
| Origin     | PR #437 / Issue #433-#436                                             |
| Date       | 2026-05-20                                                            |
| Helpful    | 2                                                                     |
| Harmful    | 0                                                                     |
| Status     | active                                                                |
| Related    | [ACE-016](#ace-016)（anchor URL 欠落）/ [ACE-044](#ace-044) carve-out |

**Insight**: GitHub の PR/Issue body はファイル単体閲覧時と **異なる base URL** でレンダリングされる。`.github/pull_request_template.md` を新規 PR で展開した場合、相対リンク `../docs/X.md` は repo ルートに届かず `repo/docs/X.md` という存在しない URL（HTTP 404）に解決される。先頭 `../` が無い `docs-template/X.md` のような形も同様に `pull/N/docs-template/X.md` 起点で展開され 404。テンプレファイル内では「ファイル単体閲覧」と「PR/Issue body 展開」で互換性のない 2 モードがあり、相対リンクは両方を満たせない。

**Context**: PR #431 で Gemini Code Assist が `[docs/...](../docs/...)` を「PR body 展開時にリンク切れ」と指摘 → ACE-044 carve-out 判定で別 Issue 化 → PR #437 で実証 + 修正。HEAD リクエストで確認: `repo/docs/AI_GIT_WORKFLOW.md` は **404**、`blob/HEAD/docs/AI_GIT_WORKFLOW.md` は **200**、`pull/N/docs/AI_GIT_WORKFLOW.md` は 302 → `pull/new/...`（事実上 404）。仕様根拠は [github/markup#576](https://github.com/github/markup/issues/576)。PR #437 で `.github/pull_request_template.md` の 3 箇所（L15/L28/L54）を `blob/HEAD/` 絶対 URL 化した直後、Gemini が L39 `[Review Response Policy](docs-template/...)` の絶対 URL 化漏れを指摘 — 当方 grep が `\.\./` 前提だったため先頭 `../` の無い形を見逃した。fix commit `38f12e1` で対応。同問題はリポローカル PR テンプレ 4 箇所 + ISSUE_TEMPLATE 16 箇所 + 配布版 15 箇所の計 35 箇所に存在（子 Issue #434/#436/#435 で段階対応）。

**Action**:

1. **リポローカル PR/Issue テンプレ**: `https://github.com/<owner>/<repo>/blob/HEAD/<path>` 形式の絶対 URL を使う。`HEAD` は GitHub が default branch に自動解決するため `develop`/`main` ハードコードを避けられる（default branch リネーム耐性あり）。
2. **配布版テンプレ** (`docs-template/.github/`): 採用先リポの URL が不明なので絶対 URL 不可。リンクを外し inline code (`` `docs-template/X.md` ``) に変更し、採用者向けに「リンク化する場合は自リポの `blob/HEAD/` URL に置換」と注釈を付ける。
3. **相対リンク検出 grep の拡張**: [ACE-016](#ace-016) Action 2 の `grep -nE "\]\(\.\./[^)]+\)"` は先頭 `../` のみ catch する。テンプレファイル内では `\]\([^h)#][^)]*\.md` （http/`#` で始まらない URL 部分を持つリンク全般）まで広げる。実証: PR #437 で `../` 前提 grep を信じて 3 箇所修正 → Gemini が L39 `docs-template/...` の絶対 URL 化漏れを指摘 → 拡張 grep で hit する形。
4. **検証手順**: (1) `gh pr view <N> --json body --jq .body` で PR body の生テキストを確認、(2) `curl -sI <絶対 URL>` で各リンクが HTTP 200 を返すか確認、(3) ファイル単体閲覧でも開けるか確認（`blob/HEAD/` なら両モード OK）。

---

<a id="ace-443-1"></a>

### ACE-443-1: framework リポは自テンプレをドッグフードするため知見ベースは `docs-template/` 配下 — AI レビュアーの「docs-template→docs」パス提案は実在確認してから採否を決める

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                          |
| ---------- | --------------------------- |
| Category   | documentation-quality       |
| Origin     | PR #443 / Issue #442        |
| Related    | ACE-027 / ACE-031 / ACE-001 |
| Date       | 2026-05-30                  |
| Helpful    | 0                           |
| Harmful    | 0                           |
| Status     | active                      |

**Insight**: 本フレームワークは自分のドキュメントテンプレート（`docs-template/`）を**自リポでもドッグフード**しているため、アクティブな ACE 知見ベース（PLAYBOOK.md 等）は `docs-template/08-knowledge/` に存在し、`docs/08-knowledge/` は**存在しない**。AI レビュアー（特に Gemini Code Assist）は「採用先プロジェクトでは `docs-template/` は削除され `docs/` がアクティブ」という一般則から、リポ自身の設定ファイル（`.cursorrules` / `AGENTS.md`）の `docs-template/...` 参照を `docs/...` に変えるよう提案するが、framework リポ自身ではこれを適用すると**リンク切れになる**。レビュー提案のパス変更は、提案先パスが実在するか（`ls`）を確認してから採否を決める。

**Context**: PR #443 で `.cursorrules` / `AGENTS.md` に ACE 採番 SSOT へのポインタ（`docs-template/08-knowledge/PLAYBOOK.md#エントリid規則`）を追加したところ、Gemini が medium 2 件で「採用先で `docs-template/` 削除時にリンク切れ → `docs/08-knowledge/PLAYBOOK.md` に変更」を提案。だが本リポには `docs/08-knowledge/` が無く（実 PLAYBOOK は `docs-template/` 側）、提案適用は逆にリンク切れを生むため不採用とし、根拠を PR にコメントで残した。一方、配布対象の `SETUP_*.md`（`docs-template/` 配下）はテンプレ相対パス `./08-knowledge/...` を使っており採用先コピー後も解決するため、Gemini の懸念は配布側では既に回避済みだった。

**Action**:

1. AI レビュアーがパス変更（特に `docs-template/` ↔ `docs/`）を提案したら、**提案先パスの実在を `ls` で確認**してから採否を決める。framework リポ自身では `docs-template/` がアクティブ知見ベース。
2. リポ自身の設定ファイル（root の `.cursorrules` / `AGENTS.md` / `.github/copilot-instructions.md`）は `docs-template/...` を指す。配布対象テンプレ（`docs-template/SETUP_*.md` 等）はテンプレ相対パス `./...` を使い、採用先コピー後も解決するようにする。
3. 不採用のレビュー提案は根拠（実在確認結果）を PR コメントに残す。

---

<a id="ace-447-1"></a>

### ACE-447-1: 別ドキュメントへの anchor 付きリンクは実見出しの slug と一致させる — label↔URL ミラー（ACE-016）だけでは壊れたアンカーを作りうる

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #447 / Issue #446  |
| Related    | ACE-016               |
| Date       | 2026-06-23            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: ACE-016（anchor は label と URL の両方に書く）を満たしても、フラグメントが参照先ドキュメントの**実見出しの GitHub slug と一致していなければリンクは解決しない**。番号付き見出し `## 3. エラーハンドリング` の slug は `#3-エラーハンドリング` で、`#エラーハンドリング` は 404 になる。label↔URL ミラーリングは「壊れたアンカーを両方に等しく書く」ことすら起こす。ACE-016 は presence（両方に書く）、本エントリは validity（実 slug と一致）。

**Context**: PR #447 で Issue テンプレの参照リンクを ACE-016 準拠（URL 側にもフラグメント付与）に整えた際、bug.md の `PATTERNS.md#エラーハンドリング` が実見出し `## 3. エラーハンドリング`（slug `#3-エラーハンドリング`）と不一致でリンク切れになり Codex code-reviewer が検出。さらに ARCHITECTURE.md は `## 5. インフラストラクチャ` と `#### インフラ` が併存し `#インフラ` は後者に解決する曖昧ケースもあった。

**Action**:

1. 別ドキュメントへ anchor 付きリンクを張るときは、参照先の実見出しを開いて GitHub slug 規則（小文字化・記号除去・空白→ハイフン、`3.`→`3-`）で slug を確定してから書く。
2. slug が番号付き・全角括弧などで脆い、または同名見出しが複数あって曖昧なときは、フラグメントを label と URL の両方から除去してファイルトップへのリンクにする（曖昧さ回避を優先）。
3. ACE-016（presence）と本エントリ（validity）の両方を満たして初めて anchor リンクは健全。

---

<a id="ace-447-2"></a>

### ACE-447-2: 配布物（docs-template/）内のリンクは配布ツリー外を指さない — ドッグフード絶対URLの相対化で `../../../` がツリーを脱出する

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #447 / Issue #446  |
| Related    | ACE-046, ACE-443-1    |
| Date       | 2026-06-23            |
| Helpful    | 1                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: 配布テンプレ（`docs-template/`、利用者がコピーする）内のリンクが配布ツリー外（リポジトリ直下 `docs/` 等）を指すと、コピーした下流プロジェクトでリンク切れになり「自己完結した配布物」でなくなる。ドッグフード側の絶対 URL（`blob/HEAD/...`）を配布側の相対パスへ機械変換するとき、ツリー外参照は `../../../docs/...` となって配布ツリーを脱出する。「URL 形式の差分のみ」の同期に見えて、実は到達範囲の差（絶対は常に解決、相対はツリー境界に縛られる）になっている。

**Context**: PR #447 で Issue テンプレを2セット（`.github/`=ドッグフード絶対URL / `docs-template/.github/`=配布相対パス）で同期した際、撤退コスト試算の `[docs/DESIGN_PRINCIPLES.md]` 参照を配布側で `../../../docs/DESIGN_PRINCIPLES.md` に相対化してしまい、Codex code-reviewer が「配布物が自己完結しない」と検出。配布側はプレーンテキスト化（外部参照を落とす）、ドッグフード側は絶対 URL を維持して解消。

**Action**:

1. 配布物を編集したら `grep -rn '\.\./\.\./\.\./' docs-template/` 等でツリー脱出リンクを検出する。
2. 配布ツリー外への参照は、配布側ではプレーンテキスト化するか配布ツリー内の等価ドキュメントへ張り替える。ドッグフード側のみ絶対 URL（`blob/HEAD/`、[ACE-046](#ace-046)）を保持。
3. ドッグフード→配布の同期は「URL 形式の差分のみ」を原則としつつ、その差が到達範囲の差でもある点を常に確認する。

---

<a id="ace-449-3"></a>

### ACE-449-3: 「設定駆動」を謳う config を編集する前に、そのキーが実際にスクリプトから読まれているか確認する — 読まれない飾りキーはハードコードとの同期注記を付ける

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #449 / Issue #448  |
| Date       | 2026-07-02            |
| Helpful    | 2                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: 「設定駆動で統一管理」を謳うツールでも、config の全キーが実装から読まれているとは限らない。読まれない「飾りキー」を編集して挙動が変わったと思い込むと、ドキュメント・config・実装の三者が別々の状態を主張する drift が生まれる。config を編集する変更では、まず**そのキーを読むコード（yq/jq 呼び出し等）を grep で実在確認**し、読まれていなければ (a) 実装のハードコードも同時に変更し、(b) config とドキュメントに「実体はスクリプト内ハードコード、同期編集が必要」と注記する。

**Context**: PR #449 で `agent-config.yaml` の perspectives を変更したが、`multi-agent.sh` の `load_config` が yq で読むのは `mode` / `parallel` / `tasks.*` のみで、perspectives・fallback・cost_tier は**すべてスクリプト内ハードコード**だった（編集しても挙動不変）。さらに `review-config.yaml` は `agent-config.yaml` への symlink で、2 ファイルに見えて実体は 1 つだった。ハードコード側（`get_cli_perspectives_review` 等）を同時に変更し、multi-cli-review-orchestration.md に同期編集の注記を追加した。

**Action**:

1. config ファイルを編集する前に、`grep`（yq/jq のキー参照）で**そのキーが実装から読まれているか確認**する。
2. 読まれない飾りキーを見つけたら、ハードコード側を同時に変更した上で、config・ドキュメント両方に「SSOT はスクリプト内、同期編集必須」の注記を残す（読み取り実装の追加は別 issue でよい）。
3. 同種の設定ファイルが複数見えたら `ls -la` で symlink かどうか確認してから編集する（重複編集・片側編集事故の防止）。

---

<a id="ace-519-3"></a>

### ACE-519-3: 同一文書内に実体のコピーを抱える節は、見出しと冒頭文が「現行を反映済み」と主張するか「設計時点の案」と名乗るかで扱いが分かれる — 前者は mirror（同期か撤去）、後者は記録節（本文を同期せず主張文だけ直す）

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | documentation-quality | Origin | PR #519 / Issue #517 |
| Related | ACE-045 / ACE-500-1 |
| Date | 2026-09-07 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

`NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md` 付録 A が本体 PR テンプレと 3 度目の drift を起こしたとき、ACE-045（mirror は同期か撤去）と ACE-500-1（記録節は書き換えない）が同じ節に対して逆を指示した。見分けは節の自己申告で、付録 A は見出しが「PR テンプレート改稿案」で §5 から「付録 A に沿って更新」と参照される設計時点のスナップショット＝記録節だった。壊れていたのは冒頭の「反映済み」という現行パリティの主張 1 文だけなので、本文は同期せずその 1 文をスナップショット宣言 + 現行正本への外部参照へ差し替えた。これで同期責務そのものが消えるため、記録を失わずに ACE-045 の失敗モードが構造的に再発しなくなる。

---

<a id="ace-536-1"></a>

### ACE-536-1: 分類カテゴリの列挙は PLAYBOOK 一覧が正本で、他文書へ写すと再乖離する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | documentation-quality | Origin | PR #536 / Issue #487 |
| Date | 2026-09-14 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

`/ace-curate` と `ace-cycle` が 8 種を写していると、実態の `documentation-quality` が選択肢から落ちる。分類は PLAYBOOK のカテゴリ一覧を参照し、列挙を他文書へコピーしない。行数上限の式や件数ゲートもチェッカー説明と PLAYBOOK を同時に更新する。

---

<a id="ace-539-1"></a>

### ACE-539-1: テンプレートツリーの角括弧は未確定値警告に畳み、消費者ツリーだけ leftover と deferred を分岐する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | documentation-quality | Origin | PR #539 / Issue #507 |
| Date | 2026-09-14 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

`/init-docs` が推測で埋めずに残す `[金額]` `[SLA値]` `[x.x.x]` と、消費者が埋めるべき `[プロジェクト名]` は同じ `[…]` でも失敗クラスが違う。basename が `docs-template` なら角括弧を未確定値警告にして exit 0 を保ち、消費者ツリーでは leftover と deferred を別文言で出す。deferred は inner の exact-set（と `x.x` 連なり）に限り、`includes('SLA')` は `[SLACK連携]` を誤分類する。閉じたフェンス・リンク・タスクリストはマスクし、閉じ忘れは検査対象に残す。

---
