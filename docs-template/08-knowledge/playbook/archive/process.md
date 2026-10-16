# PLAYBOOK Archive — プロセス (process)

> **Parent**: [PLAYBOOK.md](../../PLAYBOOK.md) — アーカイブ済みエントリの保管場所。
> `playbook/archive/` 配下は `ace_entry_count`・カテゴリ件数ゲート・reuse 集計の対象外。
> 参照リンクが切れていた場合はこのディレクトリを ID で grep して探す。
>
> **保全本文内の相対リンクは live 基準**: 各エントリ本文は原文を verbatim 保全しているため、本文中のリンクは live の PLAYBOOK.md（`docs-template/08-knowledge/` 直下）を基準に書かれている。`#ace-xxx` だけのリンクは `../../PLAYBOOK.md#ace-xxx`（リンク先自体がアーカイブ済みならこのディレクトリを ID で grep する）、`./` や `../` で始まるリンクは `docs-template/08-knowledge/` からの相対パスに読み替えること。このディレクトリから直接辿ると (a) ファイルが存在しない、(b) anchor が無い、(c) **live ではなくアーカイブ済みの複製に着地する**（リンクチェッカーには映らない）のいずれかになる。live のエントリは [PLAYBOOK.md のエントリ一覧](../../PLAYBOOK.md#エントリ一覧) から引くこと。

---

<!-- markdownlint-disable MD051 -->

## アーカイブ済みエントリ

<a id="ace-001"></a>

### ACE-001: クロスモデルレビューは単一AIモデルでは検出できない問題を発見する

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                |
| ---------- | ----------------- |
| Category   | process           |
| Origin     | PR #316 / PR #319 |
| Date       | 2026-03-10        |
| Helpful    | 12                |
| Harmful    | 0                 |
| Status     | active            |

**Insight**: 異なるAIモデル（Claude/Codex/Gemini/CodeRabbit）は異なるカテゴリの問題を検出する。単一モデルのレビューでは見落とされる問題が、クロスモデルレビューで発見される。

**Context**: PR #316（ドキュメント）では Claude がnpmパッケージ名の間違いと壊れたリンク、Codex がスクリプト未実装注記の不足、Gemini Bot がパッケージスコープの間違いと無料枠数値の不一致、CodeRabbit が未実装スクリプトの注記不足を検出。PR #319（スクリプト）では Codex が CRITICAL_BLOCK 誤検出バグを発見し、Claude の pr-review-toolkit（code-reviewer + silent-failure-hunter）が stderr 握りつぶし・サイレントフォールバック・空結果の偽成功を検出。いずれも単一モデルでは検出されなかった。

**Action**: PR作成前のセルフレビューでは、`pr-review-toolkit`（Claude系サブエージェント）と `codex review --base develop`（GPT系クロスモデル）の両方を実行する。Bot系レビュー（Gemini Code Assist, CodeRabbit）がある場合はその指摘も確認する。

---

<a id="ace-004"></a>

### ACE-004: ドキュメントの動作説明は実装メカニズムと一致させる

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値         |
| ---------- | ---------- |
| Category   | process    |
| Origin     | PR #350    |
| Date       | 2026-03-18 |
| Helpful    | 1          |
| Harmful    | 0          |
| Status     | active     |

**Insight**: ドキュメントに「自動実行」と記載したが、実際にはCLAUDE.mdの指示に基づいてAIツールが順次実行する仕組みだった。「自動」「手動」「並列」「順次」等の動作表現が実装メカニズムと乖離すると、読者（人間・AI両方）が誤った前提で行動し、トラブルシューティング時に混乱する。

**Context**: PR #350 のレビューでCodeRabbitが「自動実行」表現と`execute_tasks()`の実装（事前計画の一括/順次実行）の不一致を指摘。また`npm run code-review:codex`が`package.json`に未定義であることも発覚。ドキュメント作成時に「こうなるべき」を「こうなっている」として記述してしまうパターン。

**Action**: ドキュメントに動作説明を書く際は、(1) 実装コード/設定ファイルで実際の動作を確認、(2) 記載するコマンドは実在を検証（`package.json`のscripts、`--help`出力等）、(3) 「自動」「手動」等の表現は実装メカニズムに基づいて正確に選択する。

---

<a id="ace-009"></a>

### ACE-009: 長時間 Orchestrator の失敗の真因は upstream Issue spec 曖昧さ — 探索型 refine が必要

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #374 / Issue #373 |
| Date       | 2026-04-26           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: AI Orchestrator (完遂型 / A 型) で Issue を自動完遂する仕組みが「結構できないものが多い」と感じたとき、真因は **Orchestrator の賢さ不足ではなく、入力 Issue の spec 曖昧さ**であることが多い。曖昧な spec を渡された Orchestrator は推測で穴埋めするしかなく、ハズす。必要なのは「曖昧な Issue → 実行可能な Issue」に研ぎ澄ます探索型 (B 型) skill を upstream に置くこと。

**Context**: 当初は「長時間駆動 Orchestrator + compact 耐性」のアーキテクチャをブレストしていたが、「A 型 Orchestrator の失敗パターン」を深掘りした結果、根本原因が Issue spec 自体の曖昧さに移動。`/create-issue`（新規 Issue ゲート）は既存だったが、既に立った曖昧 Issue を refine する手段がなかった。`/refine-issue` MVP を先に作ってから Orchestrator ループ・司令ファイルを後付けする路線にスコープ変更し、6 観点ブレストで設計を確定。

**Action**: 「AI agent が信頼できない / 完遂率が低い」と感じたら、(1) agent 自体の改善より先に、与えている入力データ (Issue / spec / プロンプト) の品質を疑う、(2) upstream に「入力を磨く skill」を置けないか検討する、(3) ブレストで「真因が一段下のレイヤーにある」可能性を必ず一度は検証する、(4) MVP は upstream の単一 skill に絞り、Orchestrator ループ等は動作確認後に後付けする路線が安全（空回りを高速化するリスクを避ける）。

---

<a id="ace-010"></a>

### ACE-010: Issue クローズ前は commit log でなく現在のファイル実体を grep 照合する — silent regression を検出する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #387 / Issue #360 |
| Date       | 2026-04-30           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: Issue が PR で完了したと判断する際、関連 PR の commit message・diff・タイトルだけを根拠に「完了」と決めるのは危険。同じファイルを触る後続 PR が stale-base merge / 衝突解決ミスで silent revert を起こしている可能性があり、commit log を遡るだけでは「現在の develop の実体」を保証できない。今回 Issue #360（MD060 lint 有効化）は PR #384 で完了したと判断して一旦クローズしたが、46 分後にマージされた PR #377（chore: no GitHub Actions）が `.markdownlint.json` に `"MD060": false` を再追加する形で silent revert していた。develop の実体は未達成のまま、再 open と修正 PR #387 が必要になった。

**Context**: Issue #360 / PR #383 / PR #384 / PR #377 が 2026-04-27 数時間以内に同じ config と表整形を並行で触り、AI エージェントが PR #384 の commit メッセージ「MD060 再有効化」を根拠に「Issue #360 は完了」と判断してクローズを実行。Issue #386（後継 Prettier 導入）に着手する直前に develop の `.markdownlint.json` を実際に開いたところ `"MD060": false` が残存していて regression が発覚。`git log -p .markdownlint.json` で追跡すると PR #384 → PR #377 の順で「有効化 → 再無効化」になっていた。

**Action**: AI エージェントが Issue / PR を「完了」として閉じる前に必ず:

1. **受け入れ基準を develop の最新実体に対して検証する** — `git switch develop && git pull --ff-only` の後で `cat path/to/config` または `grep -n target path/to/config` で受け入れ基準が満たされているかを直接確認する。Closes #N が含まれる commit が積まれていることは「実体が達成されている」ことを意味しない。
2. **受け入れ基準が config / lint / format / CI 設定系なら、当該ファイルの直近 N コミットを必ず追う** — `git log -p -10 path/to/config` で関連時期に silent revert がないかチェックする。1 行追加 / 1 行削除の往復は git log で時系列を見ないと発見しにくい。
3. **同領域を触る PR が並行している時期は特に警戒する** — 24h 以内に同 path を触る PR が 2 件以上あり、片方が古い base から派生している場合 stale-base merge による silent regression のリスクが高い。merge 後に必ず実体検証を挟む。
4. **AI エージェントが「クローズ判断」のような shared state 操作を行う前に advisor / 別 agent に検証させる** — 大規模リポジトリで commit メッセージだけで判断するのはハイリスク。

---

<a id="ace-012"></a>

### ACE-012: PR マージ・push 前は必ず `git status` でブランチを確認する（develop 直 push 事故防止）

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                             |
| ---------- | ------------------------------ |
| Category   | process                        |
| Origin     | PR #391 / PR #393 / Issue #295 |
| Date       | 2026-05-06                     |
| Helpful    | 0                              |
| Harmful    | 0                              |
| Status     | active                         |

**Insight**: バックグラウンドでブランチが切り替わる事象は外部プロセス（他作業者の `gh pr merge`、IDE 拡張、自動化フック等）で発生しうる。**自分のターン内で `git checkout` していないことは、現在のブランチが想定通りである保証にならない**。`git push` の直前には必ず `git branch --show-current` または `git status` の出力を確認する。同様に Issue 着手時は、同 Issue 用の他ブランチや未追跡ファイルが既に存在しないか `git branch | grep -w <issue-number>` および `git status -uall` で確認する習慣を入れる。

**Context**: Issue #295 の作業中、PR #391 がユーザーまたは他プロセスにより突然マージされ、ローカル HEAD が feature branch から develop に自動切り替わった。この切り替わりに気づかず `git push` した結果、レビュー対応コミット（ba391fa）が develop に直接乗り、`Never commit directly to develop` ルールに違反。`git revert ba391fa` + 新 PR #393 で正規化が必要となった。さらに同 Issue の作業着手時にも、別ブランチ `feature/#295-organization-rollout-guide` と未追跡ファイル `06-reference/ORGANIZATION_ROLLOUT.md` が既に存在することに気づかず、無自覚に重複作業を作りかけた。

**Action**: AI エージェントが Git 操作を行う際:

1. **Issue 着手前の確認**: `git branch | grep -w <issue-number>`、`git status -uall` で同 Issue の他ブランチ・未追跡ファイル・進行中の作業がないかチェック。並列作業の発見時はユーザーに統合方針を相談する。
2. **`git push` の直前**: `git branch --show-current` を必ず実行し、想定ブランチと一致するか確認。一致しない場合は push を中止して原因調査。
3. **PR 操作前の状態確認**: `gh pr view <PR>` で他者によるマージ・close を事前確認。マージ済みなら作業内容を新ブランチに分離。
4. **develop / main に直 push してしまった場合**: `git revert <SHA>` で revert commit（変更を打ち消す新規 commit）を作成 → push して直 push 分を無効化、同内容を新ブランチに cherry-pick して正規 PR で再投入する。`git reset --hard` + force push は履歴削除を伴い他協働者に影響するため避ける。
5. **PR ready / merge 操作前**: 直前にもう一度 `git status` でローカルが想定状態か確認。push 済 commit と PR head が一致しているかも `gh pr view <PR> --json headRefOid` で照合する。

---

<a id="ace-013"></a>

### ACE-013: 並列 reviewer の指摘は古い snapshot 由来の誤検知を含む — 実態 grep で双方向検証する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                             |
| ---------- | ------------------------------ |
| Category   | process                        |
| Origin     | PR #391 / PR #393 / Issue #295 |
| Date       | 2026-05-06                     |
| Helpful    | 0                              |
| Harmful    | 0                              |
| Status     | active                         |

**Insight**: Toolkit / Copilot / Gemini Code Assist 等の並列レビューでは、**reviewer が PR の特定 commit（多くは初回 push 時点）を見ている都合で、すでに修正済みの内容を Critical として再指摘するノイズ**が混入する。逆に reviewer が実態を正しく見抜いて指摘した場合、**こちらが「修正済み」と思い込んで grep 確認を怠ると本物の Critical を見逃す**。指摘を受け取った瞬間に `grep -n` で実態確認し、**両方向**（false positive / true positive）を切り分ける。これを怠ると、誤検知に基づいて再修正してファイルを破壊するか、本物のバグを残してマージしてしまう。

**Context**: PR #391 で 1500 行残存（C1 / C2）と bash 「上記出力」プレースホルダ（S1）を Toolkit / Copilot / Gemini が並列 Critical として指摘したが、`grep -n "1500" <該当ファイル>` で確認したところすでに修正済みだった（reviewer 側の snapshot が古かった）。スキップ判断で正解。逆に PR #393 では archive-strategy.md に追記した「`archive/README.md` は提供されていない、初回作成する」記述に対し、Toolkit が「実態は PR #391 で雛形として既に追加済み」と Critical 指摘。`ls docs-template/archive/` で確認したところ事実だったため、即修正した。**両ケースとも、grep / ls による実態確認なしで判断していたら誤った PR 状態でマージされていた**。

**Action**: PR レビューを受け取った AI エージェントは:

1. **指摘の真偽は常に grep で検証**: Critical / Important / Suggestion の区別なく、指摘箇所を `grep -n "<キーワード>" <該当ファイル>` で検索。検出されなければ false positive、検出されれば true positive。
2. **false positive の対応**: 修正をスキップし、PR コメントに「該当箇所は commit XXXX で修正済み（reviewer の snapshot が古い可能性）」と返す。**勝手にスキップせず明示する**ことで、後続 reviewer が同じ指摘を繰り返すのを防ぐ。
3. **true positive の対応**: 通常通り fix commit。PR 本文に「実態確認の結果、X は確かに〜」と記録する。
4. **複数 reviewer が同じ箇所を指摘した場合**: snapshot 時刻を `gh pr view --json reviews --jq '.reviews[].submittedAt'` で確認。すべて同時刻に近いなら共通の古い snapshot 由来、ばらついているなら真正のバグの可能性が高い。
5. **逆方向の罠も警戒**: 「Toolkit が指摘していないから OK」と思い込まず、自分の追記内容（特にテンプレート実態に関する主張）は `ls` / `cat` で実物を確認してから書く。**書きながら一度実物を見る**を習慣にする。

---

<a id="ace-017"></a>

### ACE-017: 並列 review agent は worktree を巻き戻す副作用を持ち得る — `git status` 監視と `git restore --source=HEAD` で復旧する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #395 / Issue #296 |
| Date       | 2026-05-06           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: main worktree で **複数の review agent を並列起動**した場合、agent が分析過程で `git restore` / `git checkout` 系のコマンドを実行（典型的には「PR 前の状態と diff を見るため」「base branch の内容を確認するため」）し、staged + working tree が **base コミットの状態に巻き戻る**事故が発生し得る。HEAD ポインタと remote push 済みの commit は無事のため、被害はあくまで「working tree が一時的に古くなる」レベルだが、**気付かずに次の編集を始めるとマージ事故**になる。`git restore --source=HEAD --staged --worktree <files>` で即時復旧可能。**並列 review agent 起動直後は必ず `git status --short` で working tree が clean かを確認する**。worktree を別に切る `--worktree` モードで起動できるなら、それが最も安全。

**Context**: PR #395 で Toolkit `code-reviewer` と `comment-analyzer` を並列起動（Agent tool の単一メッセージ複数 tool*use）して review report を受け取った直後、5 ファイル全てが「Modified」かつ index にも staged で **pre-PR 状態（追加した 150 行が消えた状態）**になっていることを system reminder 経由で発見。`git log` 上の HEAD は `6a80bc4`（自分の commit）のままで remote も同じ位置だったため、どこかの agent が `git restore --source=develop --staged --worktree <files>` 相当を実行したと推定。`git restore --source=HEAD --staged --worktree .github/ISSUE_TEMPLATE/feature.md .github/pull_request_template.md docs/AI*\*.md`で即時復旧、その後の review-fix と merge は問題なく進行。**この事故は HEAD/remote が無事だから復旧できたが、もし agent が`git reset --hard` 相当を実行していれば commit ごと失っていた\*\*ため、防止策の優先度は高い。

**Action**: 並列 review agent を起動する際:

1. **起動前に commit + push を完了させる**: HEAD と remote が無事なら最悪 working tree 巻き戻りでも復旧可能。「未コミットのまま review 起動」は避ける。
2. **起動直後の `git status` 監視を習慣化**: 並列 agent の report 受取後は、内容を読む前に **必ず `git status --short` を実行**。staged 修正 (左カラム `M`)・unstaged 修正 (右カラム `M`)・両方 (`MM`) のいずれかが出たら巻き戻しの可能性。
3. **巻き戻りに気付いたら即復旧**: HEAD が無事なら `git restore --source=HEAD --staged --worktree <files>` で working tree と index を HEAD 状態に戻す。`grep` で追加内容（例: 「PR Size Check」「6 観点」）が file に残っているか復旧後検証。
4. **`isolation: "worktree"` モードで起動**: Agent tool 側に `isolation` パラメタがある場合、`worktree` を指定すると agent は隔離された一時 worktree で作業するため、main worktree の状態に副作用を与えない。本 PR の review agent は `isolation` を指定せず main worktree で動かしたが、これは将来的に標準 isolation 化を検討すべき。
5. **`git reset --hard` を含む destructive 操作の禁止周知**: agent prompt に「**`git reset --hard` / `git restore --source=<base>` / `git checkout <base> -- .` は実行禁止。read-only 操作（`git diff`, `git show`, `git log`）に限定する**」と明記する。レビュー目的ならどの操作も destructive 不要。

---

<a id="ace-019"></a>

### ACE-019: 既存ルール違反になる新パターンは「例外」として明示的に名乗らせる

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #397 / Issue #396 |
| Related    | ACE-012（修正対象）  |
| Date       | 2026-05-06           |
| Helpful    | 2                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 新しい運用パターンが既存 PLAYBOOK エントリ・グローバルルールに違反する場合、**「これは X の例外として扱う」と該当箇所に明示的に書く**。書かないと暗黙の policy split が生じ、(a) 後続 AI が古いルールを参照して新パターンを「違反」として扱う、(b) Toolkit / Copilot が Critical として指摘する、(c) チームメンバーがどちらを優先するか迷う。Comment-analyzer は「実装は妥当だが既存の禁則と衝突しているのに carve-out が無い」を Critical 指摘として独立検出する精度を持つため、PR レビュー前に自分で見つけて潰すべき。

**Context**: PR #397 で「個人開発（簡易）」パターン（マージ後に develop へ ACE エントリを直接 commit + push）を導入。これは PLAYBOOK ACE-012「Never commit directly to develop」と直接衝突するため、Toolkit comment-analyzer が「ACE-012 を名指しで違反、carve-out が必要」と Critical 指摘。fix commit b75f86d で 5 サイト（CLAUDE.md / AI_GIT_WORKFLOW.md / git-workflow.md / ace-cycle.md / ace-curate.md）に「**ACE-012 の例外として明示**: 通常 develop への直接 commit は禁止だが、(1) PLAYBOOK.md は append-only、(2) 1 サイクル分の知見追加は履歴上独立 commit として読める、(3) `knowledge:` プレフィックスで識別可能 — の 3 条件を満たすため、個人開発（簡易）パターンに限り許容する。3 人以上のリポジトリでは適用しない。」と注記して解消。実装の正当性自体は問題なく、欠けていたのは **「これは違反ではなく例外である」という明示的な naming** だけだった。

**Action**: 新運用パターン・新コーディング規約を導入するときに:

1. **既存 PLAYBOOK / CLAUDE.md / 規約と衝突するか chec先**: 着手前に `grep -rn "<該当キーワード>" docs-template/08-knowledge/ CLAUDE.md ~/.claude/CLAUDE.md` で対立するルールを列挙する。特に "Never X" / "禁止" / "MUST NOT" 表現は要注意。
2. **対立が見つかった場合の選択肢は 3 つ**:
   - **(a) 例外として明示**: 違反箇所に「これは ACE-XXX / CLAUDE.md L<行> の例外である。理由: ...」と明記。最も一般的で安全。
   - **(b) 旧ルールを deprecated 化**: 旧 ACE エントリの Status を `deprecated` にし、新パターンを正規ルールとして昇格。旧コミッタへの周知が必要。
   - **(c) 新パターンを撤回**: 違反コストが exception 注記を上回ると判断したら、新パターンを採用しない。
3. **「明示」のレベルは 3 点セット**: 例外であることの宣言 + 例外を許す**条件**（最低 3 つ）+ 例外が**適用されないケース**（チーム規模・リポ性質などの境界）。3 点揃わないと「言い訳」に見えて信頼されない。
4. **複数サイトに展開する場合は文言を verbatim に揃える**: 例外の説明が文書ごとに微妙に違うと「結局どれが正？」になる。canonical な 1 文を決めて全サイトに同じ文言で貼る（ACE-014 の SSOT 原則を例外説明にも適用）。
5. **Cross-Model Review で取りこぼしを catch する**: 例外を書いたつもりでも文言が弱い・条件が抜けている場合、Toolkit comment-analyzer / Copilot が指摘する。彼らに任せて自分は「全サイトに書いたか」「文言が揃ったか」のチェックに集中する。

---

<a id="ace-022"></a>

### ACE-022: 機能削除時は consumer だけでなく定数・型・ユーティリティも grep して取り残しを防ぐ

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #403 / Issue #402 |
| Related    | ACE-018              |
| Date       | 2026-05-07           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 機能を削除する PR では、**機能本体ディレクトリ削除 → consumer 編集 → ビルド OK** で完了したように見えるが、**TypeScript の `tsc` は未使用 export を warning しない**ため、その機能のためだけに作られた定数・型・ユーティリティが他モジュールに孤立して残る。`npm run build` も `npm run check` も pass するので CI では検出されない。手動 grep を「機能名 / 機能専用識別子」で実行しないと dead code として静かに残り続ける。

**Context**: PR #403 で `mcp/src/obsidian/` 配下 5 ソース + `scripts/obsidian-sync.mjs` 等 13 ファイル削除と 7 ファイル編集を実施（最終的に下記 fix commit で `mcp/src/constants.ts` が加わり 8 ファイル編集、計 +7/-1859 行）。`git grep -i obsidian` で「Obsidian」文字列の取り残しはゼロを確認、`mcp build`/`mcp check`/`quality:local` も全 pass。しかし Toolkit code-reviewer が `mcp/src/constants.ts:21-36` の `BACKLINKS_SECTION_HEADER` と `BACKLINKS_SECTION_TEMPLATE` を **dead code として検出**。これらは削除済み `mcp/src/obsidian/backlinks.ts` でだけ使われていた定数で、ビルドは通るが「完全排除」を謳う PR タイトル・CHANGELOG と矛盾する状態だった。fix commit `8628140` で対応。レビューが無ければ silent regression として残った。

**Action**: 機能削除 PR を作る際:

1. **機能名でなく機能の語彙すべてで grep する**: 「Obsidian」だけでなく、その機能専用の識別子（`BACKLINKS_SECTION_*`、`buildBacklinksMap`、`validateAllLinks` など）も全部 grep キーワードに含める。`git grep -i "<feature_name>\|<feature_specific_constants>\|<feature_function_names>"` を 1 コマンドにする。
2. **削除候補を「本体 / 設定 / 定数 / 型 / 関数 / テスト / ドキュメント」の 7 カテゴリで網羅する**: 機能本体ディレクトリだけ消して終わりにせず、Issue 本文の「削除対象」リストにこの 7 カテゴリを明示し、TodoWrite で 1 つずつ確認する。
3. **「未使用 export 検出」ツールを CI に入れる**: `ts-prune`、`knip`、`unimported` など TypeScript 用の dead code 検出ツールを quality:local に組み込む。一度入れれば類似の取り残しを継続的に防げる。
4. **削除 PR の self-review に「孤立 export チェック」を含める**: PR Review チェックリストに「削除した機能の専用 constants/types/utilities が他モジュールに残っていないか？ `git grep` で確認」項目を追加。Toolkit code-reviewer はこの種の検出が得意なので、必ず通す。
5. **同じモジュール内に定数を置く設計を選ぶ**: 機能専用の定数は `mcp/src/<feature>/constants.ts` のように **機能ディレクトリ配下に閉じ込める**。削除時に親ディレクトリごと消せば取り残しが構造的に発生しなくなる。共通 constants ファイルへの追加は「本当に他機能でも使うか？」を着手前に問う。

---

<a id="ace-034"></a>

### ACE-034: 実装中は implementation-notes.md を作業ブランチに並走させて spec 乖離・トレードオフ・判断理由を捕捉する

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                                                 |
| ---------- | -------------------------------------------------- |
| Category   | process                                            |
| Origin     | 外部知見（Anthropic エンジニア公開実装プロンプト） |
| Related    | ACE-009 / ACE-023 / ACE-032                        |
| Date       | 2026-05-19                                         |
| Helpful    | 0                                                  |
| Harmful    | 0                                                  |
| Status     | active                                             |

**Insight**: 実装着手から PR 作成までの間、作業ブランチ直下に `implementation-notes.md` を 1 枚並走させ、(1) spec に書かれていなかった判断、(2) spec から変更した点、(3) 取った/捨てた選択肢とその理由（トレードオフ）、(4) レビュアー・ユーザーが知るべきその他情報を逐次記録する。コミット diff とレビューコメントには「why / 捨てた選択肢 / spec との差分」が残らず、ACE Phase 1 Generate の raw material の品質に上限が生じるため、in-flight でしか書けない情報を能動的に残す。

**Context**: Anthropic エンジニアが SNS で公開した実装プロンプト（"implement \<SPEC\> and while you do keep a running implementation-notes.html file (or markdown) with decisions you had to make weren't in the spec, things you had to change, tradeoffs you had to make or anything else I should know"）を契機に、本リポの ACE Playbook (ACE-001 〜 033) と grep 照合し未抽出と確認。本リポの既存 ACE サイクル ([ace-cycle.md](../05-operations/deployment/ace-cycle.md)) は post-merge に `gh pr diff` + レビューコメントを raw material として Generate するが、コミットに残らない判断理由・捨てた選択肢・spec 乖離の文脈は diff には現れない。実際 ACE-032（PR #416 で MCP value 撤去後に §5.4.2 が宙に浮いた）のような「気付いた瞬間に書いておけば反映漏れがなかった」ケースが頻発しており、in-flight な判断ログの欠落が構造的に存在する。

**Action**:

1. **実装着手と同時に作業ブランチ直下に `implementation-notes.md` を作成**: 最低限 4 つの見出しを持つ
   - `## Decisions not in spec`（spec にない判断）
   - `## Changes from spec`（spec から変えた点）
   - `## Tradeoffs`（採った/捨てた選択肢と理由）
   - `## Open questions / TODO`（未決事項）
2. **コミットと一緒に追記**: 「なぜこの選択をしたか」を 1〜3 行で残す。後で書こうとすると確実に忘れる
3. **PR 作成時に PR description に転記または同梱**: レビュアーが「なぜ」を読みやすくなり、レビュー指摘の精度が上がる
4. **ACE Phase 1 Generate の raw material は「PR description（implementation-notes 転記済み）」**: Action 5 でマージ前にファイル自体は削除されるため、ファイル本体ではなく PR description（転記済みの判断ログ）を `gh pr view --json body` で取得して Generate プロンプトに渡す。`gh pr diff` / `gh issue view` / レビューコメントと併せて入力にする（[ace-cycle.md §Phase 1](../05-operations/deployment/ace-cycle.md)）
5. **マージ前にファイルを削除し PR description に統合（推奨）**: squash merge を標準とするリポでは「PR に同梱したまま残す」と squash 後にルート直下に前 PR のファイルが残り、次の feature branch が衝突・上書きする構造問題が起きる（ACE-021 と同型）。pr-ready 直前に (a) 中身を PR description に転記、(b) `git rm implementation-notes.md` で削除、(c) `git commit -m "chore: integrate implementation-notes into PR description"` の 3 ステップで処理する。長期保存したい場合は `notes/<issue-num>.md` 形式で per-PR ファイル化する代替案もあるが（並行 PR で衝突しない）、リポに notes/ が累積するトレードオフがある
6. **スコープ外発見は引き続き Issue 化（[workflow-principles.md 原則2](../05-operations/deployment/workflow-principles.md)）**: implementation-notes は「現 PR の判断ログ」、Issue は「別タスクへの分岐」と役割を分ける（排他ではなく補完）

---

<a id="ace-035"></a>

### ACE-035: 新規 process パターンを Playbook に追加するときは「ドッグフード + advisor / second opinion」で運用上の構造問題を検出する

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                |
| ---------- | ----------------- |
| Category   | process           |
| Origin     | PR #420           |
| Related    | ACE-021 / ACE-034 |
| Date       | 2026-05-19        |
| Helpful    | 2                 |
| Harmful    | 0                 |
| Status     | active            |

**Insight**: 新しい process パターン（特に「マージ後の振る舞い」を伴うもの）を Playbook に追加する PR では、(1) その PR 自身で当該パターンを実行（ドッグフード）し、(2) advisor / second opinion に「この推奨を本リポで運用したら何が起きるか」を確認させる。初稿の机上判断だけだと、自リポの merge strategy（squash か否か）と矛盾する構造問題を見逃す。

**Context**: PR #420 で ACE-034 Action 5「マージ時の扱い」初稿に「(a) PR に同梱したまま残す」を推奨に設定。advisor がこれを「squash merge 標準のリポでは ACE-021 と同型の構造問題（次 feature branch がルート直下で衝突）を起こす」と指摘し、「(b) マージ前削除 + PR description 統合」に pivot。advisor を呼ばずにマージしていたら、自分の PR でドッグフードした implementation-notes.md が develop ルートに残り、次 PR が確実に衝突した。机上では見落とす運用問題が「ドッグフード + advisor」の組み合わせで検出された具体例。

**Action**:

1. **Playbook 新規エントリの Action / 推奨パターンには「自リポでの運用シミュレーション」段落を必ず通す**: 特に squash merge / rebase merge / merge commit の選択がエントリの推奨と矛盾しないか確認
2. **PR 自身でドッグフード可能なパターンは必ずドッグフードする**: implementation-notes.md / 命名規則 / コミットメッセージ規則など、PR 内で実行できるものは PR 内で 1 回回す
3. **advisor / second opinion を「初稿完成 → quality:local 通過 → commit 前」のタイミングで必ず呼ぶ**: post-commit に呼ぶと修正コストが上がる
4. **構造問題が見つかったら pivot 経緯を implementation-notes.md に記録**: pivot 自体が ACE Phase 1 の raw material になる（ACE-034 と組み合わせる）

---

<a id="ace-038"></a>

### ACE-038: 「データ収集待ち」を要求する受入基準でも、ロールバック容易な変更は先行実装 + 試行中ステータス明記でフィードバックループを早める

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                |
| ---------- | ----------------- |
| Category   | process           |
| Origin     | PR #423           |
| Related    | ACE-034 / ACE-035 |
| Date       | 2026-05-20        |
| Helpful    | 0                 |
| Harmful    | 0                 |
| Status     | active            |

**Insight**: 受入基準が「N サンプル運用後に判断」を要求する Issue では、(a) 変更が 1〜3 行で revert 容易 / (b) 待たずに動かす方が学習機会が増える、を満たす場合に「先行実装 + 試行中ステータス明示 + ロールバック条件明記」のパターンで前進できる。データを溜める時間も「観点なしで運用したら何が拾えないか」を観察できる時間として活用すべきで、観点ありで運用しながら評価する方が情報密度が高い。

**Context**: Issue #421 の受入基準は「ACE-034 を 5 PR 以上で運用してから判断」だったが、観点追加は 1 行 diff で revert コスト極小、かつ「観点なしで運用すると implementation-notes 由来の raw material が構造的に拾われない」リスクの方が大きいと判断。PR #423 で先に観点 7 を追加 + L57 / Changelog に「試行中: 5 PR で評価」を明記して、ロールバック条件を本文に残した状態でマージ。「待つ間に何が拾えなかったか」のデータも、観点 7 ありで運用しないと取れない構造になっていた。

**Action**:

1. **「データ収集待ち」受入基準を見たら 3 軸で判定する**: (a) 変更の revert コスト（行数・依存）、(b) 「待つ間に何ができないか」のコスト、(c) 試行中ステータスを文書化できるか
2. **revert コスト極小（1〜3 行）+ 試行中明示できる場合は先行実装**: ただし「試行中」「N PR で評価」「ロールバック条件」を**テンプレ本文に書く**（PR description だけだとマージ後にアクセスしづらい）
3. **試行中ステータスは目立つ場所に書く**: 観点 / ルールの末尾括弧（例: `（試行中: [Issue #XXX](...)、5 PR で評価）`）、または独立した「## 試行中」セクション
4. **評価期間後のロールバック判定 Issue を着手時に起票**: 「5 PR 後に評価」follow-up Issue を最初に作っておくと、評価忘れによる定着リスクが下がる（PR #423 では follow-up #424 #425 を同時起票）

---

<a id="ace-040"></a>

### ACE-040: AI プロンプトテンプレ内で同概念を複数の語で表現すると AI 出力品質が下がる — 一次定義（SSOT）の語彙に統一する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                |
| ---------- | ----------------- |
| Category   | process           |
| Origin     | PR #423           |
| Related    | ACE-014 / ACE-024 |
| Date       | 2026-05-20        |
| Helpful    | 0                 |
| Harmful    | 0                 |
| Status     | active            |

**Insight**: AI プロンプトテンプレや知見エントリで同概念を 2〜3 の異なる語（例: 「spec 乖離」「spec から逸脱」「spec から変更した点」）で表現すると、AI が「これらは別概念か？」と誤解する余地が生まれ、冗長な分類や category mismatch を引き起こす。**一次定義（最初に登場する場所）を SSOT として扱い、他は同じ語彙を使う**。ACE-024（SSOT 用語の既存定義との衝突確認）の dual: 一度確立した用語が**自リポ内で**徐々に変質するパターン。

**Context**: PR #423 のレビューで comment-analyzer S3 が指摘。元々 PLAYBOOK ACE-034 エントリは「spec から変更した点」「spec にない判断」を正準形として使っていたが、観点 7 ドラフトでは「逸脱」、L35 対象データ表セルでは「乖離」と表記揺れが発生していた。3 箇所で異なる語を使うと AI prompt として渡された時に AI が冗長分類するリスクあり。fix commit で全箇所を ACE-034 の正準語「spec にない判断 / spec から変更した点 / 捨てた選択肢」に統一。

**Action**:

1. **AI プロンプトテンプレ / 知見エントリで複数箇所が同概念に言及する場合、一次定義（SSOT）を grep で特定し、他箇所は同じ語彙を使う**: `grep -rn "<概念名>" docs-template/` で散らばりを確認
2. **新エントリ・新観点を起草するときは既存 SSOT 用語を最初に確認**: 既存 PLAYBOOK エントリの Insight 文 / Action ステップで使われている語彙をピックアップして草稿の語彙を合わせる
3. **レビュー段階で表記揺れが検出されたら、変更箇所だけでなくファイル全体を grep で確認して同 commit で統一する**: 部分修正だとレビュー後に新たな揺れが入る

---

<a id="ace-041"></a>

### ACE-041: マージ後 cleanup の未追跡ファイルガードに引っかかったら、独立した chore PR で .gitignore 追加して cleanup を継続する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                |
| ---------- | ----------------- |
| Category   | process           |
| Origin     | PR #423           |
| Related    | ACE-009 / ACE-012 |
| Date       | 2026-05-20        |
| Helpful    | 0                 |
| Harmful    | 0                 |
| Status     | active            |

**Insight**: マージ後 cleanup の `git status --porcelain` ガードでツール設定ファイル（`.codex/`、`.vscode/local.json` 等）に止まった場合、その場で削除や restore せず、独立した chore PR で `.gitignore` 追加するパターンが安全。CLAUDE.md「勝手に git restore / git clean しない」原則を守りつつ cleanup を継続できる。短命の chore PR は Draft + 並列セルフレビューをスキップ可能な「真に trivial な変更」の典型例。

**Context**: PR #423 マージ後の `/merge-cleanup 423` で `.codex/config.toml`（Codex CLI ローカル MCP 設定、`.claude/settings.local.json` と同型）が未追跡で検出され Step 1 ガードに引っかかった。中身を確認しユーザーに 3 択提示 → `.gitignore` 追加を選択 → chore branch `chore/#426-gitignore-codex` 作成 → 3 行追加 commit → 非 Draft PR #427 で直接 ready + merge → PR #423 + #427 の 2 本まとめて cleanup 完遂。

**Action**:

1. **cleanup ガードで未追跡ファイルに止まったら、中身を確認して 3 分類する**: (a) 作業中の commit し損ね → 元ブランチに戻して commit、(b) ツール / 個人設定 → chore PR + .gitignore、(c) ビルド成果物 → .gitignore
2. **ツール設定の chore PR は短命で済ませる**: 1 ファイル 1〜3 行の .gitignore 追加なら Toolkit/Copilot 並列レビューはスキップ可能（PR description に "trivial な .gitignore" と理由を明記）
3. **cleanup 中の chore PR は元 PR と同じ run で merge + cleanup する**: PR 番号を 2 つ持つ cleanup（`gh pr view A` + `gh pr view B` を順番に処理）で 1 cycle 完結
4. **`.gitignore` への追加は既存セクションの末尾**: `# <Tool name>` 見出し + パターン 1 行で、既存パターン（`.claude/settings.local.json` 等）と同じスタイルに合わせる

---

<a id="ace-044"></a>

### ACE-044: review 指摘を取り込むスコープは「編集セクション境界」で判定する — 触ったセクション内の隣接 stale は同 PR、別ファイル / 別セクションは別 issue

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                          |
| ---------- | --------------------------- |
| Category   | process                     |
| Origin     | PR #429 / Issue #417        |
| Related    | ACE-032 / ACE-037 / ACE-043 |
| Date       | 2026-05-20                  |
| Helpful    | 2                           |
| Harmful    | 0                           |
| Status     | active                      |

**Insight**: Toolkit / Copilot review は編集差分から離れた行も検査するため、本 PR で触っていない pre-existing stale を発見することがある。これを「同 PR で潰す」か「別 issue にする」かは「touch ファイル外 vs ファイル内」だけでは粒度が粗く、**「同セクション (= heading 配下) vs 別セクション」の境界** を判定軸に加えると読み手にとって自然な PR diff になる。同セクション内の隣接 stale を放置すると、`build:spec-index` を追加した PR が「半端な最新化（隣の行は古いまま）」と読まれ、レビュー時の文脈分断を招く。

**Context**: PR #429 で `docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md §3.2-3.3` を編集（`build:spec-index` 追加）。Toolkit comment-analyzer が以下を検出:

- **W1**: 同 §3.2 内 line 89 注記「`package.json` に `format:md` は存在しません」が事実誤認（実態は `format:md` / `format:md:check` の両方が存在）。本 PR では line 89 を触っていなかったが、隣接行（line 86 表の `build:spec-index` 追加）を編集したため「半端な最新化」と読まれる risk。**同 PR で整合**。
- **W2**: 同 §3.3 内 line 94「中身の順序」で `format:md:check` 欠落（pre-existing）。本 PR で同行に `build:spec-index` を**挿入したことで** 「この行を最新版に整えた」と読まれる risk が高まった。**同 PR で 1 トークン追加して整合**。
- **S2/S3**: `README.md:74` / `.github/pull_request_template.md:28` の stale 記述（`quality:local` の chain 列挙）。本 PR では触っていないファイル。**別 issue 化 (#430)**。

3 段階の判定基準が機能した: (1) touch ファイル外 = 別 issue、(2) touch ファイル内かつ別セクション = 状況次第（W1/W2 は同セクションだったので同 PR）、(3) touch セクション内 = 機械的に同 PR で整合。

**Action**:

1. **review 指摘を分類するとき 3 段階で判定**: (a) touch ファイル外 → 別 issue を即起票（CLAUDE.md「『別 Issue』と言ったら即 `gh issue create`」ルール）、(b) touch ファイル内 / 別セクション → 影響範囲と PR スコープを天秤にかける、(c) touch セクション内 → 1 fix commit に束ねて同 PR で機械的に整合
2. **「半端な最新化」を意識的に回避する**: PR で同行や隣接行に変更を加えたら、その行が含まれる説明全体が一致しているかを再走査。`grep -n <ファイル>` で section の境界を確認してから fix commit を切る
3. **別 issue 化したものは fix commit のコメントで明示**: PR コメントで「W1/W2 は本 PR で対応、S2/S3 は #430 で別対応」のように issue 番号を引いてレビュアーの脳内マップを補助する
4. **pre-existing と本 PR 起因を区別する**: コミットメッセージで「W1 (comment-analyzer): pre-existing で本 PR で隣接行を編集したため整合対応」のように **来歴を残す**。これにより後続の review が「なぜこの 1 行も直したのか」を辿れる
5. **本 PR スコープ判定で迷ったら軽量側 (= 範囲内) に倒す**: CLAUDE.md ルール「過剰な issue 分割は PR の流れを止める」と整合。ただし「触っていないファイル」だけは別 issue を例外なく適用する

---

<a id="ace-441-2"></a>

### ACE-441-2: pre-commit hook は正式品質ゲート（quality:local）の軽量サブセット — pr-ready 前に必ず full ゲートを回す

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #441 / Issue #440 |
| Related    | ACE-043              |
| Date       | 2026-05-30           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: pre-commit hook が通っても、正式品質ゲート（`npm run quality:local`）が落ちうる。hook は速度優先で軽量サブセット（このリポジトリでは markdownlint のみ）しか実行しないため、prettier `--check`・MCP build/check・各テスト・docs 検証・spec-index などの追加チェックは hook を素通りする。**commit が通った＝ゲート通過、と錯覚しない。**

**Context**: PR #441 で、commit 時の pre-commit hook（markdownlint のみ）は全 commit で 0 error だったが、`quality:local` を回すと `format:md:check`（prettier `--check`）が 3 ファイルで未整形を検出して落ちた。markdownlint は通すが prettier 整形は別ルールのため、hook だけを信じて pr-ready にすると CI 相当の `quality:local` で初めて落ちる。

**Action**:

1. **pr-ready の前に必ず `npm run quality:local` を通しで回す**（10 ステップ workflow の Step4）。hook 通過をゲート通過と同一視しない。
2. doc/設定変更を含む PR では特に prettier 整形漏れに注意。`npx prettier --write <変更ファイル>` を pre-ready で一度かける。
3. hook と full ゲートの差分（何が hook に無く full にあるか）を把握しておく。

---

<a id="ace-445-1"></a>

### ACE-445-1: Claude 系レビュアーが「既存と整合的だから OK」と全員一致した箇所こそ cross-model レビューの出番 — 同系列の合意は正しさの証明ではない

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #445 / Issue #444 |
| Related    | ACE-001              |
| Date       | 2026-06-19           |
| Helpful    | 5                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 同系列（Claude）の複数レビュアーが borderline な silent-failure を「既存コードとの整合性」を理由に全員一致で承認しても、それは安全の証拠にならない。むしろ「既存と整合的だから OK」という同系列の合意は、cross-model（別系列）レビューが最も価値を出すシグナルである。整合性（consistency）は正しさ（correctness）の証明ではない。

**Context**: PR #445 で env 変数の閾値を `Number.parseInt` で解釈する `parseMaxPlaybookLines` を、既存 `parseMaxPerCategory` を mirror して実装した。subagent-driven の Task レビュー（sonnet）2 回 + 最終 whole-branch レビュー（opus、本セッション最高能力モデル）すべてが APPROVED。opus は `Number.isFinite` の冗長さを「sibling parser との意図的 mirror で、乖離させる方が悪い」と明示的に**修正に反対**した。しかし Codex（gpt-5.4）の silent-failure-hunter と code-reviewer が独立に「`"800abc"`→800、`"1e3"`→1 を無警告で受理する入力検証ギャップ」を Important として検出。共有ヘルパー `parsePositiveIntEnv`（`/^[0-9]+$/` で厳密化）に抽出して両パーサを同時に堅牢化し、乖離ではなく収束で解消した（[ACE-001](#ace-001) を一段具体化した事例）。

**Action**:

1. Claude 系セルフレビュー（`pr-review-toolkit` / subagent-driven の task・final レビュー）が全員 APPROVED でも、**cross-model レビュー（Codex `scripts/codex-review.sh --base develop`）を省略しない**。特に「既存と整合的だから」という理由で borderline を承認した箇所は cross-model に回す価値が高い。
2. 既存 helper を mirror するときは、**mirror 元の欠陥（loose な `parseInt` 等）を継承していないか**疑う。修正は片方だけ直して乖離させるより、共有ヘルパーに抽出して両方同時に堅牢化する。
3. 入力検証は「mirror 元と同じ」ではなく、字面で正しさを担保する（例: `/^[0-9]+$/` で厳密な正の整数のみ受理）。

---

<a id="ace-447-3"></a>

### ACE-447-3: 大規模 doc PR の cross-model レビューは clean verdict に収束しない — ゲートは「Critical 不在＋実 Important 全対応」、green を待ってループしない

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #447 / Issue #446 |
| Related    | ACE-445-1, ACE-001   |
| Date       | 2026-06-23           |
| Helpful    | 1                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 多数ファイルのドキュメント PR では、LLM cross-model レビュー（Codex 等）は毎ラウンド新しい言い回し・整合性 nit を出し、REJECTED 判定が green に収束しにくい。マージ可否のゲートは「verdict が PASS になること」ではなく「**Critical がゼロ＋検出された実 Important を全対応したこと**」に置く。clean verdict を待って無限ループしない。ただし cross-model 自体は省略しない（[ACE-445-1](#ace-445-1)）。

**Context**: PR #447（Issue テンプレ刷新、15+ ファイルの Markdown）で Codex を3ラウンド実行し、いずれも REJECTED（Critical=0、毎回 doc 整合の Important を2〜4件検出）。各ラウンドで実指摘を fix commit に束ねて対応し、silent-failure/type/test は2ラウンド目以降安定 PASS、code-reviewer/comment-analyzer は新しい nit を出し続けた。ユーザーの「Critical 指摘がなければマージを止めない」ポリシーに従い、実 Important 全対応・Critical 不在を確認して merge した。

**Action**:

1. cross-model レビューは必ず回す（[ACE-445-1](#ace-445-1)）が、ループ終了条件は「Critical=0 かつ実 Important 全対応」。green verdict は終了条件にしない。
2. 各ラウンドの指摘は「実バグ/不整合」と「誤検知/好みの言い回し」を切り分け、前者のみ fix。誤検知は根拠付きで却下し記録する（例: `#インフラ` は実在見出しに解決＝誤検知）。
3. 収束しない兆候（毎回 Critical=0 で新規 nit のみ）が出たら、ループを打ち切りマージ判断をユーザーに提示する。

---

<a id="ace-449-2"></a>

### ACE-449-2: 「既定から外す」変更はデータの空化ではなく明示的なゲート条件で実装し、ドキュメントに書いたオプトイン手順はその場で回帰テストに固定する

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #449 / Issue #448 |
| Related    | ACE-445-1            |
| Date       | 2026-07-02           |
| Helpful    | 1                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 「X を既定から外すがオプトインは残す」という要件を「X の割り当てデータを空にする」で実装すると、除外（既定で動かない）は達成できてもオプトイン経路（明示指定で動く）が一緒に死ぬ。しかも実行系は空プランを exit 0 で完走するため、ドキュメントの案内どおりに実行したユーザーは「動いた」と誤解する三重のサイレント失敗になる。除外は「明示指定がない場合のみスキップ」というゲート条件で表現し、ドキュメントに書いた具体的なコマンド例（オプトイン経路）は同 PR で回帰テストに固定する。

**Context**: PR #449 で Copilot をレビュー既定から外す際、初版は `get_cli_perspectives_review` の copilot 行を空文字にした。Claude 系 code-reviewer は「問題なし」で通過したが、Codex（cross-model）と silent-failure-hunter が独立に「`--cli copilot-cli` 明示でもプランに載らず exit 0」を検出（[ACE-445-1](#ace-445-1) の再演）。perspectives を復元し「review タスクかつ `CLI_FILTER` 空のときのみ skip」のゲートに実装し直し、空実行プランは非 dry-run で exit 1 に変更、`--cli copilot-cli` オプトインを含む 9 テストを `scripts/multi-agent.test.ts` に固定した。

**Action**:

1. 「既定から外す」は割り当てデータの削除ではなく、**プラン構築時のゲート条件**（明示オプトインで素通し）で実装する。
2. ドキュメント・コメントに具体的なオプトインコマンドを書いたら、**その コマンドが動くことを同 PR のテストで検証**する（案内と実装の drift を構造的に防ぐ）。
3. 実行対象が 0 件のプランは警告ではなく **非ゼロ exit** にする — 「何も実行せず成功」はゲート系ツールで最悪のサイレント失敗。

---

<a id="ace-459-2"></a>

### ACE-459-2: linked worktree での並行開発は「メインと同じ」前提が3箇所で破れる — husky 不発・gitignore の symlink すり抜け・共有 config 汚染

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #459 / Issue #453 |
| Related    | ACE-459-1            |
| Date       | 2026-07-02           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: `git worktree add` で作った作業ツリーはメインと同じに見えて、(a) husky v9 の hooks 実体 `.husky/_` は untracked のため worktree に存在せず **pre-commit / pre-push が無言で発火しない**、(b) `.gitignore` の `node_modules/`（末尾スラッシュ）はディレクトリ限定で **symlink の node_modules を無視せず誤コミットできる**、(c) `.git/config` はメインと共有のため worktree 内での事故（ACE-459-1）が**メイン側にも波及**する。

**Context**: PR #459 を worktree で並行開発した際、(a) により初回 push が品質ゲートなしで通り、`npm run prepare` 実行後に初めて hook が発火。(b) により依存共有用の symlink node_modules がコミットに混入（mode 120000）し amend で除去。(c) は ACE-459-1 の破壊がメインの config に及んだ形で確認。

**Action**:

1. worktree を作ったら最初に `npm run prepare`（husky 再セットアップ）を実行し、hooks が発火することを確認してから作業する。
2. `.gitignore` のディレクトリ除外は末尾スラッシュなし（`node_modules`）にして symlink も無視させる。
3. worktree での `git add -A` 後は `git status --short` で mode 120000（symlink）の混入がないか確認してからコミットする。

---

<a id="ace-464-2"></a>

### ACE-464-2: cross-model レビューが実質的な新指摘を出し続けるなら各指摘を patch せず「設計を疑え」— 停止は「新規 Critical/Important 不在」

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値         |
| ---------- | ---------- |
| Category   | process    |
| Origin     | PR #464    |
| Date       | 2026-07-03 |
| Helpful    | 0          |
| Harmful    | 0          |
| Status     | active     |

**Insight**: cross-model レビューが round を重ねても新しい substantive 指摘（破壊性・silent failure・traversal…）を出し続けるのは、細部の欠陥ではなく approach 自体が間違っているサイン。個別 patch を積み続けるより approach をピボット（削除ベース→プラン駆動）した方が、関連指摘群がまとめて構造的に消える。ループの停止は all-green ではなく「新規の実質 Critical/Important が出ないこと」で判断する（[ACE-447-3](#ace-447-3) の code PR 版）。

**Context**: PR #464 は Codex を 9 round 回した。削除ベース設計への指摘（消しすぎ／残しすぎ）が round をまたいで収束せず、プラン駆動へ設計転換した途端に破壊性/残留/silent 系の指摘が構造的に解消。以降は traversal・重複・境界など細粒度の指摘に収束した。

**Action**: 同一テーマの指摘が 2〜3 round 続いたら「この設計を patch し続けるべきか」を自問し、必要なら実装途中でも approach をピボットする。停止ゲートは「Critical 不在＋実 Important 全対応＋回帰テスト（可能なら mutation で検知力を確認）」。primary（Toolkit）が pass 済みなら green を待って無限ループしない。

<a id="ace-465-2"></a>

### ACE-465-2: cross-model が指摘した「互換性破壊」も、修正案が Issue の明示的決定と矛盾するなら盲従せず実害（呼び出し元の実在）を検証して判断する

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値         |
| ---------- | ---------- |
| Category   | process    |
| Origin     | PR #465    |
| Related    | ACE-445-1  |
| Date       | 2026-07-03 |
| Helpful    | 1          |
| Harmful    | 0          |
| Status     | active     |

**Insight**: cross-model レビューは省略しない（[ACE-445-1](#ace-445-1)）が、その指摘を盲従もしない。cross-model が「互換性破壊」等を指摘し提示した修正案が、Issue で明示的に選ばれた方針と正面から矛盾する場合、修正案を鵜呑みにすると決定を覆すことになる。指摘の**妥当な核**（例: breaking change の存在）と**提示された修正案**（例: 互換レイヤーの追加）を分け、核が**実害を持つか**を検証してから対応を決める。実害ゼロ（依存する呼び出し元が実在しない）なら、決定を覆さず「**意図的な breaking change**」として明記するのが正しい対応。

**Context**: PR #465 で Codex code-reviewer が「silent に受理されていた `--delegate-toolkit` を exit 1 化するのは互換性破壊。互換レイヤーを挟むか breaking change として扱え」と指摘（Toolkit 系 4 観点は指摘せず Codex のみ = [ACE-445-1](#ace-445-1) の再演）。互換レイヤー案は Issue #451 が明示的に選んだ案2「未知フラグはエラー」と矛盾し、無効果フラグを警告付きで温存する元のアンチパターンへの逆戻りだった。リポジトリ内で `--delegate-toolkit` を呼ぶ自動化（husky / CI / `.claude/hooks`）が実在しないことを `grep` で検証し、互換レイヤーは採用せず PR 本文に意図的 breaking change として明記した。

**Action**: cross-model の指摘は「妥当な核」と「提示された修正案」を分けて扱う。修正案が Issue / 設計で明示的に決めた方針と矛盾するなら、`receiving-code-review` に沿って実害を検証してから push back する。破壊的変更系の指摘は「その破壊に実際に依存する呼び出し元が存在するか」を `grep` / 検索で確認し、実害ゼロなら方針は維持しつつ意図的 breaking change として PR 本文・commit に明記する。関連: [ACE-445-1](#ace-445-1)（同系列合意より cross-model）/ [ACE-447-3](#ace-447-3)（clean verdict を待たない）。

<a id="ace-484-1"></a>

### ACE-484-1: テンプレート欠陥の修正は「実際にコピーされる実体」を先に特定する — 報告先リポジトリと配布実体が別だと直しても下流に届かない

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #484 / Issue #483 |
| Date       | 2026-08-28           |
| Helpful    | 2                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 同じ名前のテンプレートが複数リポジトリに実体を持つとき、「欠陥が報告されたリポジトリ」と「実際にコピー元として読まれるリポジトリ」は一致するとは限らない。着手時に**セットアップコマンドがどのパスを読むか**を確認しないと、直したのに下流の出力が変わらない。再現確認の段階で「報告された欠陥が手元で再現しない」が出たら、それは Issue の誤りではなく**別実体を見ているサイン**として扱う。

**Context**: Issue #483（downstream 展開時のテンプレート欠陥 8 件）を本リポの `docs-template/` に照合したところ、2 件（ACE 追記先の三説併存 / カテゴリ 8 種 vs 11 種）が再現しなかった。原因を追うと、`/init-docs` と `/ace-setup` の SKILL.md はいずれも `${FF_DEV_TOOLKIT_ROOT}/docs-template/` を読んでおり、**実際のコピー元は ff-dev-toolkit プラグイン同梱の docs-template** だった。プラグイン側は PLAYBOOK が 11 カテゴリ・`playbook/` 分割方式へ進化しており、公開リポ側は 8 カテゴリ・800 行分割のままという乖離が生じていた。プラグイン側の実ファイルを確認すると 8 件すべてが再現した。

**Action**: 配布物の欠陥修正に着手する前に、(1) セットアップ手順（SKILL.md / スクリプト）が参照するパスを grep し、(2) そのパスの実体と自リポの該当ファイルを `diff -rq` して乖離の有無を確認する。乖離があれば「どちらが SSOT か」を先に決め、修正 PR には**この修正だけでは下流の挙動が変わらない**旨と移植先 Issue を明記する。再現しない項目は「Issue の誤り」ではなく「実体差」を第一仮説にする。関連: [ACE-021](#ace-021)（テンプレ配布リポ分離）。

<a id="ace-508-2"></a>

### ACE-508-2: 大量の機械的文書変換はサブエージェントへ委譲し、検出器（テスト）は自分で先に赤にしてから渡す — 規約は変換の前後例・注記の文言と配置・完了条件の走査スクリプトを明示する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | process | Origin | PR #508 / Issue #490 |
| Related | ACE-484-2 |
| Date | 2026-09-06 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

初期セット外リンク 78 件の inline code 化を、テスト拡張（自分、TDD で先に失敗させる）と文書書き換え（サブエージェント）に分けて並列にした。委譲プロンプトに (1) 変換の前後例（`[x](./deployment/x.md)` → `` `docs/05-operations/deployment/x.md` ``、アンカーは節名の散文へ）、(2) 注記の正確な文言と挿入位置（ファイルごと・節ごとに 1 回）、(3) 触ってよいファイルの列挙と禁止事項（commit / branch / scripts）、(4) 完了条件として残件を数える走査スクリプト（0 件で完了）を入れたところ、1 往復・修正なしで通り、テストも初回緑になった。規約を「PR #484 の前例に従って」のような参照だけで渡すと、パス形式（展開先 `docs/...` か参照元相対か）や注記の粒度がぶれる。ただし委譲側の走査スクリプトも検出器と同じ前提（`.md` 限定）を共有していたため、[ACE-508-1](#ace-508-1) の取りこぼしは委譲では見つからない — 検出器の網羅性は委譲前に別途疑う。

---

<a id="ace-510-2"></a>

### ACE-510-2: 文書の節単位置換では、置換範囲の終端に「削るつもりのない節」を置かない — 置換後に見出し一覧の before / after を diff して、隣接節の消失を機械的に確かめる

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | process | Origin | PR #510 / Issue #486 |
| Related | ACE-508-2 |
| Date | 2026-09-06 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

FALLBACK.md §4 を「`### ✅ OK` 見出しから `### 再試行ユーティリティ` 見出しまで」の範囲で書き直した際、その間にあった「### 適用判断ガイド」表（7 行の散文ルール）を新テキストに含め忘れ、丸ごと消した。lint / format / validate はすべて通り、code-reviewer が 2 巡目で「grep してもどこにも無い」と気づくまで残った。範囲置換は「置換したい節の直後の見出し」を終端にし、置換前後で `grep -n "^##"` の出力を diff して、消えた見出しがゼロであることを確認してからコミットする。写経される文書では節の消失はリンク切れより発見が遅い（参照が無い節は誰も辿らない）。

---

<a id="ace-519-1"></a>

### ACE-519-1: 受け入れ条件に検査コマンドを書くときファイル引数でスコープを狭めない — 狭めた検査はそのまま通るため「検証済み」の錯覚を作り、同じ主張を持つ他ファイルが無検査で残る

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | process | Origin | PR #519 / Issue #517 |
| Related | ACE-018 / ACE-022 / ACE-505-2 |
| Date | 2026-09-07 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

Issue #517 の AC は `grep "Actions 非依存" docs/AI_GIT_WORKFLOW.md CLAUDE.md` と 2 ファイルを名指しし、実装はこれを 0 件にして AC を満たした。だが同じ無条件主張は `.cursorrules`（3 つ目の AI 設定ファイル）と `docs/FRONTMATTER_GUIDE.md` に残り、Toolkit レビューで初めて出た。AC の検査コマンドは「合格の定義」として読まれるので、引数で狭めた範囲がそのまま検証範囲になり、狭さ自体は起票者も実装者もレビュアーも疑わない。起票時はスコープを引数で絞らず対象ツリー全体を掃く形で書く（絞るなら除外パスと理由を AC に併記する）。実装側は AC の検査が通っても、同じ主張語で 1 度はリポジトリ全体を掃く。

---

<a id="ace-519-2"></a>

### ACE-519-2: 一方向同期のツリーでは同期可否フラグの値ごとに壊れ方が逆になる — 同期対象は SSOT を直さないと巻き戻り、同期対象外は SSOT を直しても下流コピーが凍結したまま残る

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | process | Origin | PR #519 / Issue #517 |
| Related | ACE-484-1 / ACE-021 |
| Date | 2026-09-07 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

`scripts/sync-to-public.mjs` は internal（SSOT）→ public の一方向同期で、frontmatter が `visibility: public` の文書だけを運び、対象外は削除せず orphan として報告する。PR #519 が public 側で直した 2 文書はこの値で挙動が分かれた — `visibility: public` の `AI_GIT_WORKFLOW.md` は次回同期で上書きされ Issue #517 の AC ごと巻き戻る一方、`visibility: internal` の設計文書は同期が触らないため SSOT を直しても public 側のコピーは古いまま残る。「実際にコピーされる実体を先に特定する」（ACE-484-1）だけでは後者が漏れるので、編集前に同期可否フラグを読み、対象なら SSOT 側を、対象外なら両側を直す（または下流コピーを消す）。同期が長く走っていないリポジトリでは巻き戻りが「いつか必ず起きるが今日は起きない」形で潜伏するため、同期の再開前に解消しておく。

---

<a id="ace-532-1"></a>

### ACE-532-1: 形式ゲートを入れるときは追記テンプレと Generate 出力ラベルも同時に正準フォーマットへ揃える

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | process | Origin | PR #532 / Issue #478 |
| Date | 2026-09-14 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

エントリ形式の機械ゲートだけ先に入れると、追記テンプレが旧形式のまま新規 ID を旧形式で書き続け、allowlist 初期化後もゲートが赤くなるか allowlist が肥える。Generate 出力が `**Insight**` ラベルだと、メタがコンパクトでも本文マーカーで旧形式判定される。ゲート・テンプレ・Phase 1 出力を同じ変更で揃える。

---

<a id="ace-533-2"></a>

### ACE-533-2: 推奨入口と互換入口を同じコードフェンスに並べず、エラー案内は実出力の文言で書く

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | process | Origin | PR #533 / Issue #491 |
| Date | 2026-09-14 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

同じフェンスに `/multi-review` と `codex-review.sh --fresh` を並べると、上から実行したエージェントが推奨結果を直後に退避し課金も二重になる。clone 直後の実エラーは `setup-multi-agent.sh` と名前だけ出し、パス付きコマンドは版不一致のときだけ出る。コピー用フェンスは推奨入口 1 本にし、エラー案内は実出力を写し、リポジトリ直下の同名スクリプトと toolkit の setup を混同させない。

---

<a id="ace-537-1"></a>

### ACE-537-1: バックグラウンド実行では tail -n へパイプせず、出力は素のまま流して完了後に出力ファイルを絞る

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | process | Origin | PR #537 / Issue #480 |
| Date | 2026-09-14 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

長時間コマンドを `cmd | tail -n` でバックグラウンド起動すると、`tail -n` が末尾確定のため EOF を待ち、ホストの出力ファイルは終了まで空になる。途中失敗に気づけない。「パイプしない」という知識だけでは、長い出力を要約したい動機のほうが強く再発する。バックグラウンドではコマンドを素のまま起動し、絞り込みは完了後にホストが保存した出力ファイルへ対して行う。`grep` / `head` は EOF 待ちとは別挙動なので同じ「終了までバッファ」に畳まない。

---
