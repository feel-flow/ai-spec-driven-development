# PLAYBOOK Archive — ツール (tooling)

> **Parent**: [PLAYBOOK.md](../../PLAYBOOK.md) — アーカイブ済みエントリの保管場所。
> `playbook/archive/` 配下は `ace_entry_count`・カテゴリ件数ゲート・reuse 集計の対象外。
> 参照リンクが切れていた場合はこのディレクトリを ID で grep して探す。
>
> **保全本文内の相対リンクは live 基準**: 各エントリ本文は原文を verbatim 保全しているため、本文中のリンクは live の PLAYBOOK.md（`docs-template/08-knowledge/` 直下）を基準に書かれている。`#ace-xxx` だけのリンクは `../../PLAYBOOK.md#ace-xxx`（リンク先自体がアーカイブ済みならこのディレクトリを ID で grep する）、`./` や `../` で始まるリンクは `docs-template/08-knowledge/` からの相対パスに読み替えること。このディレクトリから直接辿ると (a) ファイルが存在しない、(b) anchor が無い、(c) **live ではなくアーカイブ済みの複製に着地する**（リンクチェッカーには映らない）のいずれかになる。live のエントリは [PLAYBOOK.md のエントリ一覧](../../PLAYBOOK.md#エントリ一覧) から引くこと。

---

<!-- markdownlint-disable MD051 -->

## アーカイブ済みエントリ

<a id="ace-002"></a>

### ACE-002: CLIフラグは実機の --help 出力と照合が必須

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #316 / Issue #315 |
| Date       | 2026-03-10           |
| Helpful    | 2                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: Web検索やAI生成の情報だけでは CLI フラグの正確性は保証されない。`codex -p` は存在せず `codex exec` が正解、Copilot `-s` は sandbox ではなく `--silent`、Cursor `-p` は boolean フラグでプロンプトは positional 引数など、実機確認しなければ分からない差異が多い。

**Context**: Multi-CLI Review ドキュメント作成時に5つのAI CLIのフラグを調査。Web検索とAI生成の情報を信じてドキュメント化したが、セルフレビューと実機テストで複数の誤りが発覚。特に Codex CLI は `-p` フラグが存在しないにもかかわらず、Web上の古い情報では `-p` が使われていた。

**Action**: CLI ツールのフラグを記述する際は、(1) `command --help` で実機確認、(2) 公式リポジトリの README/docs と照合、(3) 可能なら `--dry-run` 等で動作確認、の3ステップを必ず実施する。

---

<a id="ace-006"></a>

### ACE-006: サンプル付きテンプレファイルには⚠️SAMPLEバナーと固有化手順を必ず併設する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #369 / Issue #368 |
| Date       | 2026-04-26           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: docs-template/ 配下のテンプレで具体例（特定ドメインのパス・名前）を含める場合、採用プロジェクトが固有化を忘れて「サンプルのまま運用される」失敗モードが発生する。冒頭の **⚠️ SAMPLE バナー** と末尾の **「プロジェクト固有化の手順」** セクションをセットで配置することで、採用時の見落としを構造的に防げる。

**Context**: PR #369 の `DECISION_TREE.md` は Web API バックエンドをサンプルドメインとして `infrastructure/clients/` 等の具体的パスを含む構成にした。設計時の失敗モード分析で「Web API サンプルのパスが消えないまま使われる（F1）」「自プロジェクトと合わない分岐が残る（F2）」を識別し、防御策として SAMPLE バナーとプロジェクト固有化手順（コピー → 書き換え → バナー削除 → frontmatter 更新）を明文化。

**Action**: docs-template に具体例（コードパス、ドメイン名、実装名）を含む新規テンプレファイルを追加する際は: (1) ファイル冒頭に `> ⚠️ **SAMPLE — テンプレートです**` 引用ブロックと書き換え案内を配置、(2) 末尾に「プロジェクト固有化の手順」セクション（番号付き手順 + frontmatter の `created/updated/owner` 置換まで含める）を配置、(3) 該当しない分岐・セクションは「**該当セクションごと削除してよい**」と明記、(4) 該当する失敗モード（採用後にサンプルのまま残る等）を仕様書側にリストアップしておく。

---

<a id="ace-007"></a>

### ACE-007: Claude Code skill 内のツール参照は名称・subagent_type を実機 / system prompt で照合する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #374 / Issue #373 |
| Date       | 2026-04-26           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: Claude Code の skill 定義（`.claude/commands/*.md`）に SubAgent 起動を書く際、ツール名は **`Task`** であり `Agent` ではない。subagent_type も Claude Code 公式の組み込み（`Explore` / `general-purpose` 等）と照合する必要がある。誤った名称を skill に書くと、実行時にモデルが対応するツールを引けず失敗する。

**Context**: PR #374 の `/refine-issue` skill で `Agent ツール（subagent_type: Explore）` と記述したところ、4 つのレビュアー（Toolkit code-reviewer / comment-analyzer、Copilot、Gemini）のうち 3 つが「`Agent` ツールは Claude Code に存在しない、`Task` が正解」と独立して指摘。設計プラン側でも `Task tool` と `Agent(...)` の表記揺れがあった。Claude Code の system prompt で公式 tool 一覧と Available agent types を確認すれば防げる。

**Action**: skill 内で SubAgent / Tool 呼び出しを書く際は、(1) Claude Code の公式 system prompt 内 "Tools available" / "Available agent types" を確認、(2) ツール名 `Task` / `Edit` / `Read` 等を正確に書く、(3) `subagent_type` は組み込み（`general-purpose`, `Explore`, `output-style-setup`, `statusline-setup` 等）+ プロジェクトの `.claude/agents/` 定義を確認、(4) 環境依存の subagent_type（`Explore` 等）は `general-purpose` を fallback として併記する。

---

<a id="ace-008"></a>

### ACE-008: クロスリポジトリ操作する skill は全 gh コマンドに `--repo` 必須・mention は `@<assignee>` を使う

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #374 / Issue #373 |
| Date       | 2026-04-26           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: skill が「クロスリポジトリ対応」を謳う場合、`gh issue view` だけでなく **`gh issue edit` / `gh issue comment` / `gh label create` / `gh issue edit --add-label` の全てに `--repo <owner/repo>` を渡す**必要がある。1 つでも欠けると、別 repo の Issue を更新できないか、現在の repo の同番号 Issue を誤更新する。さらに mention placeholder は `@<owner>` だと GitHub が repo 所有者（organization）と解釈して**組織全体に通知が飛ぶ事故**が起きるため、`@<assignee>` を使う。

**Context**: PR #374 の `/refine-issue` skill 初版で、`gh issue view` には `--repo` を付けていたが後続の edit / comment / label create には付け忘れていた。Copilot と Gemini の両方が「全 gh コマンドに `--repo` を渡せ」を独立して指摘。さらに Gemini が `@<owner>` プレースホルダの誤メンション問題を指摘し、`@<assignee>` への変更を提案。

**Action**: クロスリポジトリ対応 skill を書く際は、(1) skill 冒頭の入力パースで `repo` を確定したら以降の **全** gh サブコマンドに `--repo <owner/repo>` を必須で渡す規約を明示、(2) skill 末尾に「使用する gh CLI コマンド一覧」テーブルを置いて保守者が一覧確認できるようにする、(3) mention placeholder は `@<assignee>` を使い、bot suffix（`[bot]`）は skip する fallback 規則を書く、(4) `gh label create` は `--force` で「不在時 create / 存在時 update」の冪等にする。

---

<a id="ace-011"></a>

### ACE-011: Prettier × markdownlint MD060 衝突は当該テーブルだけに `<!-- prettier-ignore -->` を付与する局所抑制で解く

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #388 / Issue #386 |
| Date       | 2026-04-30           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: Prettier と markdownlint は GFM テーブル整列の判定基準が異なる（Prettier は `string-width` / Unicode 11 emoji 幅、markdownlint MD060 は東アジア幅基準）。絵文字（🛠 など）混在テーブルでは、Prettier が「整列している」と判断する状態で markdownlint MD060 が「整列していない」と判断する、両者を同時に満たす整列が存在しない衝突状態が生じる。設定レベル（`proseWrap` / `printWidth`）で解決しようとしても無理（両者の幅算定アルゴリズム自体の差なので config では合わせられない）。最小スコープの解は当該テーブル直前に `<!-- prettier-ignore -->` を 1 行付与し、markdownlint 側に整列を合わせること。Prettier はその 1 ブロックだけスキップし、他のテーブル / 本文整形は通常通り効く。

**Context**: PR #388 で `prettier@^3.8.3` を Markdown 整形ツールとして導入する際、`docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md` の `🛠 Fixes` を含む 2 つのテーブル（行 47 / 行 151）で Prettier 整形後に MD060 が 3 件 fail する状態を確認。`format:md:check` と `lint:md` を同時に通したいが、`prettier --write` を当てると markdownlint が落ち、markdownlint に合わせると `format:md:check` が落ちる、というデッドロック。`<!-- prettier-ignore -->` を当該テーブルの直前に置き、markdownlint が要求する trailing-space 整列を保持する形で両立を実現。

**Action**: AI エージェントが Markdown lint と Markdown formatter を同居させるリポジトリで作業する際:

1. **Prettier 導入 PR では必ず先に `npm run format:md && npm run lint:md` を順に実行**してデッドロック箇所を洗い出す。後から個別 fix するより、衝突候補を最初に列挙する方が局所抑制スコープを正確に定義できる。
2. **衝突は「絵文字 / 全角記号 / 半角・全角混在」のテーブルセルに集中する**ことを前提に視覚検査する。string-width の Unicode 幅テーブルと markdownlint の幅判定の差は予測不能なので、empirical に当該行を見つけるしかない。
3. **`<!-- prettier-ignore -->` は当該テーブル / コードブロックの直前に 1 行置くだけ**。範囲指定（end コメントなど）は不要で、Prettier は次の単一ノードだけをスキップする。グローバル `.prettierignore` で対象ファイル全体を除外するのは過剰（他の整形が利かなくなる）なので避ける。
4. **PR 本文に「Prettier (string-width 基準) と markdownlint MD060 (異なる幅算定) で衝突する」理由を明記する**。再発時に他の作業者が同じ調査を 0 から繰り返さないため。
5. **`format:md:check` を `quality:local` に組み込む順序は `validate → format:md:check → lint:md`**。整形検査を構文検査の前に置くことで「整形漏れ」と「文法違反」が同時に出ても切り分けやすくなる。

---

<a id="ace-020"></a>

### ACE-020: 自動コンテンツ生成ツールは自身のマーカー文字列を本文に含むドキュメントを破壊する

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #403 / Issue #402 |
| Related    | -                    |
| Date       | 2026-05-07           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: セクションヘッダーを目印にしてファイル末尾を書き換える自動生成ツール（backlinks 自動更新、TOC 自動生成、auto-changelog 等）は、**そのマーカー文字列を本文中に説明として書いているドキュメントを破壊する**。マーカーが「セクション開始位置」と「本文の説明文」の両方の意味で出現するため、ツールは説明文の途中をセクション開始と誤認し、それ以降を全削除する。`tsc` や `npm test` では検出できない（ファイルは valid な markdown のまま）。問題はランタイムにのみ顕在化し、被害は破壊されたファイルが PR に紛れ込んだ後に気づく。

**Context**: 2026-02-12 commit `6ea43f8`（Issue #311 を参照し PR を経ず develop へ直 commit）で導入された `scripts/obsidian-sync.mjs` は各 markdown 末尾に `## Linked from` セクションを自動生成する設計だった。しかし `docs-template/08-knowledge/OBSIDIAN_GUIDE.md` 自身が「`## Linked from` セクションを自動生成する」と本文で説明しており、自動生成スクリプトはその文字列を section header と誤認して **OBSIDIAN_GUIDE.md を 379 行 → 26 行に破壊**（"各ドキュメント末尾に「" の途中で文章切断）。バグは 2026-05-07 の PR #400 マージ時に post-merge hook 経由で実行されて発覚し、Obsidian 統合全体の撤退判断（PR #403）の決定打となった。約 3 ヶ月間 silent に存在していた。

**Action**: 自動コンテンツ生成ツールを設計する際:

1. **マーカーは本文に出現しえない記法を選ぶ**: HTML コメント形式の sentinel（`<!-- BEGIN_BACKLINKS -->` ... `<!-- END_BACKLINKS -->`）など、説明文として地の文に書くのが不自然な形式を使う。`## Linked from` のような Markdown ヘッダーは本文の説明にも自然に登場するため不適。
2. **mutation 範囲を明示する begin/end ペアを必須にする**: 単一マーカーから「ファイル末尾まで全部置換」型は再帰汚染と相性が悪い。begin/end の両方が揃わないファイルはスキップする。
3. **自分自身の README/GUIDE を exclusion list に入れる**: ツールの動作を説明するドキュメントはそのツールの mutation 対象から外す。ツール側で `OBSIDIAN_GUIDE.md` のような既知ファイルを skip する allowlist/denylist を持つ。
4. **mutating tool は最低限の snapshot test を必ず添える**: 「マーカーを本文中に含むファイル」の golden file を input にして、出力が破壊されないことを assert するテストを最低 1 件入れる。tsc を通っただけでは ship してはいけない。
5. **post-merge / pre-commit など強制実行系に ship する前に dry-run モードを通す**: 自動化に組み込む前に、`--dry-run` で全対象ファイルへの想定変更を出力して目視レビューする。lint フックや husky に直接組み込んだ後はバグの被害が回復しにくい。

---

<a id="ace-039"></a>

### ACE-039: AI プロンプトテンプレに「分析観点リスト」と「分類カテゴリリスト」が並存する場合、新観点追加時はカテゴリ対応を観点側に明記する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                |
| ---------- | ----------------- |
| Category   | tooling           |
| Origin     | PR #423           |
| Related    | ACE-014 / ACE-024 |
| Date       | 2026-05-20        |
| Helpful    | 0                 |
| Harmful    | 0                 |
| Status     | active            |

**Insight**: AI プロンプトテンプレで「観点 N 項目 / カテゴリ M 種類」のように 2 つの列挙が並存する場合、新観点を追加するときに対応カテゴリを明記しないと AI が分類に迷う。観点リスト側に「カテゴリは X または Y を推奨」を 1 句書くだけで AI 出力の一貫性が大きく上がる。Gemini Code Assist のような副レビュアーが detect しやすい欠陥でもある。

**Context**: PR #423 で ACE Phase 1 Generate プロンプトに観点 7「判断ログ」を追加したが、L62 のカテゴリリスト（coding/architecture/testing/security/performance/devops/process/tooling）には観点 7 に対応する明示語がなく、Gemini Code Assist が medium priority で「観点 7 をどのカテゴリに分類すべきか不明確 → 推奨カテゴリを観点側に追記せよ」と指摘。fix commit で観点 7 に「カテゴリは `process` または `architecture` を推奨」を追記して解消。

**Action**:

1. **観点リストとカテゴリリストが並存するプロンプトで新観点を追加するときは、観点側に推奨カテゴリを明記する**: 「**観点名**: 説明（カテゴリは X または Y を推奨）」の形式で 1 句
2. **カテゴリリスト自体を観点と 1:1 にできる場合は構造化を優先**: 観点 N 項目とカテゴリ M 種類が異なる軸を持つ場合のみ (1) のパターンを使う
3. **副レビュアー（Gemini Code Assist 等の auto-bot）の medium priority 指摘は無視しない**: Toolkit 一次レビューで見逃すパターンを independent detect する役割を持つ。Critical でなくても「カテゴリ整合」「対応欠落」系の medium は対応すべき

---

<a id="ace-449-1"></a>

### ACE-449-1: `set -e` 下の bash 関数は末尾を `[[ cond ]] && cmd` で終わらせない — cond 偽で関数が非ゼロを返し呼び出し元の errexit がスクリプトを無出力で殺す

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #449 / Issue #448 |
| Date       | 2026-07-02           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: `set -euo pipefail` の下では、`[[ cond ]] && cmd` の失敗は「&&リストの途中」なら errexit を発火しないが、それが**関数の最終文**だと関数の戻り値が非ゼロになり、関数呼び出し（単純コマンド）として errexit が発火してスクリプト全体がバナーすら出さずに死ぬ。「デフォルト値がすでに設定済み」という正常系ほど cond が偽になるため、設定が充実した環境でだけ発症する。しかも同じイディオムはコピペで水平増殖する（本件は `apply_task_defaults` と `load_config` の 2 関数に存在）。

**Context**: PR #449 で `multi-agent.sh --dry-run` が exit 0・完全無出力なことを発見。develop 版でも再現したため自分の変更起因ではない既存バグと切り分けた。原因は `apply_task_defaults` 末尾の `[[ -z "$STRATEGY" ]] && STRATEGY=...` — config が全値を供給する（yq インストール済み + 同梱 config）環境では常に偽 → 関数が 1 を返し即死。`return 0` を追加して修正したが、Claude 系 silent-failure-hunter が同一クラスの残存を疑って走査し、`load_config` にも同パターン（`output_dir` 欠落 config で実機再現）を発見した。

**Action**:

1. `set -e` を使う bash スクリプトでは、関数末尾の `[[ cond ]] && cmd` に `return 0` を続けるか、`if` 文に書き換える。
2. この種のバグを 1 箇所直したら、**同じイディオムを同ファイル・同リポで grep して水平展開を確認**する（`&& .*$` で終わる関数末尾）。
3. ツールが「無出力で正常終了」したら、まず base ブランチで再現確認して既存バグか自変更起因かを切り分けてから直す。

---

<a id="ace-459-1"></a>

### ACE-459-1: git hook 環境から spawn するサブプロセス git は GIT\_\* を除去しないと実リポジトリを破壊する — テストフィクスチャの git init/commit が呼び出し元リポジトリを直撃した

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #459 / Issue #453 |
| Related    | ACE-449-1            |
| Date       | 2026-07-02           |
| Helpful    | 1                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: git は hook（pre-push 等）を実行するとき `GIT_DIR` 等の環境変数を設定する。hook から品質ゲート → テストランナー → テストフィクスチャの git コマンドと継承されると、フィクスチャの `git init` / `checkout -b` / `commit` が **tmpdir ではなく呼び出し元の実リポジトリを対象に実行**される。しかも途中まで成功する（ブランチ作成・コミット混入・`git init` による `core.bare=true` 書き換え）ため、失敗地点のエラーだけ見ても破壊に気付けない。特に linked worktree からの push で発火しやすい（メイン worktree の hook では GIT_DIR が設定されないことがあり、テストが「通っていた」ことは安全の証明にならない）。

**Context**: PR #459 で worktree から push した際、pre-push → quality:local → vitest → review-scripts.test.ts のフィクスチャ git が GIT*DIR を継承。実ブランチに "init" コミットが混入し、`feature/test` ブランチが作成され、メインの `.git/config` が `core.bare=true` に書き換えられた（`git rev-parse --show-toplevel` が全域で失敗する状態）。フィクスチャ env から `GIT*`プレフィックスを全除去する`sanitizedGitEnv()` で修正し、`GIT_DIR` を模擬設定した回帰テストで固定した。

**Action**:

1. テスト・スクリプトからサブプロセス git を spawn するときは、**`GIT_` プレフィックスの環境変数を全除去**した env を渡す（`GIT_CONFIG_GLOBAL=/dev/null` / `GIT_CONFIG_SYSTEM=/dev/null` の再設定もセットで）。
2. パス指定は cwd 依存にせず `git -C <対象ディレクトリ>` で固定する（hook 由来の環境でも対象がすり替わらない）。
3. リポジトリが不可解な壊れ方をしたら（`must be run in a work tree` 等）、`git config --local --list` で `core.bare` / `core.worktree` の汚染を疑う。

---

<a id="ace-460-1"></a>

### ACE-460-1: git diff の出力をパスで分類するツールは `--no-renames` を付ける — rename 表記 `{old => new}` は拡張子判定とディレクトリ前方一致の両方をすり抜ける

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #460 / Issue #454 |
| Date       | 2026-07-02           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: `git diff --numstat` はリネーム検出が有効だと `docs/{old.md => new.md}` 形式のパスを出力する。この表記は `case *.md)` のような拡張子分類にも `^scripts/` のような前方一致にもマッチしないため、パスベースの判定ロジック（レビューレベル判定、センシティブパス検知、対象ファイルフィルタ等）が**リネームを含む変更だけ静かに誤判定**する。特に「センシティブディレクトリへ跨いで移動するリファクタ」が重点レビュー判定を逃れるのは危険側の欠陥。

**Context**: PR #460 の review-level.sh 初版で発生。Toolkit pr-test-analyzer が実測（`git mv docs/old.md docs/new.md` → docs のみなのに code 扱い、`{lib => mcp/src}/util.ts` → Level 3 すり抜け）で検出した。`git diff --numstat --no-renames` に変更（rename が add+delete に分解され素のパスになる。行数は増えるが判定は安全側）し、rename 分類・跨ぎ移動の回帰テストで固定した。

**Action**:

1. `git diff` の出力パスを分類・マッチングするスクリプトでは **`--no-renames` を明示**する（判定の正確性 > 行数の見かけ）。
2. パス判定ツールのテストには「リネームを含む diff」のケースを必ず1本入れる（新規作成だけのフィクスチャでは rename 表記経路を通らない）。

---

<a id="ace-462-1"></a>

### ACE-462-1: 安全ゲートをスキップするか判定するループでは、空文字・想定外入力を「危険側」ではなく「安全側（ゲート実行）」に倒す — `case $x in *[!0]*)` は空文字を「全ゼロ」と同一視する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #462 / Issue #461 |
| Related    | ACE-449-1            |
| Date       | 2026-07-02           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 入力を分類して「安全ゲート（品質チェック等）をスキップするか」を決めるコードは、**想定外・欠落入力を必ずゲート実行側（fail-closed）に倒す**べき。特にシェルの `case "$x" in *[!0]*) ...` は「非ゼロ文字を含むか」の判定だが、**空文字列は `*[!0]*` にマッチしない**ため「全ゼロ（＝この文脈では削除＝スキップ）」と同一視され、フィールド欠落・空行がゲート回避（fail-open）を引き起こす。「肯定条件（削除だからスキップ）」だけを書くと、パターンに当てはまらない全入力が暗黙にスキップ側へ流れる。

**Context**: PR #462 で pre-push が「ブランチ削除のみの push（local sha 全ゼロ）は品質ゲートをスキップ」する実装に、Toolkit silent-failure-hunter が「空 `local_sha`（stdin のフィールド欠落・空行）が `*[!0]*` に非マッチ → deletions_only=true のままスキップ」という fail-open を検出（実測再現）。git 標準入力では発火しないが、`"") deletions_only=false` の1行追加で fail-closed に矯正し、フィールド欠落 stdin でゲート実行を検証するテストを追加した。

**Action**:

1. 安全ゲートのスキップ判定は「スキップしてよい条件」を厳密列挙し、それ以外（空・想定外・パース失敗）は**すべてゲート実行側**へ倒す（明示的な `"") ...` / `*) ...` 分岐を書く）。
2. `case ... *[!0]*` のような「否定文字クラス」は空文字を意図せず通すので、空文字ケースを別途明示する。
3. テストは正常系だけでなく「欠落・空・不正フィールド」の入力でゲートが**実行される**ことを1本以上固定する。

<a id="ace-484-3"></a>

### ACE-484-3: フォーマッタを caret 範囲で許すと push ゲートが環境依存で赤くなる — 「触っていないファイルが落ちる」で切り分けが溶ける

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #484 / Issue #485 |
| Date       | 2026-08-28           |
| Helpful    | 2                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 整形結果がバージョンで変わるツール（prettier 等）を `^` 範囲で許し、かつ pre-push でフル品質ゲートを強制していると、パッチ版が上がっただけで**自分が触っていないファイルが赤くなり全員の push が止まる**。症状が「自分の差分と無関係」に見えるため、原因をコードや自分の変更に求めて時間を溶かす。`npm ci` で環境を揃えられれば復旧できるが、lockfile と package.json が同期していないとその逃げ道も塞がる。

**Context**: PR #484 の作業中、`npm run quality:local` が未変更 3 ファイル（`COPILOT_AGENTS.md` / `best-practices/01-coding-standards.md` / `FAQ.md`）で失敗した。`git stash` して develop 状態でも同じ 3 件が落ちるため既存の破綻と判明。実体はローカル `node_modules` の prettier が 3.9.6、lockfile は 3.8.3 で、union 型の折り返しと表整形の結果が版間で異なっていた（3.9.6 は 1 行へ結合、3.8.3 は分割を維持）。復旧のため `npm ci` を試みたが `@emnapi/*` の同期崩れで失敗し、`npm install --no-save prettier@3.8.3` で lockfile 準拠に戻して全項目グリーンになった。3.9.6 の整形結果でコミットしていれば、次に 3.8.3 の環境が触ったとき差分が反転する。

**Action**: 整形系の devDependency は**厳密固定**（`^` を外す）し、`npm ci` が通る状態（package.json と package-lock.json の同期）を維持する。ゲートの前提を「`npm ci` で環境を揃えてから `npm run quality:local`」と手順書に明記する。切り分け手順としては、未変更ファイルがゲートで落ちたら (1) `git stash` して既定ブランチ状態で再実行し既存破綻か切り分ける、(2) `npx <tool> --version` と lockfile の版を突き合わせる、の順に確認する。整形差分を「とりあえず直す」前に版を疑うこと。

<a id="ace-502-1"></a>

### ACE-502-1: 実行環境の下限（engines）を上げたら、その環境を表す型定義パッケージのメジャーも同じ PR で揃える — engines は実行時にしか効かず、tsc は型定義の版までしか API を知らない

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | tooling | Origin | PR #502 / Issue #501 |
| Date | 2026-09-06 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

`engines.node` を引き上げても `@types/node` のような環境の型定義パッケージが旧メジャーのままだと、宣言上は使ってよい新 API を書いた途端に `tsc` が型不明で落ち、「engines は満たしているのにビルドできない」という切り分けにくい不整合になる。`engines` を変える PR では、その環境を型として表す devDependency（`@types/node`、ランタイム SDK の型パッケージ等）の対応メジャーを同じ PR で揃え、lockfile を同期し、更新後パッケージと推移依存の `engines` を自分の宣言と再照合する（[ACE-498-1](#ace-498-1) の逆向き適用）。別 PR に分けると、その間に書かれたコードが偽の型エラーで手戻りする。

---

<a id="ace-534-1"></a>

### ACE-534-1: ゲート記録器はレビューシムの版一致検査で解決せず、record-gate-head.sh の実在だけを見る

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | tooling | Origin | PR #534 / Issue #515 |
| Date | 2026-09-14 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

`--print-toolkit-root` は配置済みシムと toolkit テンプレートのバイト一致を要求する。同じ 0.108.0 でもホストの cache 実体が違うと identity が rc=2 になり、record-gate-head.sh はあるのに記録がスキップされる。ゲート補助スクリプトは cache glob / sidecar で実ファイルを探し、失敗理由を「cache が無い」に決め打ちしない。

---

<a id="ace-536-2"></a>

### ACE-536-2: 件数導出のヘッダ行数は HTML コメントをマスクしてから最初の実見出しを探す

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | tooling | Origin | PR #536 / Issue #487 |
| Date | 2026-09-14 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

`analyzePlaybookMarkdown` は HTML コメントを除くが、ヘッダ行数を生本文の最初の `### ACE-<数字>` で切ると追記例が終端になる。導出上限が過小になり密度警告が偽陽性になる。コメントを同長スペースでマスクしてから実見出し位置を取り、原文の行数を数える。

---

<a id="ace-539-2"></a>

### ACE-539-2: git と node を複数回 spawn する vitest は既定 5s を超えうる — SKIP_QUALITY_GATE せず it の timeout を明示する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| Category | tooling | Origin | PR #539 / Issue #507 |
| Date | 2026-09-14 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

pre-push の `quality:local` で symlink CLI テストが 5.1〜6.4s になり vitest 既定 5s で落ち、レビュー修正の push が止まった。単体再実行は 1.6s で通るため「テストが壊れた」と誤診しやすい。プロセス spawn が複数ある `it` には `{ timeout: 15_000 }` を付け、ゲート自体は通す。

---
