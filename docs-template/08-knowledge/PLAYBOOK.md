---
title: "PLAYBOOK"
version: "1.79.0"
status: "approved"
created: "2026-03-10"
updated: "2026-10-22"
owner: "@fffokazaki"
changeImpact: "medium"
ace_entry_count: 82
tags: [ace, playbook, knowledge-management]
references:
  - https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs/ACE_FRAMEWORK.md
  - https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/05-operations/deployment/ace-cycle.md
---

# ACE Playbook

> **Parent**: [BEST_PRACTICES.md](./BEST_PRACTICES.md) | **関連**: [ACE サイクル運用手順](../05-operations/deployment/ace-cycle.md) | [ACE フレームワーク概念](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs/ACE_FRAMEWORK.md)

## 概要

### 目的

ACE (Agentic Context Engineering) Playbook は、開発プロセスで得た知見を **AIツールが直接参照できる構造化形式** で蓄積するファイルです。

GitHub Discussions が「人間が読むためのナラティブ（物語的記録）」であるのに対し、Playbook は「AIが参照するための構造化知見（delta方式: 差分のみを末尾追記する更新方式）」として機能します。

### 運用ルール

| ルール                             | 説明                                                                                                                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **末尾追記のみ**                   | エントリは常にファイル末尾に追記。既存エントリの本文（新形式の散文 / 旧形式の Insight/Context/Action）書き換えは禁止（唯一の例外は次行の「事実訂正の例外」）。カウンター更新・Status変更は許可                                                                |
| **事実訂正の例外**                 | 1 次情報で誤りを示せる事実主張（PR / Issue 番号・コミットハッシュ・数値）の訂正に限る限定例外。条件の正本は [ACE_SETUP.md §4](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs/ACE_SETUP.md#ace-ops-template)（ここに条件を複製しない） |
| **カウンターはインクリメントのみ** | Helpful/Harmful は +1 のみ。減算・リセットはしない                                                                                                                                                                                                            |
| **削除禁止**                       | エントリを物理的に削除しない。不要な場合は `Status: deprecated` に変更                                                                                                                                                                                        |
| **密度超過時は正準化 → refine**    | 行数上限は件数から導出する（詳細は [行数・件数の方針](#行数件数の方針)）                                                                                                                                                                                      |
| **Frontmatter更新**                | エントリ追加時に `version`, `updated`, `ace_entry_count` を更新                                                                                                                                                                                               |
| **コミット規則**                   | `knowledge: ACE-XXX [category] [summary]` 形式で記録                                                                                                                                                                                                          |

### エントリID規則

ACE エントリ ID は **PRスコープ式** を採用する（このセクションが ID 規則の SSOT）。複数人・複数AIが並行で `/ace-curate` を回しても番号が衝突しないための構造である。

- **形式**: `ACE-<PR番号>-<連番>`（例: `ACE-438-1`, `ACE-438-2`）
- **非PR由来の fallback**: `ACE-i<Issue番号>-<連番>`（例: `ACE-i425-1`）
- **採番**: 同一 PR の既存 `ACE-<PR番号>-*` の最大連番 +1 を連番とする（既存が無ければ連番 `1`、すなわち最初のエントリは `ACE-<PR番号>-1`）。**全体の最新 ID を読む必要がない**ため並行採番でも衝突しない（PR 番号は GitHub が全体一意に採番するため、別 PR = 別 namespace）。
- **連番の範囲**: 1 回の `/ace-curate` で同一 PR から 1〜3 件追記する想定。同一 PR を再 curate する場合は既存の最大連番から継続。
- **既存 ID の扱い**: 旧 `ACE-{連番3桁}` 形式（`ACE-001`〜）のエントリは **改名しない**。旧 3 桁形式と新 PRスコープ式は恒久的に共存する（参照・anchor 互換の維持）。ID にファイル位置の情報は持たせない（現行は単一ファイル。将来分割しても ID はそのまま使える）。

---

## カテゴリ一覧

`/ace-curate` が分類に使う正本。`ace-cycle.md` などへ写さない（写すと再乖離する）。

| カテゴリ                | 説明                                               | 例                                |
| ----------------------- | -------------------------------------------------- | --------------------------------- |
| `coding`                | コーディングパターン、言語固有のベストプラクティス | 型安全性、エラーハンドリング      |
| `architecture`          | 設計判断、構造上の決定事項                         | レイヤー設計、モジュール分割      |
| `testing`               | テスト戦略、テストパターン                         | モック設計、テストデータ管理      |
| `security`              | セキュリティ対策、脆弱性防止                       | 認証、暗号化、入力検証            |
| `performance`           | パフォーマンス最適化                               | キャッシュ、クエリ最適化          |
| `devops`                | CI/CD、デプロイ、環境構築                          | パイプライン、インフラ設定        |
| `process`               | 開発プロセス、ワークフロー改善                     | レビュー手法、タスク管理          |
| `tooling`               | ツール設定、開発環境                               | IDE設定、リンター、フォーマッター |
| `documentation-quality` | ドキュメントの品質・整合性・記法統一               | anchor 整合、表記揺れ、リンク切れ |
| `knowledge-management`  | 知見・Playbook 自体の運用・構造化                  | ACE 運用ルール、索引設計          |
| `documentation`         | ドキュメント作成・構成（品質観点を除く）           | 文書構成、README 整備             |

`coding` と `performance` はコード変更の知見が入る抽出枠として残す。件数は `ace:check-playbook-categories` の出力を正とする。toolkit 側の `domain` / `estimation` は本リポでは未使用のため一覧に載せない。

---

## ステータス定義

| ステータス   | 説明                                   | 遷移条件                                                |
| ------------ | -------------------------------------- | ------------------------------------------------------- |
| `active`     | 有効な知見                             | 新規作成時のデフォルト                                  |
| `deprecated` | 非推奨（古い情報、矛盾が発見された等） | Harmful >= 3 かつ Helpful < Harmful、または明示的な判断 |

---

## エントリテンプレート

新しいエントリは、以下の**コンパクト正準フォーマット**で追記してください：

```markdown
<a id="ace-XXX"></a>

### ACE-XXX: [検索可能な主張 1 文のタイトル]

| Category | [カテゴリ] | Origin | PR #XXX / Issue #YYY |
| Date | YYYY-MM-DD |
| Helpful | 0 | Harmful | 0 |
| Status | active |

[本文 2〜4 文。1 文目 = 知見の本質（何を学んだか）。非自明な適用条件（どんな状況で使うか）が 1 文。推奨アクションで締める。手順の列挙・叙述は書かない — 主張が明確なら詳細は読み手（AI）が再導出できる]

---
```

- **メタ 4 行は各行の行頭に置く**: `Category` / `Date` / `Helpful` / `Status` を行頭のパイプ区切りで書くことが、フィールドを読む集計スクリプトのパース互換条件。1 行に畳んだ `H:n | #PR` のような形式は集計から漏れる
- **GitHub 上でテーブル描画されない**: ヘッダ行・区切り行を持たないため、パイプ行はプレーンテキストとして表示される。Playbook は AI が参照するための構造化文書であり、これは意図した仕様
- **旧形式との共存**: 旧テーブル形式（`| フィールド | 値 |` ヘッダ + **Insight**/**Context**/**Action** ブロック）のエントリは読み取り互換として共存させる。新規追記には使わない
- **形式ゲート**: ff-dev-toolkit の `/ace-curate` 手順 4-f が実行する `check-entry-format.ts` が、PLAYBOOK.md と同階層の `legacy-format-allowlist.txt` に無い旧形式エントリを見つけると exit 1 でブロックする（allowlist 不在なら strict）。ローカルの ACE コマンドは置かず、ゲートを持つ ff-dev-toolkit の `/ace-curate` で追記する。**新規追記のために allowlist へ ID を足さない**

### 記述ガイドライン

- **anchor**: 各エントリは見出し直前に `<a id="ace-XXX"></a>` を 1 行付与する。`XXX` は **エントリ ID を小文字化したもの**（新規は `ace-438-1` / `ace-i425-1`、旧エントリは `ace-001`。anchor 部分は常に小文字英数字＋ハイフン）。ファイルレベル参照（`PLAYBOOK.md` 単体）は常にファイル先頭に着地するため、anchor がなければ個別エントリへの誘導が成立しない。anchor 付与により他ドキュメントから `[ACE-438-1](path/to/PLAYBOOK.md#ace-438-1)` 形式で**特定エントリに直接ジャンプ可能**になる。
- **参照リンク形式**: 他ドキュメントから ACE エントリを参照する場合は `[ACE-XXX](path/to/PLAYBOOK.md#ace-XXX)` 形式に統一する（`XXX` はエントリ ID の接頭辞 `ACE-` / `ace-` を除いた部分。新規は `438-1`、旧は 3 桁 `040`。label は `ACE-438-1`、anchor は `#ace-438-1`）。`[PLAYBOOK ACE-XXX]` / `[PLAYBOOK.md ACE-XXX]` 等の異なる label は使わない（[ACE-040](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/08-knowledge/playbook/archive/process.md#ace-040) 語彙統一 / [ACE-024](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/08-knowledge/playbook/archive/documentation-quality.md#ace-024) 用語衝突防止 の系。Origin: Issue [#425](https://github.com/feel-flow/ai-spec-driven-development/issues/425)）。参照先は、active エントリなら `PLAYBOOK.md#ace-xxx`、アーカイブ済みエントリなら `playbook/archive/<category>.md#ace-xxx` とする（配布される文書（docs-template/ 配下・.claude/commands/）から archive を指すときは、`/ace-setup` が archive を配置しないため `blob/HEAD` の絶対 URL にする）。どちらか迷うときは `playbook/archive/` を ID で grep して所在を確かめる。
- **本文の構成**: 1 文目 =「何を学んだか」（知見の本質）。2 文目 =「どんな状況で使うか」（非自明な適用条件。再現条件が明確であるほど価値が高い）。最後に「次回何をすべきか」（推奨アクション）。

---

## Helpful / Harmful カウンター運用

### カウンター更新タイミング

| タイミング                                     | 更新内容            |
| ---------------------------------------------- | ------------------- |
| ACE サイクルで既存エントリと重複する知見を発見 | Helpful +1          |
| 既存エントリの知見に従って問題を回避できた     | Helpful +1          |
| 既存エントリの知見に従ったが問題が発生した     | Harmful +1          |
| 既存エントリの内容が古くなっていると判明       | 検討の上 deprecated |

### エントリ品質の目安

| カウンター状態                           | 解釈                                       |
| ---------------------------------------- | ------------------------------------------ |
| `Helpful >= 5`                           | 高品質エントリ。PATTERNS.md への昇格を検討 |
| `Helpful >= 3, Harmful == 0`             | 良質なエントリ                             |
| `Harmful >= 3, Helpful < Harmful`        | deprecated 候補                            |
| `Helpful == 0, Harmful == 0`（90日以上） | 有効性未検証。次回関連タスクで意識的に検証 |

---

## 行数・件数の方針

行数上限の**式**は ff-dev-toolkit と同じ件数導出（`ヘッダ + 件数 × 16`）。件数のブロック上限は本リポ既定 280（toolkit の値とは独立。Issue #487）。固定 800 行での `playbook/` 分割は行わない。

- 行数上限 = `ヘッダ行数 + 件数 × 16`（15 行バジェット + ブロック間の空行 1）。ヘッダは最初の実エントリ見出しより前の原文行数（HTML コメント内の偽見出しは無視）
- 超過は「ファイルが大きい」ではなく「**1 エントリが太い**」。第一対応は旧テーブル形式の正準化、次に `/ace-refine`
- 件数ゲートは二段: refine 目安 130 件/カテゴリ（警告・exit 0） / ブロック上限 280 件/カテゴリ（exit 1）
- `ACE_MAX_PLAYBOOK_LINES` に正の整数を明示したときだけ固定行数上限。未設定・無効値は導出に倒す
- 本リポジトリの PLAYBOOK.md は単一ファイルのままにする。`playbook/` 分割は同一カテゴリ内で検索語彙が明確に分岐したときだけ検討する（ファイルだけ分けても Category 値は合算されるため件数ゲートは解除されない）
- **Changelog の保持範囲**: 総行数は Changelog を含めて数えるため、PLAYBOOK.md の `## Changelog` には直近の `/ace-refine` の版以降だけを残す（最新版は frontmatter 同期、直近の整理ブロックは refine 不変条件の検査対象なので残す）。`/ace-refine` を適用するたびに、直近の整理ブロックより前の版を `PLAYBOOK-CHANGELOG.md` の `## Changelog（旧版）` 見出しの直後へ逐語で移す

検証: `npm run ace:check-playbook-categories`（このリポ）。配布先では `npx --yes tsx scripts/ace/check-category-size.ts path/to/PLAYBOOK.md`

---

## エントリ一覧

<!-- ここから下にエントリを追記してください。最新のエントリが末尾になるように追記します。 -->
<!-- 追記例:
<a id="ace-XXX"></a>

### ACE-XXX: [検索可能な主張 1 文のタイトル]

| Category | [カテゴリ] | Origin | PR #XXX |
| Date | YYYY-MM-DD |
| Helpful | 0 | Harmful | 0 |
| Status | active |

[本文 2〜4 文。1 文目 = 知見の本質。適用条件 1 文。推奨アクションで締める]

---
-->

<a id="ace-001"></a>

### ACE-001: クロスモデルレビューは単一AIモデルでは検出できない問題を発見する

| Category | process | Origin | PR #316 / PR #319 |
| Date | 2026-03-10 |
| Helpful | 12 | Harmful | 0 |
| Status | active |

異なる系列の AI モデルは異なるカテゴリの問題を検出し、単一モデルのレビューでは見落とす欠陥がクロスモデルレビューで見つかる（PR #316 では Claude・Codex・Gemini・CodeRabbit がそれぞれ別の誤りを、PR #319 では Codex が誤検出バグを、Claude 系が stderr の握りつぶし・偽成功を検出した）。ドキュメントでもスクリプトでも、PR を作る前のセルフレビューに当てはまる。Claude 系のレビュー（`pr-review-toolkit`）と別系列のクロスモデルレビュー（Codex 等）を両方実行し、Bot のレビューがあればその指摘も確認する。

---

<a id="ace-002"></a>

### ACE-002: CLIフラグは実機の --help 出力と照合が必須

| Category | tooling | Origin | PR #316 / Issue #315 |
| Date | 2026-03-10 |
| Helpful | 2 | Harmful | 0 |
| Status | active |

CLI フラグは Web 検索や AI 生成の情報では正確性が保証されず、実機でしか分からない差異が多い（`codex -p` は存在せず `codex exec` が正しい、Copilot の `-s` は sandbox ではなく `--silent` など）。複数の CLI の使い方を文書化するときに起きやすい。フラグを書くときは `command --help` の実機出力と公式の README / docs で照合し、可能なら `--dry-run` 等で動作も確かめる。

---

<a id="ace-004"></a>

### ACE-004: ドキュメントの動作説明は実装メカニズムと一致させる

| Category | process | Origin | PR #350 |
| Date | 2026-03-18 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

ドキュメントの「自動」「手動」「並列」「順次」といった動作表現が実装メカニズムと食い違うと、人も AI も誤った前提で動き、トラブルシューティングで混乱する。「こうなるべき」を「こうなっている」として書いたときに起きる（PR #350 では、AI が CLAUDE.md の指示で順次実行する仕組みを「自動実行」と書き、未定義の npm script も記載していた）。動作説明を書くときは実装コード・設定で実際の動作を確かめ、記載するコマンドは `package.json` の scripts や `--help` で実在を検証する。

---

<a id="ace-012"></a>

### ACE-012: PR マージ・push 前は必ず `git status` でブランチを確認する（develop 直 push 事故防止）

| Category | process | Origin | PR #391 / PR #393 / Issue #295 |
| Date | 2026-05-06 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

バックグラウンドでブランチが切り替わる事象は外部プロセス（他作業者の `gh pr merge`、IDE 拡張、自動化フック等）で発生しうるため、自分のターン内で `git checkout` していないことは、現在のブランチが想定通りである保証にならない（Issue #295 では PR #391 の突然のマージで HEAD が develop に切り替わり、気づかず push したレビュー対応コミットが develop に直接乗って revert + 新 PR #393 が必要になった）。Git 操作の前後で状態を確かめるべき場面は、`git push` の直前、PR のマージ・ready 操作の前、Issue 着手時（同 Issue の他ブランチや未追跡ファイルによる重複作業の防止）である。`git push` 直前に `git branch --show-current` で想定ブランチを確認し、PR 操作前は `gh pr view` で他者によるマージ・close と PR head の一致（`--json headRefOid`）を確かめ、Issue 着手時は `git branch | grep -w <issue-number>` と `git status -uall` を実行する。develop / main に直 push した場合は `git reset --hard` + force push を避け、`git revert <SHA>` で打ち消し、同内容を新ブランチへ cherry-pick して正規 PR で再投入する。

---

<a id="ace-014"></a>

### ACE-014: 索引文書は SSOT を子に集約し、自身は誘導と 1 行サマリのみ — 数値の重複は持たない

| Category | architecture | Origin | PR #391 / PR #393 / Issue #295 |
| Related | ACE-005（補強） |
| Date | 2026-05-06 |
| Helpful | 4 | Harmful | 0 |
| Status | active |

索引と子文書に分ける構成で、索引側に「概要だから」と数値表を写すと、子の値を変えたときに索引が同期漏れし、SSOT の宣言も二重・三重になる（PR #391 で索引に子と同じ閾値表を併記し、PR #393 で集約した）。索引には子へのリンクと「500 / 800 / 1200 行の三段階」のようなキーワード 1 行のサマリだけを置き、数値・手順の正本は子に一本化する。索引の冒頭に「どの値の正本はどの子か」を宣言し、運用ルールに「子の内容をコピーしない」と書き、子の値を変えたら旧値を grep して散らばりを確かめる。

---

<a id="ace-016"></a>

### ACE-016: Markdown の anchor link は label と URL の両方にフラグメントを書く — `\[text#anchor\]\(url\)` 形式は無効

| Category | documentation-quality | Origin | PR #395 / Issue #296 |
| Related | ACE-013（補強） |
| Date | 2026-05-06 |
| Helpful | 4 | Harmful | 0 |
| Status | active |

Markdown の anchor はラベル側ではなく URL 側の `#section` だけが機能するため、ラベルにだけ anchor を書いたリンクはファイル先頭にしか飛ばず、markdownlint / prettier も検出しない。ラベルに `#section` が見えていると「anchor 設定済み」と錯覚しやすい。anchor を含む別文書へのリンクを書いたら URL 側に `#anchor` があるかを確かめ（GitHub の slug は英字を小文字化・記号を除去・空白を `-`・Unicode は保持）、複数の AI レビュアーが独立に同じ箇所を指摘したら true positive として即修正する。

---

<a id="ace-018"></a>

### ACE-018: 横断的な番号・順序変更は着手前に grep で全 SSOT を列挙する

| Category | documentation-quality | Origin | PR #397 / Issue #396 |
| Related | ACE-014 / ACE-015 |
| Date | 2026-05-06 |
| Helpful | 7 | Harmful | 0 |
| Status | active |

番号・順序の横断変更は、想定の 2〜3 倍のファイルに散らばっている（PR #397 では想定 6 ファイルが実際は 10 ファイル）。番号への直接参照・順序の散文・状態の説明（「マージ前」等）・メタデータ・段階数への言及は、意味が等価でも字面が違うため、1 種類の grep キーワードでは拾いきれない。着手前に意味的に等価な複数の grep パターンで対象を全部列挙して作業リストに登録し、ナビゲーション表・対応表も対象に含め、「旧表現の grep ヒットなし」を受け入れ条件に書く（経緯として意図的に旧表現を残す注記は除外する）。

---

<a id="ace-019"></a>

### ACE-019: 既存ルール違反になる新パターンは「例外」として明示的に名乗らせる

| Category | process | Origin | PR #397 / Issue #396 |
| Related | ACE-012（修正対象） |
| Date | 2026-05-06 |
| Helpful | 3 | Harmful | 0 |
| Status | active |

既存ルールに違反する新パターンを導入するとき、該当箇所に「これは X の例外」と明示しないと暗黙の方針分裂が生じ、後続の AI やレビュアーが違反として扱う（PR #397 では develop への直 commit を許すパターンが ACE-012 と衝突し、Critical 指摘を受けた）。新しい運用・規約を入れる前に「禁止」「MUST NOT」等の対立ルールを grep で列挙し、例外として明示するか、旧ルールを deprecated にするか、新パターンを撤回するかを選ぶ。例外は「宣言・許す条件・適用しないケース」の 3 点をそろえ、複数箇所に書くなら同じ文言にする。

---

<a id="ace-020"></a>

### ACE-020: 自動コンテンツ生成ツールは自身のマーカー文字列を本文に含むドキュメントを破壊する

| Category | tooling | Origin | PR #403 / Issue #402 |
| Date | 2026-05-07 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

見出しなどのマーカーを目印にファイルを書き換える自動生成ツールは、そのマーカー文字列を説明として本文に含む文書を破壊し、結果は valid な Markdown のままなので型検査やテストでは検出できない（`## Linked from` を本文で説明していた OBSIDIAN_GUIDE.md が 379 行から 26 行に切断され、約 3 ヶ月気付かれなかった）。backlinks・TOC・changelog などの自動更新ツールを設計・導入するときに当てはまる。マーカーは HTML コメントの begin/end ペアのように本文に出にくい形にして揃わないファイルはスキップし、マーカーを含む golden file のテストと dry-run を通してから hook に組み込む。

---

<a id="ace-021"></a>

### ACE-021: テンプレ配布リポでは「リポ自身が使うインフラ」と「テンプレ利用者が受け取る成果物」を物理的に分離する

| Category | architecture | Origin | PR #403 / Issue #402 |
| Related | ACE-005 |
| Date | 2026-05-07 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

自分自身も動くプロジェクトで、かつ他者がコピーするテンプレートでもあるリポジトリでは、配布ディレクトリにリポ自身の運用インフラを置くと利用者にノイズとトークン消費が伝播し、`.gitignore` や条件分岐では防げない（Obsidian 統合を `docs-template/` に置いたことが、PR #403 での全撤退の構造的な理由になった）。ディレクトリごとに「利用者がコピーするか」を配布境界マップで明示し、特定ツールに依存するインフラは配布ディレクトリの外に置き、配布物の Markdown に自動生成セクションを書き込まない。導入 PR の段階で撤退コスト（PR #403 では 13 ファイル削除 + 8 ファイル編集、+7/-1859 行）を試算する。

---

<a id="ace-022"></a>

### ACE-022: 機能削除時は consumer だけでなく定数・型・ユーティリティも grep して取り残しを防ぐ

| Category | process | Origin | PR #403 / Issue #402 |
| Related | ACE-018 |
| Date | 2026-05-07 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

機能削除で本体ディレクトリと呼び出し元を消すとビルドもチェックも通るが、`tsc` は未使用 export を警告しないため、その機能専用の定数・型・ユーティリティが他モジュールに孤立して残る（PR #403 では機能名の grep がゼロでも、専用の定数が dead code として残った）。削除 PR では機能名だけでなく専用の識別子すべてで grep し、本体・設定・定数・型・関数・テスト・ドキュメントの各分類で取り残しを確かめる。可能なら `knip` 等の未使用 export 検出を品質ゲートに入れ、機能専用の定数は機能ディレクトリの配下に閉じ込める。

---

<a id="ace-023"></a>

### ACE-023: ドキュメント中の事実主張（PR/Issue 番号・ハッシュ・数値）は執筆時に 1 次情報で照合する

| Category | documentation-quality | Origin | PR #405 / Issue #404 |
| Related | ACE-002 / ACE-018 |
| Date | 2026-05-07 |
| Helpful | 2 | Harmful | 0 |
| Status | active |

文書に書く PR / Issue 番号・コミットハッシュ・数値は、記憶や類推で書くと高確率で誤り、`#N` は Issue と PR の両方に使われるため特に混同しやすい（PR #405 では実在しない「PR #311」と、撤退コストの誤った数値を書いた）。CLI フラグを実機で照合する ACE-002 を、事実主張全般に広げた知見である。執筆中に `gh pr view` / `gh issue view` で番号の実在と種別を、`git log --first-parent` でコミットの経路を、`gh pr view --json additions,deletions,changedFiles` で数値を照合する。

---

<a id="ace-025"></a>

### ACE-025: スクリプトの「対象範囲」を文書化するときは glob 表現ではなく実装上の対象列挙方式まで踏み込む

| Category | documentation-quality | Origin | PR #411 / Issue #410 |
| Related | ACE-023 / ACE-043 |
| Date | 2026-05-19 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

スクリプトの対象範囲を `docs-template/**/*.md` のような glob で説明すると、実装が固定リスト（PR #411 では `CORE_DOCS` 配列の 7 ファイル）だった場合に嘘になり、読者は「文書を追加すれば CI で守られる」と誤期待する。対象範囲を文書化する前にスクリプト本体を読み、glob 走査・固定リスト・条件フィルタのどれかを確かめる。方式名を含めて 1 行で書き（「固定 7 ファイル（CORE_DOCS 配列で列挙）」など）、CI の対象と対象外を同じ表に並べ、除外ルールと拡張手順も明記する。

---

<a id="ace-029"></a>

### ACE-029: 外部ツール依存物（shell script の依存コマンド、shebang、インストーラオプション）を文書化するときは実体を読んで列挙する

| Category | documentation-quality | Origin | PR #414 / Issue #413 |
| Related | ACE-025 |
| Date | 2026-05-19 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

shell スクリプトや hook の実行要件は shebang だけでは判断できず、本体が使う `grep` / `xargs` 等のコマンドまで要件になる（PR #414 では `#!/bin/sh` の hook を「sh.exe があれば動く」と書いたが、実際は coreutils も必要だった）。インストーラ経由の PATH の扱いもオプション次第で変わるため、一般論では断定できない。実行要件を書く前に本体を grep して依存コマンドを、`head -1` で shebang を列挙し、インストーラはオプション名を引用して手動で PATH に追加する経路も併記し、実機で確かめていない主張は未検証と明記する。

---

<a id="ace-034"></a>

### ACE-034: 実装中は implementation-notes.md を作業ブランチに並走させて spec 乖離・トレードオフ・判断理由を捕捉する

| Category | process | Origin | 外部知見（Anthropic エンジニア公開実装プロンプト） |
| Related | ACE-009 / ACE-023 / ACE-032 |
| Date | 2026-05-19 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

コミット diff とレビューコメントには「why / 捨てた選択肢 / spec との差分」が残らず、ACE Phase 1 Generate の raw material の品質に上限が生じるため、in-flight でしか書けない判断ログを作業ブランチの `implementation-notes.md` に並走させて残す（ACE-032 のように、気付いた瞬間に書いておけば反映漏れがなかったケースが頻発していた）。実装着手から PR 作成までの間、spec にない判断・spec から変えた点・採った/捨てた選択肢とトレードオフ・未決事項の 4 見出しで、コミットと一緒に 1〜3 行ずつ逐次追記する。PR 作成時に中身を PR description へ転記し、squash merge 後にルート直下へ前 PR のファイルが残って次ブランチと衝突しないよう、マージ前に `git rm` で削除する（長期保存するなら `notes/<issue-num>.md` の per-PR 化も可）。Generate の入力はファイル本体ではなく転記済みの PR description（`gh pr view --json body`）とし、スコープ外発見は引き続き Issue 化して、notes は現 PR の判断ログという役割に留める。

---

<a id="ace-035"></a>

### ACE-035: 新規 process パターンを Playbook に追加するときは「ドッグフード + advisor / second opinion」で運用上の構造問題を検出する

| Category | process | Origin | PR #420 |
| Related | ACE-021 / ACE-034 |
| Date | 2026-05-19 |
| Helpful | 2 | Harmful | 0 |
| Status | active |

マージ後の振る舞いを伴うような新しい process パターンは、机上の判断だけだと自リポの merge 戦略（squash 等）と矛盾する構造問題を見落とす（PR #420 では「作業ノートを PR に同梱して残す」推奨が squash merge の運用では次のブランチで衝突することを、advisor が指摘した）。Playbook に process パターンを追加する PR に当てはまる。PR 自身でそのパターンを 1 回実行（ドッグフード）し、初稿が品質ゲートを通った後・commit 前に、advisor / second opinion へ「この推奨を本リポで運用したら何が起きるか」を確認させる。

---

<a id="ace-042"></a>

### ACE-042: テンプレファイル内の同一概念 placeholder は同一シンボル + 大文字で統一する — `XXX`/`NNN`/`xxx` 混在は AI/人のコピペ後置換漏れによる silent rot を誘発する

| Category | documentation | Origin | PR #428 / Issue #425 |
| Related | ACE-014 / ACE-024 / ACE-040 |
| Date | 2026-05-20 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

テンプレート内の同一概念の placeholder を `XXX` / `xxx` / `NNN` のように書き分けると、コピー後に片方だけ置換し忘れ、`ace-xxx` のように本物と見分けにくい壊れた anchor が残る。同一概念は 1 文書内で 1 つのシンボルにそろえ、「明らかに置換せよ」と読める大文字の連続（`XXX` 等）にする。置換ルールは placeholder の直近に動詞形で書き（「`XXX` は 3 桁数字に置換」）、複数文書に同じ規則を書くなら 1 箇所を正本にして他はポインタにする。

---

<a id="ace-044"></a>

### ACE-044: review 指摘を取り込むスコープは「編集セクション境界」で判定する — 触ったセクション内の隣接 stale は同 PR、別ファイル / 別セクションは別 issue

| Category | process | Origin | PR #429 / Issue #417 |
| Related | ACE-032 / ACE-037 / ACE-043 |
| Date | 2026-05-20 |
| Helpful | 2 | Harmful | 0 |
| Status | active |

レビューが差分外の既存の古い記述を指摘したとき、同 PR で直すかどうかは「触ったファイルか」だけでは粗く、「触ったセクション（見出し配下）か」を判定軸に加えると自然な差分になる。同じセクションの隣接行を放置すると「半端な最新化」と読まれる（PR #429 では隣接行を編集した節の既存の誤記を同 PR で直し、触っていないファイルは別 Issue にした）。触ったセクション内なら同 PR で整合させ、同じファイルの別セクションは影響範囲で判断し、触っていないファイルは別 Issue にして、同 PR で直した既存の不整合はコミットに来歴を残す。

---

<a id="ace-045"></a>

### ACE-045: 設計文書内の「mirror 付録（実体の参照用コピー）」は本体改稿で silent drift する — mirror を持つなら本体改稿で同期、または mirror を削って外部参照に置換

| Category | documentation-quality | Origin | PR #431 / Issue #430 |
| Related | ACE-014 / ACE-043 / ACE-044 |
| Date | 2026-05-20 |
| Helpful | 3 | Harmful | 0 |
| Status | active |

設計文書の付録に実体ファイルの参照用コピー（mirror）を載せると、実体を改稿した瞬間に黙って食い違い、format / lint は内容の一致を検査しないので「反映済み」の注記が嘘のまま残る（PR #431 で PR テンプレートを簡略化した際に検出された）。設計文書には mirror を作らず、実体への参照か commit SHA の永続リンクを置く。mirror を持つと決めたら本体を改稿する PR で同時に同期し（触っていないファイルでも同 PR で直す例外）、mirror には「自動同期されない・一次情報はどこか」を明記し、「参照用コピー」等の定型句で grep できるようにしておく。

---

<a id="ace-046"></a>

### ACE-046: PR/Issue body 内の相対リンクは `pull/N/` または `issues/N/` 起点で展開される — リポローカルテンプレでは `blob/HEAD/` 絶対 URL を使い、配布版は plain text にする

| Category | documentation-quality | Origin | PR #437 / Issue #433-#436 |
| Related | ACE-016（anchor URL 欠落）/ ACE-044 carve-out |
| Date | 2026-05-20 |
| Helpful | 2 | Harmful | 0 |
| Status | active |

GitHub の PR / Issue 本文はファイル単体の閲覧と異なる base URL で描画されるため、テンプレート内の相対リンク（`../docs/X.md` も `docs-template/X.md` も）は本文に展開すると 404 になり、両方のモードを満たす相対リンクは無い（仕様根拠: github/markup#576）。リポジトリ内の PR / Issue テンプレートでは `blob/HEAD/` の絶対 URL を使い、採用先の URL が分からない配布版はリンクを外して inline code にし、置換の注釈を添える。相対リンクの検出は `../` 始まりだけでなく `http` / `#` で始まらないリンク全般に広げ、`gh pr view --json body` と `curl -sI` で実際に解決するかを確かめる。

---

<a id="ace-445-1"></a>

### ACE-445-1: Claude 系レビュアーが「既存と整合的だから OK」と全員一致した箇所こそ cross-model レビューの出番 — 同系列の合意は正しさの証明ではない

| Category | process | Origin | PR #445 / Issue #444 |
| Related | ACE-001 |
| Date | 2026-06-19 |
| Helpful | 5 | Harmful | 0 |
| Status | active |

同系列（Claude）の複数レビュアーが「既存コードと整合的」を理由に全員承認しても安全の証拠にはならず、それはむしろ別系列のクロスモデルレビューが最も価値を出すシグナルである（PR #445 では既存パーサを写した入力検証の穴を、Claude 系は全員承認し、Codex だけが検出した）。Claude 系のセルフレビューが全員承認でも、クロスモデルレビューを省略しない。既存 helper を写すときは写し元の欠陥まで継承していないかを疑い、片方だけ直して乖離させずに共有 helper へ抽出して両方を同時に直し、入力検証は字面で正しさを担保する（例: `/^[0-9]+$/`）。

---

<a id="ace-447-2"></a>

### ACE-447-2: 配布物（docs-template/）内のリンクは配布ツリー外を指さない — ドッグフード絶対URLの相対化で `../../../` がツリーを脱出する

| Category | documentation-quality | Origin | PR #447 / Issue #446 |
| Related | ACE-046, ACE-443-1 |
| Date | 2026-06-23 |
| Helpful | 2 | Harmful | 0 |
| Status | active |

配布テンプレート（`docs-template/`）内のリンクが配布ツリーの外を指すと、コピーした下流でリンク切れになり、配布物が自己完結しない。ドッグフード側の絶対 URL を配布側の相対パスへ機械変換するとき、ツリー外への参照は `../../../docs/...` となって境界を脱出するので、「URL 形式だけの差分」に見えて実は到達範囲の差になっている（PR #447 の Issue テンプレート同期で発生した）。配布物を編集したら `grep -rn '\.\./\.\./\.\./' docs-template/` 等でツリーの脱出を検出し、ツリー外への参照は配布側ではプレーンテキストにするか、ツリー内の等価な文書へ張り替える。

---

<a id="ace-447-3"></a>

### ACE-447-3: 大規模 doc PR の cross-model レビューは clean verdict に収束しない — ゲートは「Critical 不在＋実 Important 全対応」、green を待ってループしない

| Category | process | Origin | PR #447 / Issue #446 |
| Related | ACE-445-1, ACE-001 |
| Date | 2026-06-23 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

多数のファイルにまたがるドキュメント PR では、クロスモデルレビューが毎ラウンド新しい言い回しや整合性の nit を出し、clean verdict に収束しにくい（PR #447 では 3 ラウンドとも Critical 0 で、Important が 2〜4 件ずつ出た）。マージ可否のゲートは verdict の PASS ではなく、「Critical がゼロで、検出された実 Important を全対応したこと」に置く。各ラウンドで実バグ・不整合だけを直して誤検知は根拠付きで却下し、新規の nit だけが続く兆候が出たらループを打ち切ってマージ判断をユーザーに示す（クロスモデルレビュー自体は省略しない）。

---

<a id="ace-449-2"></a>

### ACE-449-2: 「既定から外す」変更はデータの空化ではなく明示的なゲート条件で実装し、ドキュメントに書いたオプトイン手順はその場で回帰テストに固定する

| Category | process | Origin | PR #449 / Issue #448 |
| Related | ACE-445-1 |
| Date | 2026-07-02 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

「既定から外すがオプトインは残す」を割り当てデータの空化で実装するとオプトイン経路まで死に、空のプランが exit 0 で完走するので、案内どおりに実行した利用者は動いたと誤解する（PR #449 では Copilot の perspectives を空にしたため、`--cli copilot-cli` を明示しても何も実行されなかった）。除外は「明示指定が無いときだけスキップする」ゲート条件で実装する。ドキュメントに書いたオプトインのコマンド例は同じ PR のテストで固定し、実行対象が 0 件のプランは警告ではなく非ゼロ exit にする。

---

<a id="ace-449-3"></a>

### ACE-449-3: 「設定駆動」を謳う config を編集する前に、そのキーが実際にスクリプトから読まれているか確認する — 読まれない飾りキーはハードコードとの同期注記を付ける

| Category | documentation-quality | Origin | PR #449 / Issue #448 |
| Date | 2026-07-02 |
| Helpful | 2 | Harmful | 0 |
| Status | active |

「設定駆動」を謳うツールでも config の全キーが実装から読まれているとは限らず、読まれない飾りキーを編集すると文書・config・実装が別々の状態を主張する（PR #449 では `agent-config.yaml` の perspectives が実はスクリプト内のハードコードで、`review-config.yaml` はその symlink だった）。config を編集する前に、そのキーを読むコード（yq / jq の呼び出し等）を grep で確かめ、同種のファイルが複数あれば `ls -la` で symlink かを見る。読まれていなければハードコード側も同時に変え、config と文書に「正本はスクリプト内で、同期編集が必要」と注記する。

---

<a id="ace-459-1"></a>

### ACE-459-1: git hook 環境から spawn するサブプロセス git は GIT\_\* を除去しないと実リポジトリを破壊する — テストフィクスチャの git init/commit が呼び出し元リポジトリを直撃した

| Category | tooling | Origin | PR #459 / Issue #453 |
| Related | ACE-449-1 |
| Date | 2026-07-02 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

git は hook の実行時に `GIT_DIR` 等の環境変数を設定するため、hook から品質ゲート・テストランナーへ継承されると、テストフィクスチャの `git init` / `commit` が tmpdir ではなく呼び出し元の実リポジトリを対象に動く（PR #459 では linked worktree からの push で、実ブランチへのコミット混入と `core.bare=true` への書き換えが起きた）。処理が途中まで成功するため、失敗地点のエラーだけでは破壊に気付けない。テストやスクリプトからサブプロセスの git を起動するときは `GIT_` で始まる環境変数をすべて除いた env を渡して `git -C <対象>` で固定し、不可解な壊れ方をしたら `git config --local --list` で `core.bare` / `core.worktree` の汚染を疑う。

---

<a id="ace-464-3"></a>

### ACE-464-3: 複数経路が同じ untrusted トークンを消費するなら消費地点ごとの silent skip でなく入口で一度 fail-loud 検証する

| Category | security | Origin | PR #464 |
| Date | 2026-07-03 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

利用者由来の識別子（`--cli` 等）をパスに使うとき、消費地点ごとに安全性を確かめて不正なら黙ってスキップすると、不正な入力が「結果なし」に化けて表面化せず、ガードを付け忘れた経路（PR #464 では書き込み側）が traversal 可能なまま残る。複数の経路が同じ untrusted トークンを消費するなら、検証を消費前の単一の関数に集約し、不正は skip ではなくエラーと非 0 終了で落とす。`cli:perspective` のような複合形式は区切りの存在も検証する（区切りが無いと両片が同じ値になり、検証をすり抜ける）。

---

<a id="ace-465-2"></a>

### ACE-465-2: cross-model が指摘した「互換性破壊」も、修正案が Issue の明示的決定と矛盾するなら盲従せず実害（呼び出し元の実在）を検証して判断する

| Category | process | Origin | PR #465 |
| Related | ACE-445-1 |
| Date | 2026-07-03 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

クロスモデルレビューの指摘は省略せずに受けるが、提示された修正案が Issue で明示的に決めた方針と矛盾するなら盲従しない（PR #465 では「互換レイヤーを挟め」という案が、Issue #451 の「未知フラグはエラー」という決定を覆すものだった）。指摘の妥当な核（例: 破壊的変更がある）と修正案を分け、核が実害を持つかを、依存する呼び出し元が実在するかを grep で確かめて判断する。実害がゼロなら方針を維持し、意図的な破壊的変更として PR 本文とコミットに明記する。

---

<a id="ace-484-1"></a>

### ACE-484-1: テンプレート欠陥の修正は「実際にコピーされる実体」を先に特定する — 報告先リポジトリと配布実体が別だと直しても下流に届かない

| Category | process | Origin | PR #484 / Issue #483 |
| Date | 2026-08-28 |
| Helpful | 2 | Harmful | 0 |
| Status | active |

同名のテンプレートが複数のリポジトリに実体を持つとき、欠陥が報告されたリポジトリと実際にコピー元として読まれるリポジトリは一致するとは限らない（Issue #483 では、`/init-docs` と `/ace-setup` が読んでいたのは本リポではなく ff-dev-toolkit 同梱の docs-template だった）。報告された欠陥が手元で再現しないときは、Issue の誤りより別の実体を見ていることを第一仮説にする。配布物の修正に着手する前にセットアップ手順が参照するパスを grep し、その実体と自リポのファイルを `diff -rq` して正本を決め、修正だけでは下流が変わらないならその旨と移植先の Issue を PR に書く。

---

<a id="ace-484-2"></a>

### ACE-484-2: 配布物のリンク規約は Playbook に書くだけでは適用漏れが残る — 利用者側レイアウトを再現する機械検証で固定する

| Category | testing | Origin | PR #484 / Issue #483 |
| Date | 2026-08-28 |
| Helpful | 2 | Harmful | 0 |
| Status | active |

配布物のリンク規約を Playbook に書くだけでは適用が人手の grep に頼るため取り残しが出るうえ、リンクは「利用者側レイアウトでパスが解決するか」と「Issue / PR 本文の描画文脈で解決するか」の 2 軸で壊れるので、片方だけ直して直ったと誤認しやすい（PR #484 では既存の ACE-046 / ACE-447-2 が 14 リンクに未適用のまま残っていた）。規約を新設・適用したら同じ PR で、利用者側レイアウトを写像で再現し、相対リンク・inline code のパス・frontmatter の references をすべて解決するテストを足す。テストが修正前の内容で実際に落ちることを確かめてから緑にし、テスト名には検証している内容だけを名乗らせる。

---

<a id="ace-484-3"></a>

### ACE-484-3: フォーマッタを caret 範囲で許すと push ゲートが環境依存で赤くなる — 「触っていないファイルが落ちる」で切り分けが溶ける

| Category | tooling | Origin | PR #484 / Issue #485 |
| Date | 2026-08-28 |
| Helpful | 3 | Harmful | 0 |
| Status | active |

整形結果が版で変わるフォーマッタ（prettier 等）を `^` 範囲で許し、pre-push でフル品質ゲートを強制していると、パッチ版が上がっただけで触っていないファイルが赤くなり、全員の push が止まる（PR #484 ではローカルの prettier 3.9.6 と lockfile の 3.8.3 で整形結果が異なった）。症状が自分の差分と無関係に見えるので、原因をコードに求めて時間を溶かしやすい。整形系の devDependency は厳密に固定し、`npm ci` が通る状態を保って「`npm ci` で環境を揃えてからゲートを回す」と手順に書き、未変更ファイルが落ちたら既定ブランチの状態で再実行して既存の破綻かを切り分け、ツールの版と lockfile の版を突き合わせる。

---

<a id="ace-489-1"></a>

### ACE-489-1: 「違反ゼロ」を期待するガードは検出器が壊れても緑のまま通る — 合成入力で検出器自体を固定する

| Category | testing | Origin | PR #489 / Issue #488 |
| Date | 2026-08-28 |
| Helpful | 5 | Harmful | 0 |
| Status | active |

`expect(violations).toEqual([])` の形の規約ガードは、検出器（正規表現・分類ロジック）が何も拾わなくなっても緑のまま通り、規約が守られて違反が 0 件に近づくほど検出器の稼働確認が効かなくなる（PR #489 ではリンク抽出の正規表現がアンカー付きリンクを取りこぼしていた）。ファイルを集められたかの確認（`files.length > 0`）では、そこから抽出できたかは分からない。規約ガードには違反検出のテストと、合成入力で検出器そのものを固定するテスト（拾うべき代表形・拾ってはいけない形・分類関数の境界値）をセットで置き、リンク抽出ではアンカーやクエリの後置を最初に疑い、除外は先頭 1 文字の否定ではなく否定先読みで書く。

---

<a id="ace-498-1"></a>

### ACE-498-1: 脆弱性解消の依存更新では、更新後パッケージの engines を自分の engines 宣言と照合する — audit fix は runtime 要件の引き上げを報告しない

| Category | tooling | Origin | PR #498 / Issue #497 |
| Date | 2026-09-06 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

脆弱性を塞ぐために開発ツールを minor 上げすると、そのツールの Node 要件が上がり、`package.json` の `engines` 宣言が自分の依存ツリーに対して偽になることがある。`npm audit fix` / `npm install` はこれを警告せず、`EBADENGINE` は宣言を信じて古い Node で入れた人にしか出ないため、更新した本人は気づけない。lockfile 更新の PR では、変更した直接依存の `engines` を lockfile から抜き出して自分の宣言と比較し、要件が上がっていれば「旧版で脆弱性が塞げるか」を先に確かめ、塞げないなら `engines` と Node 版を述べる文書を同じ PR で揃える（対象 Node が EOL なら引き上げが正）。

---

<a id="ace-500-1"></a>

### ACE-500-1: 「移行前の記録」節を持つ文書で基準値が変わっても記録節は書き換えない — 現行値は別節に置き、記録節からは参照だけする

| Category | documentation-quality | Origin | PR #500 / Issue #499 |
| Date | 2026-09-06 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

設計文書が「移行前の定義」「旧設定の棚卸し」を記録として残している場合、基準値の更新（Node 版・閾値・ツール版）を grep 置換で横断適用すると、記録節まで現行値に書き換わり「当時どうだったか」が失われる。値を変える PR では、ヒットした各箇所が現行仕様か過去の記録かを見て、記録節は当時の実値（削除済みファイルなら `git show <sha>^:<path>` で裏取り）に保ち、現行値は仕様節に置いて記録節からは参照だけにする。過去の記録が既に不正確でも、正しい記録へ直すのであって現行値へ揃えるのではない。

---

<a id="ace-505-1"></a>

### ACE-505-1: 別実体の文書から規則文を転記するときは、転記先の実体で各事実主張を再検証する — 転記元で真だった「検出する」「全文書に Frontmatter がある」が転記先では偽になっている

| Category | documentation-quality | Origin | PR #505 / Issue #482 |
| Related | ACE-484-1 |
| Date | 2026-09-06 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

同じ名前の配布物が複数実体に分岐している環境（ff-dev-toolkit 同梱 docs-template と公開リポの docs-template）で、一方の SKILL.md の規則文を他方のコマンド文書へ写すと、規則に埋め込まれた事実主張（「残存は `/validate-docs` が検出する」「初期セット全文書が Frontmatter を持つ」「変更履歴表の `[日付]` / `[名前]` を埋める」）が転記先では成り立たず、レビュアー 2 系統（Toolkit comment-analyzer / Codex）が独立に事実誤りとして指摘した。[ACE-484-1](#ace-484-1) が「直す先の実体を特定する」なら、本エントリは「転記する文の中の事実を転記先の実体で検証する」。規則文を写す前に、文中の各主張を転記先リポジトリのファイル・スクリプト（`head -1` で Frontmatter の有無、`grep` で検出正規表現、対象ファイルの存在）で個別に照合し、成り立たないものは転記先の実態に書き換えるか出典を「toolkit 版では」と限定する。

---

<a id="ace-505-2"></a>

### ACE-505-2: 名称統一の横断修正では、品質ゲートの glob 対象外ディレクトリ（`.claude/commands/` 等）も grep 範囲に明示的に含める — lint / format が見ないファイルの残存はレビュアーにしか見つからない

| Category | process | Origin | PR #505 / Issue #466 |
| Related | ACE-010 / ACE-043 |
| Date | 2026-09-06 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

`review-config.yaml` → `agent-config.yaml` の統一で `docs-template/` と `README.md` は grep して直したが、`format:md` / `lint:md` の glob（`docs/**` `docs-template/**` `*.md`）に含まれない `.claude/commands/setup-ai-config.md` の案内文が残り、Toolkit code-reviewer の Warning になった。同ディレクトリは pre-commit の変更ファイル lint でしか検査されないため、既存の MD060 違反も同時に露出した。名称・パス・既定値を統一する PR では、grep の起点を「品質ゲートが見る範囲」ではなく「リポジトリ全体から node_modules / .git を除いた範囲」（`git grep -n '<旧名>'`）にし、ヒット先が現役の案内文か履歴記録（PLAYBOOK・Changelog）かを分類してから直す。

---

<a id="ace-543-1"></a>

### ACE-543-1: ファイル単位でライセンスが分かれる取り込みは、README のライセンス節に対象パスを列挙し、一覧の正本を由来マニフェストに置く

| Category | documentation | Origin | PR #543 / Issue #542 |
| Date | 2026-10-15 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

取り込み元のライセンス全文と由来マニフェストを同梱しても、利用者が最初に読むのは README のライセンス節で、そこが単一ライセンスの 1 行だと全体がそのライセンスだと受け取られる。別ライセンスの実体を取り込む PR と、取り込み対象を増やす PR が該当する。README に「対象パス → ライセンス」と「それ以外の扱い」を書き、対象一覧の正本はマニフェストの `files` だと明記して写しの陳腐化を辿れるようにし、コピー時に残すもの（ライセンス全文・出所記録・改変表示）も同じ節に置く。

---

<a id="ace-543-2"></a>

### ACE-543-2: 公開リポジトリの文書から別リポジトリへリンクする前に visibility を確かめ、private ならリンクにせず名前で書く

| Category | documentation-quality | Origin | PR #543 / Issue #542 |
| Date | 2026-10-15 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

同じ org の別リポジトリは書き手には開けても、公開リポジトリの読者には 404 になり、出所の案内がそのまま壊れたリンクになる。書き手の権限ではクリック確認が通るため、手元の目視やリンク到達確認では検出できない。公開文書に別リポジトリの URL を書くときは `gh repo view <owner/repo> --json visibility` で PUBLIC を確かめ、PRIVATE ならリンクにせずリポジトリ名だけを書く。

---

<a id="ace-546-1"></a>

### ACE-546-1: 入口文書の規則が参照する正本を読者が開けないなら、ポインタで済ませず判定条件を本文に自足させる

| Category | documentation | Origin | PR #546 / Issue #544 |
| Related | ACE-014 |
| Date | 2026-10-15 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

`AGENTS.md` は Codex など、プラグインのスキルを持たない CLI も読む。そのため「正本は `/out-of-scope-issue` を参照」というポインタだけでは、読者が判定の条件にたどり着けない。[ACE-014](#ace-014) の「索引は SSOT へのポインタに留める」が成り立つのは、ポインタ先が読者の環境で開ける場合に限られる。入口文書へ規則を書くときは、正本がプラグインや別リポジトリにあるかを確かめる。読者が開けない場所にあるなら、判定順・境界条件・迷ったときの倒し方を本文に書き、正本は出典として併記する。

---

<a id="ace-546-2"></a>

### ACE-546-2: 文書に載せる一覧取得コマンドは、既定の件数上限で黙って打ち切られないよう各行に上限を明示する

| Category | documentation-quality | Origin | PR #546 / Issue #544 |
| Date | 2026-10-15 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

`gh issue list` は既定で 30 件しか返さず、打ち切ったことも知らせない。「既存の統合先を探してから起票する」手順の検索がここで欠けると、候補が無いと誤って判断され、重複起票につながる。PR #546 では 1 行目にだけ `--limit 200` を付け、2 行目の主要語検索には付け忘れた。ブロック先頭のコメントが「全行に効いている」と読ませたため、レビュー（error-handler-hunt）まで残った。手順書のコード例では、一覧・検索の各行に `--limit` を付ける。注意書きのコメントは、それが効く行の直上に置く。

---

<a id="ace-547-1"></a>

### ACE-547-1: 配布するテンプレートの手順例が配布元のリポジトリ設定（ラベル等）を前提にするなら、実在確認と不在時の代替経路を同じ例に併記する

| Category | documentation-quality | Origin | PR #547 / Issue #545 |
| Related | ACE-546-1 |
| Date | 2026-10-15 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

テンプレートは下流のリポジトリへコピーされて使われるが、手順例が前提にするラベル・Epic・ブランチ保護などの設定は下流にあるとは限らない。前提の設定が無いと、検索は黙って空を返し、`--label` 付きの起票は失敗するため、読者は手順の途中で行き詰まる。PR #547 では起票例に `--label "bundle"` を必ず付けており、親による直読と Codex が同じ Warning として独立に検出した。設定を前提にするコマンド例を書くときは、実在を確かめる 1 行と、不在時の読み替え（例: カテゴリ Epic の sub-issue）を同じ例の中に置く。

---

<a id="ace-548-1"></a>

### ACE-548-1: 生成物の運用手順では「生成成功・CI 成功・取得照合・長期保管」を別々の記録項目として定義し、前段の成功を後段の完了に読み替えさせない

| Category | documentation-quality | Origin | PR #548 / Issue #540 |
| Date | 2026-10-15 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

SBOM などの生成物は「生成できた」時点で完了と報告されやすい。しかし、保存先から取得してハッシュ・SHA を照合できるか、期限付き artifact を長期保管先へ移したかは別の事実である。PR #548 の先行試行でも、CI 成功の後に artifact を実際に取得し、照合して初めて対応を確認できた。CI を使えない環境でのローカル生成も、自動実行済みとは区別して記録する必要があった。生成物の運用文書を書くときは、各段の成功を別の記録欄として表に分ける。手順の末尾には、取得後の照合手順を置く。

---

<a id="ace-549-1"></a>

### ACE-549-1: follow-up Issue に書かれた行数などの実測値は起票時点の値として扱い、着手時に測り直して計画した変更量で受け入れ条件を満たせるかを先に計算する

| Category | documentation-quality | Origin | PR #549 / Issue #511 |
| Date | 2026-10-15 |
| Helpful | 2 | Harmful | 0 |
| Status | active |

レビューから分離した follow-up Issue は、起票後も元の PR の修正が続くため、本文の数値（行数・件数など）が着手時には古くなっている。Issue #511 は 862 行の前提で「§1 を分離すれば 700 行前後」と見積もっていたが、着手時の実測は 980 行で、その案だけでは約 817 行となり 800 行以下という AC を満たせなかった。着手時に対象を実測し、計画した移設量・削減量で AC の閾値を下回るかを実装前に計算する。足りなければ追加の移設先を選び、その理由を PR 本文に書く。

---

<a id="ace-551-1"></a>

### ACE-551-1: 外部の正本を写したガードテストのスナップショットだけを更新すると、ガードは緑のまま正本とずれる — 正本の更新と同時に行うか、ずれと追跡先をスナップショット側に明記する

| Category | documentation-quality | Origin | PR #551 / Issue #550 |
| Date | 2026-10-15 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

PR #551 では PATTERNS.md §3 を新設の ERRORS.md へ移し、配布物リンクガードの INITIAL_SET（ff-dev-toolkit の init-docs SKILL.md を写した初期セット）に ERRORS.md を足した。しかし出典の SKILL.md と同梱 docs-template は別リポジトリにあり、そちらは 20 ファイルのままだった。テストは緑になったが、上流が PATTERNS.md だけを移植すると展開先でエラー型の正典が消える。この矛盾はレビュー 3 レーンが独立に指摘した。外部の正本を写したスナップショットを変えるときは、同じ変更で正本も更新する。それが別リポジトリでできない場合は、スナップショットのコメントに「正本とのずれ・追跡 Issue・同時に移植すべきファイル」を書き、追跡 Issue の AC に原子的な移植を入れる。

---

<a id="ace-552-1"></a>

### ACE-552-1: 通過記録を書く品質ゲートには部分実行オプションを設けず、個別段は各段のスクリプトを直接呼ぶ形で提供する

| Category | tooling | Origin | PR #552 / Issue #389 |
| Date | 2026-10-15 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

ゲートが通過時に HEAD 付きの pass 記録を残し、マージ前の鮮度照合がそれを読む構成では、`--only` のような部分実行で pass を書くと全段の通過と区別できず、照合が偽の緑を返す。部分実行を足すなら記録のスキップ規則まで設計し直す必要があるため、各段がすでに独立したスクリプトであればオプションは足さない。失敗時の出力に段番号と再実行コマンドを載せ、個別実行への導線はそこで満たす。

---

<a id="ace-553-1"></a>

### ACE-553-1: 既存ルールに例外を新設する PR では、その PR 自身の差分を新しい例外の最初の適用例として条件に照らす

| Category | process | Origin | PR #553 / Issue #406 |
| Related | ACE-019 |
| Date | 2026-10-15 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

例外や新ルールを足す PR は、そのルールの最初の適用例になる。しかし書き手は規則の文面に集中して自分の差分への当てはめを忘れやすく、レビューで自己違反（記録要件の欠落・許可範囲外の変更）として指摘される。正本の置き場所も同じで、既存の正本指定（AGENTS.md 等）を確かめずに書きやすい文書へ置くと、[ACE-019](#ace-019) で明示したはずの例外が別の分裂を生む。例外条件を書き終えたら、対象範囲・記録要件・正本の置き場所の各項目を自分の差分へ 1 つずつ当て、満たさない差分を直すか条件を広げてから push する。

---

<a id="ace-555-1"></a>

### ACE-555-1: 「すべての X は」と書かれた規範の適用範囲を狭めるときは、狭めた範囲の実ファイルで必須条件を実測してから書く

| Category | documentation-quality | Origin | PR #555 / Issue #412 |
| Related | ACE-549-1 |
| Date | 2026-10-15 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

全称で書かれた規範は対象が曖昧なため、誰も守っていなくても矛盾として表に出ない。範囲を特定の集合へ狭めた時点で検証可能な主張に変わり、元の文言を引き継ぐと実態と食い違う。PR #555 では OPERATIONAL_GUIDE §7 の「すべての Markdown は以下を含む必要がある」を `docs/` 方法論ガイドへ限定した。しかし実測すると、`status` を持たない frontmatter が 4 件、`phase` の無い文書が 6 件あり、別ガイドの「`visibility` のみも許容」とも矛盾していた。範囲を狭める差分では、その節が「必須」とする各項目を狭めた範囲の実ファイルに当てて件数を数え、満たさないものがあれば文言を「付ける場合の形式」へ弱めるか、実ファイル側を揃える。

---

<a id="ace-557-1"></a>

### ACE-557-1: 上流の変更を受け取るテンプレートと検証コードが同じ値集合を持つなら、テンプレートを正本と宣言し、両者を読み比べるテストで固定する

| Category | testing | Origin | PR #557 / Issue #556 |
| Related | ACE-551-1 / ACE-014 |
| Date | 2026-10-15 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

上流から変更が届くテンプレートの enum を、検証スクリプトの定数や解説ガイドにも書くと、更新はテンプレートにだけ入り、残りは黙って古いまま残る。PR #557 では MASTER.md が上流から `deprecated` を取り込んで 4 値になっていたが、`validate-docs.mjs` とガイドは 3 値のままだった。しかもガイドが自分を正本と名乗っていたため、追従すべきだと誰も気づかなかった。同じ値を複数の場所に持つ必要があるなら、上流を受け取る側を正本と明記し、正本の該当行と定数行を実ファイルから抜き出して突き合わせるテストを置く。こうすれば、次に上流が変わったときに CI が赤になって知らせる。

---

<a id="ace-559-1"></a>

### ACE-559-1: 依存を外すために lockfile を再生成するときは、CI と同じ Node に同梱の npm で再生成し、追加行を含む差分全体が対象エントリの削除だけかを確かめる

| Category | tooling | Origin | PR #559 / Issue #418 |
| Related | ACE-484-3 |
| Date | 2026-10-15 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

開発環境の npm が CI より古いメジャーだと、`npm uninstall` は新しい npm が記録したフィールド（`libc` など）を書き出せずに黙って落とし、無関係なエントリの制約まで消す。`libc` が消えたネイティブ依存は「制限なし」として扱われ、Linux で GNU・musl 両方の tarball を取得し得るが、`npm ci` もテストも通るため品質ゲートでは見つからない。lockfile v3 は生成元の npm 版を記録しないので、版は CI の `setup-node` の `node-version`（`engines.node` と揃えたもの）に同梱の npm から決め、`npx npm@<その版>` で再生成する（Node 24 なら npm 11）。再生成後は削除行だけでなく追加行も含む差分全体を見て、対象パッケージと推移依存のエントリの削除以外に何も動いていないことを確かめてからコミットする。

---

<a id="ace-562-1"></a>

### ACE-562-1: refine の stale 判定は文書からの引用を見ないため、Archive 候補は現行ルールとして参照されていないかを確かめてから承認する

| Category | knowledge-management | Origin | PR #562 |
| Date | 2026-10-16 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

`ace-refine-report` の Archive 候補は Helpful=0 と一定期間の参照の無さから機械的に出るため、ワークフロー文書が「このルールとは別物」「引き続き有効」と現行ルールとして引用しているエントリまで stale に含まれる（PR #562 では ACE-012 / ACE-034 をアーカイブし、レビューで live へ戻した）。候補が数十件規模になる refine で、件数を一括承認するときに起きやすい。承認前に各候補 ID をリポジトリ全体で grep し、運用文書・スキル・コマンドから規範として参照されているものは Archive から外して圧縮（正準化）に回す。

---

<a id="ace-566-1"></a>

### ACE-566-1: 前提を満たさないと別の症状で落ちるゲートやテストは、最初の段より前に前提を名指しで検査して止める

| Category | tooling | Origin | PR #566 |
| Related | ACE-484-3 |
| Date | 2026-10-16 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

依存の導入や環境の前提を自分では満たさないゲートは、前提が欠けると途中の段が型定義の不在やコマンド未検出のような原因の読めない形で落ち、利用者はゲートを何周も空費する（`quality:local` では `node_modules` 不在が TS2688 や `vitest` 未検出として現れ、3 回観測された）。同じ前提に暗黙に依存するテストも、終了コードの不一致としか読めない失敗になる。前提を自動で満たさない方針のゲートほど、最初の段より前に前提の在否を確かめ、不在の対象と満たすためのコマンドを名指しして失敗させる。前提に依存するテストにも同じ確認を `beforeAll` 等で置く。

---

<a id="ace-569-1"></a>

### ACE-569-1: 構文の壊れたコード例は、構文検査だけでなく Markdown 整形ツールの埋め込み整形からも黙って外れる

| Category | documentation-quality | Origin | PR #569 |
| Date | 2026-10-16 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

Markdown の整形ツールはフェンス内のコードも言語ごとに整形するが、解析できないブロックはエラーにせず原文のまま残す。そのため、構文の壊れた例は整形検査も緑のまま通り、壊れていること自体がどのゲートにも現れない。構文が通るよう直したブロックは初めて整形の対象になり、引用符や改行の差分が出る。コード例の構文検査を導入するときは、既存違反を直した後に整形を書き込みモードで回し、その差分を同じ変更に含める。JSON やルート一覧のように TypeScript でない例は、検査を外すマーカーではなく実際の言語名でフェンスを書き直す。

---

<a id="ace-569-2"></a>

### ACE-569-2: Markdown の入れ物（引用・リスト）を自前で解析するときは、始まりと終わりを対で実装し、終わりの側にも回帰テストを置く

| Category | coding | Origin | PR #569 |
| Date | 2026-10-16 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

引用やリストの中のコードフェンスを拾えるようにすると、その入れ物が終わったときにフェンスも閉じなければならない。始まりだけを足すと、閉じられないフェンスが後ろの独立したブロックまで飲み込み、見逃しが別の形で戻る（PR #569 では 1 巡目の修正が 2 巡目のレビューでこの回帰として見つかった）。入れ物を 1 つ対応するたびに「開始を認識する」「終了で閉じて次の行を読み直す」を対で実装し、テストも両方を 1 組で書く。対応する入れ物が増えて境界の扱いが膨らむなら、自前の抽出をやめて CommonMark 準拠のパーサへ置き換える。

---

<a id="ace-571-1"></a>

### ACE-571-1: Windows で子プロセスを起動するテストは、子に渡す PATH から実行ファイルが探されるため、POSIX 形式の PATH を渡すと起動自体に失敗する

| Category | testing | Origin | PR #571 |
| Date | 2026-10-16 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

Windows の Node は、`spawnSync` の実行ファイルを子の `env.PATH` から探す。外部ツールへの依存を断つ目的で `/usr/bin:/bin` に絞ると、bash も git も見つからず、`status` が `null`・`stdout` が `undefined` の、原因の読めない失敗になる。PATH の順で bash を探すと、System32 にある WSL の起動ランチャーを拾うこともある。Windows では Git for Windows の配置（`git --exec-path` を起点）から bash.exe / git.exe を絶対パスで決め、子の PATH はその 2 ディレクトリだけを `path.delimiter` で連結する。macOS / Linux 側の絞り込みはそのまま残す。

---

<a id="ace-571-2"></a>

### ACE-571-2: 単独で通ったテストを受け入れ条件の根拠にせず、条件が指す実行形態（ゲートの段の全体実行）で測る

| Category | testing | Origin | PR #571 |
| Date | 2026-10-16 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

子プロセスを起動するテストは、単独なら数秒で通っても、テストランナー全体（他スイートと並列）では既定のタイムアウトを超えて落ちることがある。PR #571 では、単独で 14 件通過を確認した後、全体実行で同じファイルが 5 秒のタイムアウトで 1 件落ち、受け入れ条件が未達だとわかった。受け入れ条件が「ゲートで通る」を指すなら、そのゲートの段と同じ全体実行で確かめ、フレークの可能性がある場合は複数回測る。タイムアウトを延ばすときは、実測した所要時間を根拠にして名前付き定数で持つ。

---

<a id="ace-578-1"></a>

### ACE-578-1: 文書の索引や Changelog に追記するときは日付付きの追記行で済ませず、version・updated・changeImpact・版付き Changelog の 4 点を同時に揃える

| Category | documentation-quality | Origin | PR #578 |
| Date | 2026-10-16 |
| Helpful | 3 | Harmful | 0 |
| Status | active |

索引への 1 行追加のような小さな追記でも、version を上げずに「YYYY-MM-DD 追記」の行だけを足すと、frontmatter の updated と本文の日付が食い違い、利用者や版差分を読む処理が新しい索引を旧版の内容と誤認する（PR #578 では Toolkit と Codex が独立に同じ漏れを指摘した）。前の PR が残した古い changeImpact も次の bump で引き継がれるので、minor なら medium、patch なら low に合わせて置き直す。文書を変更する PR では、追記の大小にかかわらず 4 点を 1 セットで更新し、版付きの Changelog エントリに記録する。

---

<a id="ace-578-2"></a>

### ACE-578-2: 運用テンプレートの表は、本文が約束した運用（期限の監視・個体の照合）を列だけで回せるかを突き合わせ、多義的な動詞には対象を書く

| Category | documentation-quality | Origin | PR #578 |
| Date | 2026-10-16 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

本文で「有効期限を見て放置を見つける」「新旧キーの併存を区別する」と約束しながら、テンプレートの表にその列が無いと、利用者は本文の運用を実行できない（PR #578 のキー一覧テンプレートで有効期限と識別子の列が抜けていた）。同じ文書で「公開を妨げない」のような多義的な動詞を対象なしで書くと、別節で禁じた「一覧そのものの公開」を許すように読める。テンプレートを書いたら、本文の各運用について「どの列を見れば実行できるか」を 1 対 1 で確かめ、動詞には必ず対象（運用開始・リリース・一覧）を添える。

---

<a id="ace-578-3"></a>

### ACE-578-3: 公開配布するテンプレートの受け入れ確認では、鍵の接頭辞・長い英数字列・実在の組織名を grep して実値の混入が無いことを機械的に確かめる

| Category | security | Origin | PR #578 |
| Date | 2026-10-16 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

秘密情報を扱うテンプレートは記入例を架空の値で書くが、先行試行の実値や実在サービス名が混入すると、配布物が公開された時点で漏えいになる。目視の確認は見落とすので、受け入れ確認では `sk_` / `pk_` / `AKIA` / `ghp_` などの鍵接頭辞、32 文字以上の英数字列、自社名・実在サービス名を grep し、0 件であることを完了報告の根拠にする（PR #578 の DoD 照合で実施）。記入例の値は `YYYY-MM-DD` や `EX-0000` のように、形だけ分かる明らかなダミーにする。

---

<a id="ace-579-1"></a>

### ACE-579-1: 「pre-push がゲートを実行するので手動実行を省いてよい」という規約は、hook が発火しない・回避した・環境要因で実測にならない場合の例外と申告の義務をセットで書く

| Category | process | Origin | PR #579 |
| Date | 2026-10-16 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

省略規約を無条件に書くと、`npm ci` 未実行の新規 worktree（husky の `.husky/_` が無く pre-push が黙って発火しない）、`SKIP_QUALITY_GATE=1` や `--no-verify` での回避、既知の赤がある OS など、実測が無いまま push される経路が規約上は正当になる（PR #579 で Toolkit と Codex が独立に指摘）。規約には「省略できるのは hook が発火する状態のとき」「push 時に `Running quality gate before push` が出ることを確認する」「出なかった・回避した・実測にならない場合は手動実行して PR 本文で申告する」を 1 文にまとめて書き、pre-push が測るのは作業ツリーであり未コミット変更があれば HEAD の実測にならないことも添える。同じ趣旨の記述は入口文書だけでなく専門ガイド・PR テンプレート・設計書にも残るので、grep で洗い出して同時に揃える。

---

<a id="ace-579-2"></a>

### ACE-579-2: `fetch` に再試行をかぶせるラッパーは、呼び出し元の `init.signal` を `AbortSignal.any` でタイムアウトと合成し、中断後は再試行せず、読まない本文は cancel する

| Category | coding | Origin | PR #579 |
| Date | 2026-10-16 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

`RequestInit` を受け取る汎用ラッパーでタイムアウト用のシグナルを `signal` に直接書くと、呼び出し元の中断シグナルが上書きされ、利用者が中断しても通信と再試行がタイムアウトまで続く（PR #579 のドキュメント例で Codex が指摘）。`AbortSignal.any([AbortSignal.timeout(ms), init.signal])` で合成し、再試行判定には `() => !init.signal?.aborted` を渡して中断後の再試行を止める。`!res.ok` で失敗にするときは `await res.body?.cancel()` で接続を返してから、`status` 付きの Error を投げて分類を正典（`normalizeExternalError`）に任せ、タイムアウト値は型に無い `timeout` オプションではなく名前付き定数の `AbortSignal.timeout` で持つ。

---

<a id="ace-580-1"></a>

### ACE-580-1: Git 設定の隔離は Windows でも `NUL` を使わず `/dev/null` と `GIT_CONFIG_NOSYSTEM=1` を併用し、隔離が効いていることは陽性対照付きのテストで実測する

| Category | testing | Origin | PR #580 |
| Date | 2026-10-16 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

Windows の Git は `GIT_CONFIG_GLOBAL=NUL` / `GIT_CONFIG_SYSTEM=NUL` を `unable to access 'NUL'` で拒否するが、`/dev/null` は git 自身の互換層が `nul` に読み替えるのでどの OS でも通り、`GIT_CONFIG_NOSYSTEM=1` を併せれば system 側は開かれない（PR #580。`SYSTEM=NUL` 単独は exit 128、`NOSYSTEM=1` 併用は exit 0）。OS で値を切り替える分岐を持たず、`.mjs` と `.ts` のように import し合えないファイルに同じ処方があるときはコメントで相互参照する。隔離の検証は、一時 HOME に目印付き設定を置き「隔離なしなら目印が見える」陽性対照を先に確かめてから、`git config --list --show-origin` の由来が対象の `.git/config` だけであることを assert する。

---

<a id="ace-580-2"></a>

### ACE-580-2: 環境依存の機能（symlink など）は OS 名ではなく実際に試して判定し、skip にするのは想定した失敗（win32 かつ EPERM）だけに限る

| Category | testing | Origin | PR #580 |
| Date | 2026-10-16 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

`process.platform` で skip を決めると、開発者モードの Windows のように機能が使える環境でもテストが走らず、逆に POSIX で一時ディレクトリが壊れているような無関係の失敗まで skip に化ける。プローブで実際に作ってみて、想定した失敗コードのときだけ理由付きで `ctx.skip` し、それ以外の例外はそのまま投げる（PR #580。理由は `--reporter=verbose` で表示されることを確認）。Node で symlink を作れても git が mode 120000 で保存するかは `core.symlinks` 次第なので、git 経由の検証では `git ls-files -s` の 120000 を別に assert する。

---

<a id="ace-580-3"></a>

### ACE-580-3: `.gitattributes` の LF 固定を拡張子で書くと拡張子の無いフック（`.husky/*`）が漏れる。属性を足した後の既存チェックアウトは `rm <path> && git checkout -- <path>` で取り直す

| Category | tooling | Origin | PR #580 |
| Date | 2026-10-16 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

`*.sh text eol=lf` を足しても `.husky/pre-push` / `pre-commit` は対象外で、autocrlf=true の新規チェックアウトでは CRLF のまま残り、sh で実行されるフックが品質ゲートに届く前に落ちる（PR #580 で Codex が P1 として指摘。`.husky/* text eol=lf` と `.gitattributes text eol=lf` を追加して解決）。属性の追加は既存の作業ツリーには効かず、`git checkout -- <path>` 単独は stat が一致したままなので何もせず、`git add --renormalize` は index を直すだけで作業ツリーは残る。`git ls-files --eol | grep w/crlf` で対象を確かめ、未変更ファイルを削除してから checkout し直す手順を `.gitattributes` のコメントと手順書に書く。

---

<a id="ace-580-4"></a>

### ACE-580-4: 受け入れ条件が複数 Issue の和集合でしか実測できないときは 1 PR に束ね、担当ファイルを排他にした並列 worktree で「片方だけ入れたときの残る失敗 = もう片方の担当」を確かめてから統合する

| Category | process | Origin | PR #580 |
| Date | 2026-10-16 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

OS 固有のテスト失敗を Issue 単位の PR に分けると、各 PR は単独では pre-push ゲートが赤のまま push できず、AC「ゲートで X が落ちない」を間接形でしか示せない（PR #580 は 6 Issue を 1 PR に束ねた）。実装は担当ファイルを重ならないように分けた worktree で並列に進め、基準線（全件の失敗一覧）に対して「W1 だけで残る失敗が W2 の担当と完全一致」「W2 だけで残る失敗が W1 の担当の部分集合」を機械的に照合してから統合し、統合後に親が AC の実行形態（全体実行を複数回・ゲート 1 回）で測り直す。PR 本文には分割しない理由とレビュー観点ガイド（読む順序）を書く。

---

<a id="ace-580-5"></a>

### ACE-580-5: OS のパス区切りは比較する箇所ごとに直さず列挙の時点で一度だけ `/` に揃え、その純粋なユーティリティは import 時に子プロセスを起動するモジュールとは別ファイルに置く

| Category | coding | Origin | PR #580 |
| Date | 2026-10-16 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

`path.relative` / `join` / `normalize` の結果を `/` 区切りの期待値と比べる箇所が散らばると、Windows では `\` 区切りのまま比較される箇所が残って落ちる（PR #580 では 2 つのテストと本番スクリプトで計 16 件）。ファイルを列挙した時点で `split(sep).join("/")` に揃えれば、読み込み・照合・出力・差分の判定がすべて `/` で揃う。`toPosixPath` のような純粋関数は、import した時点で `git --exec-path` を起動するヘルパーと同居させず副作用の無いファイルに置き、`.mjs` と `.ts` が import し合えない場合だけコピーを許してコメントで相互参照する。

---

<a id="ace-581-1"></a>

### ACE-581-1: 実ファイルでは違反ゼロを期待する文字列検査は、除外形を行ごとにマスクしてから判定し、検出器を合成入力の自己検証で固定する（同居行・空白無しの隣接・全角終端・散文を含める）

| Category | testing | Origin | PR #581 |
| Date | 2026-10-16 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

正当な言及（プラグイン同梱パス・絶対 URL）を含む行を丸ごとスキップする方式は、同じ行にある混入を見逃して検査が骨抜きになる（PR #581 の対象文書には正当な言及が 20 行以上ある）。除外形を `replace` で取り除いてから禁止文字列を `includes` で判定し、URL の除外は ASCII 印字可能文字に限って括弧・引用符・`|` で終端する（`\S+` 系は日本語の「、」「（」の先まで食う）。実ファイルは常に 0 件なので、検出器そのものを合成入力の自己検証テストで固定し、ケースには同居行・URL と混入の空白無し隣接・全角終端・スラッシュ無しの散文（不検出）を入れ、1 行には違反を 1 つだけ置く。

---

<a id="ace-581-2"></a>

### ACE-581-2: follow-up Issue の「前の PR で修正済み」という記述は検査範囲を狭める理由にせず、拡張した検出器で全件を洗い出してヒットを修正と除外に分類して PR に残す

| Category | process | Origin | PR #581 |
| Date | 2026-10-16 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

Issue #509 は「DECISION_TREE.md の 2 箇所は PR #508 で修正済み」と書いていたが、実際に #508 が直したのは 1 箇所で、拡張した検査が残りの 1 箇所を検出した。follow-up Issue の本文は起票時点の認識であり、前 PR のコミットメッセージの件数が実態とずれることがある。検査を広げる PR では Issue の記述を前提に対象を絞らず、まず全件を走らせてヒット一覧を作り、修正するもの・除外規則で通すものに分類した表を PR 本文に残す。

---

<a id="ace-584-1"></a>

### ACE-584-1: Vitest や tsx は esbuild で変換して実行するだけで型を見ないので、`tsc --noEmit` を品質ゲートの独立した段に置き、型エラーを仕込んだ陽性対照で止まることを確かめる

| Category | testing | Origin | PR #584 |
| Date | 2026-10-17 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

テストランナーが TypeScript を実行できていても、esbuild の変換は型を検査しないので、ジェネリック返り値の取り違えのような型エラーはテストが緑のまま残る（PR #584 では mcp/ の型を借りた `tsc --strict` で初めて 15 件見つかった）。型検査は `tsc --noEmit -p tsconfig.json` を独立した段として品質ゲートに入れ、`include` が対象を拾っているかを `--listFilesOnly` の件数で確かめる。足した段は、型エラーを 1 件仕込んでゲート全体が段名と `ファイル:行` で止まることを実測してからマージする。

---

<a id="ace-584-2"></a>

### ACE-584-2: Node 専用の tsconfig で `lib` を省くと `target` から DOM を含む lib が選ばれ、`document` などが型検査を通って実行時に ReferenceError になるので、`lib` を明示する

| Category | coding | Origin | PR #584 |
| Date | 2026-10-17 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

`lib` を書かない tsconfig は `target`（例: ES2024）から `lib.es2024.full.d.ts` を選び、DOM と window のグローバルが入る（PR #584 のレビューで指摘）。宣言し忘れた `name` / `status` / `document` などが型検査を通り、Node では `ReferenceError` で落ちるので、Node で動かすコードの tsconfig は `"lib": ["ES2024"]` のように DOM を含めずに明示し、`types: ["node"]` で無関係な `@types` の自動読み込みも止める。`document` を仕込むと TS2584 で止まることを確かめてから入れる。

---

<a id="ace-585-1"></a>

### ACE-585-1: 正本から一方向に出力する文書は下流で手編集せず、追記は先に正本へ反映してから正本のマージ後コミットで出力し直す（出力物のバイト照合は Linux か Git オブジェクトで測る）

| Category | architecture | Origin | PR #585 |
| Date | 2026-10-17 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

出力物を下流で手編集すると記録した SHA と食い違い、次の出力で編集が消える。PR #585 では 4 文書のこちら側の追記が正本に入っておらず、正本側も別に進んでいたため、記録時点・下流・正本最新の 3 点で差分を取り、3 方向統合した PR を正本へ先に出してから出力し直した。出力前には計画の差分を読み、正本の記述が下流のゲート（例: markdownlint の bare URL）で止まるなら正本側で直す。未リリースの正本コミットから出力した回は「候補の検証」と記録し、`plugin.json` の版を公開済みの版と読み替えない。バイト照合は CRLF に変換される Windows の作業ツリーではなく、`git show <ref>:<path> | sha256sum` か Linux のクローンで行う。

---

<a id="ace-585-2"></a>

### ACE-585-2: このリポジトリ自身の ACE 昇格例を PATTERNS §14 に置いても、正本からの再出力で外れるので、`/ace-refine` の PATTERNS 昇格（R3-d）の候補は承認しない

| Category | knowledge-management | Origin | PR #585 |
| Date | 2026-10-17 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

このリポジトリの `docs-template/03-implementation/PATTERNS.md` は正本 feelflow-plugins から出力する文書で、正本の汎用テンプレートには配布元自身の昇格例を入れないため、§14 へ昇格させた内容は次の出力で外れる（PR #585 で ACE-001 / ACE-445-1 / ACE-018 / ACE-489-1 の 4 件が外れた。ユーザー合意済み）。`/ace-refine` は PATTERNS.md に ID が無いエントリを毎回昇格の候補に挙げるので、このリポジトリで回すときは R3-d の候補を承認せず、昇格した知見は Playbook のエントリ（active のまま）を正とする。判断の正本は `docs/TEMPLATE_EXPORT.md`。

---

<a id="ace-587-1"></a>

### ACE-587-1: 手動移植した兄弟文書のコード例は、正本の検査成功で代用せず実際の失敗経路を実行する

| Category | testing | Origin | PR #587 |
| Date | 2026-10-17 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

正本のエラー処理を検査しても、手動移植した兄弟文書で消した変数を失敗時だけ参照する欠陥は検出できない。部分的なコード例を構文検査するだけでは、未定義識別子の参照も通る。移植先 Markdown の実コードを抽出して失敗経路を実行し、元のエラー値の保持・ログの内容を検証するとともに、欠陥を戻した変異で検査が赤になることを確かめる。

---

<a id="ace-587-2"></a>

### ACE-587-2: 共通 Logger の契約を外部 Logger の使用例へ移すときは、実装固有の引数形式に合わせて構造化メタデータを渡す

| Category | coding | Origin | PR #587 |
| Date | 2026-10-17 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

共通 Logger が内部で unknown をシリアライズしていても、外部 Logger が同じ引数を同じ構造で記録するとは限らない。外部 Logger を直接使う例では、シリアライズ済みエラーと既知の相関 ID をその実装のメタデータ引数へ明示し、失敗結果には元のエラー値を保持する。失敗した処理から未取得の利用者 ID を捏造せず、実際に Logger へ渡る値を実行検査する。

---

<a id="ace-588-1"></a>

### ACE-588-1: 外部境界では原因だけでなく分類も保持し、不明エラーを内部エラーへ包み直さない

| Category | coding | Origin | PR #588 |
| Date | 2026-10-17 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

不明な外部エラーを内部エラーへ包むと、元の cause が残っていても再試行・フォールバックの禁止分類を失う。外部 SDK / HTTP の境界では正規化してから Result へ返すか再スローし、既存の分類済みエラーは同一値で通す。規則の説明だけでなく、その説明が指すコード例を抽出して禁止経路も実行する。

---

<a id="ace-589-1"></a>

### ACE-589-1: 判定を順に並べた検証関数の自己テストは、各ケースが狙いの判定だけに当たる入力にし、件数ではなく問題文で照合する

| Category | testing | Origin | PR #589 |
| Date | 2026-10-17 |
| Helpful | 1 | Harmful | 0 |
| Status | active |

1 つの入力が複数の判定に当たると、狙いの判定を消しても後段の判定が代わりに問題を出し、「1 件出る」を確かめるテストは緑のまま残る。ある判定を確かめるケースでは、それ以外の判定は満たす入力（参照先は実在させる等）にする。期待値は件数ではなく問題文の一部で照合し、狙いの判定を消す変異で赤になることを確かめる。

---

<a id="ace-589-2"></a>

### ACE-589-2: 非公開の資料から抽出した結果を公開リポジトリへ書くときは、出典の公開状態を先に確かめ、パスや未公開の成果物名をコミットに入れる前に除く

| Category | security | Origin | PR #589 |
| Date | 2026-10-17 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

手元で読めるかどうかは公開状態を示さないので、非公開の資料の内部パスや未公開の成果物名が、Issue コメント・PR 本文・データファイル・コミット本文へそのまま流れる。squash 時にメッセージを書き直しても、PR のコミットには元の本文が残り、コメントの編集履歴も残る。外部の資料を出典として書く前に `gh repo view <owner/repo> --json visibility` で確かめ、PRIVATE なら公開済みの名前（出版物名など）だけで書いてからコミットする（リンクの扱いは [ACE-543-2](#ace-543-2)）。

---

<a id="ace-591-1"></a>

### ACE-591-1: 手順書で禁止している状態は使い捨て fixture で実際に作り、案内している検査コマンドがそれを検出するかを実測してから記述する

| Category | documentation-quality | Origin | PR #591 |
| Date | 2026-10-17 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

「〜してはいけない」という警告が正しくても、同じ手順書が確認手段として挙げる検査コマンドは、その状態を成功として通すことがある。禁止した操作を fixture で再現し、検査コマンドの終了コードと出力、関連する Hook などの判定を記録する。検出できないなら、そのことと代わりの確認方法を手順書に書き、検査側の修正は実装のリポジトリへ起票する。

---

<a id="ace-591-2"></a>

### ACE-591-2: Epic の未達 AC にユーザー判断待ちの工程と今すぐ検証できる工程が混ざるときは、検証できる部分だけを子 Issue に分け、PR は Refs で Epic を開いたまま残す

| Category | process | Origin | PR #591 |
| Date | 2026-10-17 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

保留理由が一部の工程にしかないのに AC を丸ごと待たせると、他の工程も止まる。一方で Epic 全体を 1 PR で扱うと、保留中の工程を独断で進めるか、`Closes` で Epic を誤って閉じる。保留でない部分を子 Issue に切って sub-issue として紐付け、PR は子を `Closes`・Epic を `Refs` にする。結果は「マージ済み・配布済み・利用確認済み・未完了」に分けて Epic に記録し、Epic の該当 AC はチェックしない。

---

<a id="ace-593-1"></a>

### ACE-593-1: 版を明記したツールの制約は、修正が公開リリースのタグに入ったことを確かめてから版別の記述へ書き換え、旧版の挙動は消さずに残す

| Category | documentation-quality | Origin | PR #593 |
| Date | 2026-10-18 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

修正 PR がマージされても、利用者に届くのは公開リリースに入った後であり、旧版を使い続ける利用者には旧記述が正しいままである。リリース日時と修正のマージ日時を比べ、リリースタグ上のコードに修正の識別子があることと、タグから取得した実装で禁止状態の判定を実測する（develop やローカルの plugin cache では測らない）。そのうえで「vX 以降」「vY 以前」の二つに書き分け、復旧手順は両方の版で通る形にする。

---

<a id="ace-598-1"></a>

### ACE-598-1: 適合条件や例外の境界は正本の判定条件そのもので書き、ディレクトリの有無のような近い代理条件に置き換えない

| Category | documentation-quality | Origin | PR #598 |
| Date | 2026-10-18 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

代理条件は一見同じ範囲を指すが、境界の外側で食い違い、正常な構成を試験から落とすか、別の理由で動作を変える実装を合格させる（PR #597 では「`.asdd/` 自体がない」と書き、空の `.asdd/` だけがある未移行構成を C7 から外した）。正本が「どのファイルが残っているか」で判定しているなら、条件文も同じ判定材料で書き、境界上の構成（空ディレクトリ・別用途のファイルだけ）をどちらに含めるかを明記する。同じ状態に至る経路が複数あるなら、経路ごとに前提手順を分けて試験する。

---

<a id="ace-598-2"></a>

### ACE-598-2: 規範の「〜は従来どおり」に例外を足す変更や適合条件を狭める変更は、以前の文面に沿っていた実装を不適合にするので破壊的変更として扱い、同じ規則を書く文書をすべて同じ版区分にそろえる

| Category | documentation-quality | Origin | PR #598 |
| Date | 2026-10-18 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

例外の追記は「説明を足しただけ」に見えるためマイナー扱いにされやすいが、旧文面どおりに作った実装が新文面では違反になるなら既存概念の再定義である（PR #597 は標準仕様・適合条件をマイナーで上げ、Codex がメジャーへの訂正を求めた）。版を決める前に「旧文面に沿った実装が新文面で不合格になるか」を問い、なるならメジャー・`changeImpact: high` にする。同じ規則を書く文書（標準・適合条件・利用者向けガイド）を grep で洗い出し、版の区分と Changelog の理由を一度にそろえる（一部だけ上げると、その文書だけを見る利用者に互換変更と伝わる）。

---

<a id="ace-604-1"></a>

### ACE-604-1: 配布物をコピー方式から更新の届く提供経路へ移すときは、コピー済みの同名旧版が新版より優先されて残るので、コピー指示の撤去と旧コピーの削除案内を同じ変更で行う

| Category | architecture | Origin | PR #604 |
| Date | 2026-10-22 |
| Helpful | 0 | Harmful | 0 |
| Status | active |

利用先へコピーさせたコマンドや手順書は、提供元が別経路（プラグイン等）で新版を出しても同じ名前で呼び出しを受け続け、新版の検査段を持たない古い手順が黙って動く（PR #604 では `.claude/commands/ace-curate.md` が残ると、名前空間なしの `/ace-curate` がプラグインのスキルではなくローカル版に解決される余地があった）。提供経路を移す変更では、自リポジトリの旧コピーを削除し、公開文書のコピー指示を新しい導入手順へ置き換え、既にコピー済みの利用先へ「旧コピーが残っている場合」の扱いを書く。削除の前に、旧コピーにしか無い固有の規則が残っていないかを新版との差分で確かめる。

---

## Changelog

> [1.64.0] 以前の履歴は [PLAYBOOK-CHANGELOG.md](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/08-knowledge/PLAYBOOK-CHANGELOG.md) に移した（PLAYBOOK.md は /ace-setup で配布され、移動先は配置されないため絶対 URL）。

### [1.79.0] - 2026-10-22

#### 追加

- ACE-604-1: 配布物をコピー方式から更新の届く提供経路へ移すときは、同名の旧コピーが新版より優先されて残るので、コピー指示の撤去と旧コピーの削除案内を同じ変更で行う（PR #604）
- domain: 評価済み（候補 0 件）。PR はローカルコマンドの撤去と導入文書の書き換えで、業務ルールの知見を含まない

#### カウンター更新

- ACE-578-1: Helpful 2→3（PR #604 で、PLAYBOOK の但し書き変更に version・updated・changeImpact・版付き Changelog を 1 セットでそろえた）

### [1.78.0] - 2026-10-22

#### 変更

- エントリテンプレート「形式ゲート」の但し書きから、削除した `.claude/commands/ace-curate.md` への言及を外し、ff-dev-toolkit の `/ace-curate` で追記する旨に改めた（エントリ本文・ID・カウンターは変えていない。Issue #603）

### [1.77.0] - 2026-10-18

#### 追加

- ACE-598-1: 適合条件や例外の境界は正本の判定条件そのもので書き、ディレクトリの有無のような近い代理条件に置き換えない（PR #598）
- ACE-598-2: 規範の「〜は従来どおり」に例外を足す変更や適合条件を狭める変更は破壊的変更として扱い、同じ規則を書く文書をすべて同じ版区分にそろえる（PR #598）
- domain: 評価済み（候補 0 件）。PR は方法論の正本の記述整合で、業務ルールの知見を含まない

#### カウンター更新

- ACE-578-1: Helpful 1→2（PR #597 / #598 で、3 文書の version・updated・changeImpact・版付き Changelog を 1 セットで更新した）
- ACE-589-1: Helpful 0→1（PR #598 で、試用シナリオを managed.json だけ・apply.lock だけの 2 ケースに分け、各ケースが狙いの状態だけに当たる前提手順にした）

### [1.76.0] - 2026-10-18

#### 追加

- ACE-593-1: 版を明記したツールの制約は、修正が公開リリースのタグに入ったことを確かめてから版別の記述へ書き換え、旧版の挙動は残す（PR #593）
- domain: 評価済み（候補 0 件）。PR は移行ガイドの版別記述の更新で、業務ルールの知見を含まない

#### カウンター更新

- ACE-578-1: Helpful 0→1（PR #595 で、前の PR が残した `changeImpact: high` をマイナー bump に合わせて `medium` へ置き直した）
- ACE-019: Helpful 2→3（PR #595 で、§4 に追加した設定欠落の例外と食い違う冒頭の無条件の保証へ、同じ例外を明示した）

### [1.75.0] - 2026-10-17

#### 追加

- ACE-591-1: 手順書で禁止している状態は fixture で作り、案内している検査コマンドが検出するかを実測してから記述する（PR #591）
- ACE-591-2: Epic の未達 AC に保留工程が混ざるときは、検証できる部分だけを子 Issue に分け、Epic は Refs で開いたまま残す（PR #591）
- domain: 評価済み（候補 0 件）。PR は方法論文書と配布物の検証で、業務ルールの知見を含まない

### [1.74.0] - 2026-10-17

#### 追加

- ACE-589-1: 判定を順に並べた検証関数の自己テストは、狙いの判定だけに当たる入力にし、問題文で照合する（PR #589）
- ACE-589-2: 非公開資料から抽出した結果を公開リポジトリへ書く前に出典の公開状態を確かめ、内部パスや未公開の成果物名を除く（PR #589）
- domain: 評価済み（候補 2 件）。書籍が参照する URL の不変条件は `scripts/book-referenced-urls.json` と FRONTMATTER_GUIDE §5.5 に反映済みのため Playbook には追記しない

### [1.73.0] - 2026-10-17

#### 追加

- ACE-588-1: 外部境界の正規化では元の cause と禁止分類の両方を保持する（PR #588）。domain 評価済み、候補0件。

#### カウンター更新

- ACE-587-1: Helpful +1（同梱スキルの実コードを抽出し、外部境界を InternalError へ戻す変異も検出した）

### [1.72.0] - 2026-10-17

#### 追加

- ACE-587-1: 手動移植した兄弟文書の実コードも失敗経路を実行し、欠陥を戻した変異で検査する（PR #587）
- ACE-587-2: 外部 Logger の引数形式に合わせて構造化メタデータを渡し、元のエラー値を保持する（PR #587）
- domain: 業務固有の確定知識は対象差分にないため候補 0 件

### [1.71.0] - 2026-10-17

#### 追加

- ACE-584-1: Vitest や tsx は esbuild で変換して実行するだけで型を見ないので、`tsc --noEmit` を品質ゲートの独立した段に置き、型エラーを仕込んだ陽性対照で止まることを確かめる（PR #584）
- ACE-584-2: Node 専用の tsconfig で `lib` を省くと `target` から DOM を含む lib が選ばれ、`document` などが型検査を通って実行時に ReferenceError になるので、`lib` を明示する（PR #584）
- ACE-585-1: 正本から一方向に出力する文書は下流で手編集せず、追記は先に正本へ反映してから正本のマージ後コミットで出力し直す（出力物のバイト照合は Linux か Git オブジェクトで測る）（PR #585）
- ACE-585-2: このリポジトリ自身の ACE 昇格例を PATTERNS §14 に置いても、正本からの再出力で外れるので、`/ace-refine` の PATTERNS 昇格（R3-d）の候補は承認しない（PR #585）

#### カウンター更新

- ACE-559-1: Helpful 0→1（PR #584 で `@types/node` を足したときに lockfile へ混ざった無関係な `libc` 欄の削除 10 か所を戻し、追加分 18 行だけにした）
- ACE-018: Helpful 6→7（PR #585 で、再出力した親文書の段の順序変更に合わせて、出力対象外の子文書 8 件の段番号・前後関係を grep で洗い出して揃えた）
- ACE-580-3: Helpful 0→1（PR #585 で、出力物のバイト照合を CRLF に変換される Windows の作業ツリーではなく Linux のクローンで行った）

### [1.70.0] - 2026-10-16

#### 追加

- ACE-578-1: 文書の索引や Changelog に追記するときは日付付きの追記行で済ませず、version・updated・changeImpact・版付き Changelog の 4 点を同時に揃える（PR #578）
- ACE-578-2: 運用テンプレートの表は、本文が約束した運用（期限の監視・個体の照合）を列だけで回せるかを突き合わせ、多義的な動詞には対象を書く（PR #578）
- ACE-578-3: 公開配布するテンプレートの受け入れ確認では、鍵の接頭辞・長い英数字列・実在の組織名を grep して実値の混入が無いことを機械的に確かめる（PR #578）
- ACE-579-1: 「pre-push がゲートを実行するので手動実行を省いてよい」という規約は、hook が発火しない・回避した・環境要因で実測にならない場合の例外と申告の義務をセットで書く（PR #579）
- ACE-579-2: `fetch` に再試行をかぶせるラッパーは、呼び出し元の `init.signal` を `AbortSignal.any` でタイムアウトと合成し、中断後は再試行せず、読まない本文は cancel する（PR #579）
- ACE-580-1: Git 設定の隔離は Windows でも `NUL` を使わず `/dev/null` と `GIT_CONFIG_NOSYSTEM=1` を併用し、隔離が効いていることは陽性対照付きのテストで実測する（PR #580）
- ACE-580-2: 環境依存の機能（symlink など）は OS 名ではなく実際に試して判定し、skip にするのは想定した失敗（win32 かつ EPERM）だけに限る（PR #580）
- ACE-580-3: `.gitattributes` の LF 固定を拡張子で書くと拡張子の無いフック（`.husky/*`）が漏れる。属性を足した後の既存チェックアウトは `rm <path> && git checkout -- <path>` で取り直す（PR #580）
- ACE-580-4: 受け入れ条件が複数 Issue の和集合でしか実測できないときは 1 PR に束ね、担当ファイルを排他にした並列 worktree で「片方だけ入れたときの残る失敗 = もう片方の担当」を確かめてから統合する（PR #580）
- ACE-580-5: OS のパス区切りは比較する箇所ごとに直さず列挙の時点で一度だけ `/` に揃え、その純粋なユーティリティは import 時に子プロセスを起動するモジュールとは別ファイルに置く（PR #580）
- ACE-581-1: 実ファイルでは違反ゼロを期待する文字列検査は、除外形を行ごとにマスクしてから判定し、検出器を合成入力の自己検証で固定する（同居行・空白無しの隣接・全角終端・散文を含める）（PR #581）
- ACE-581-2: follow-up Issue の「前の PR で修正済み」という記述は検査範囲を狭める理由にせず、拡張した検出器で全件を洗い出してヒットを修正と除外に分類して PR に残す（PR #581）

#### カウンター更新

- ACE-571-1: Helpful 0→1（PR #580 で同じ処方（`git --exec-path` 起点の絶対パスと `path.delimiter`）を 3 テストファイルへ横展開）
- ACE-018: Helpful 5→6（PR #579 で運用ルール変更の同趣旨記述を専門ガイド・PR テンプレート・設計書へ grep で洗い出して同時に揃えた）

### [1.69.0] - 2026-10-16

#### 追加

- ACE-571-1: Windows で子プロセスを起動するテストは、子に渡す PATH から実行ファイルが探されるため、POSIX 形式の PATH を渡すと起動自体に失敗する（PR #571）
- ACE-571-2: 単独で通ったテストを受け入れ条件の根拠にせず、条件が指す実行形態（ゲートの段の全体実行）で測る（PR #571）

### [1.68.0] - 2026-10-16

#### 追加

- ACE-569-1: 構文の壊れたコード例は、構文検査だけでなく Markdown 整形ツールの埋め込み整形からも黙って外れる（PR #569）
- ACE-569-2: Markdown の入れ物（引用・リスト）を自前で解析するときは、始まりと終わりを対で実装し、終わりの側にも回帰テストを置く（PR #569）

### [1.67.0] - 2026-10-16

#### 追加

- ACE-566-1: 前提を満たさないと別の症状で落ちるゲートやテストは、最初の段より前に前提を名指しで検査して止める（PR #566）

### [1.66.0] - 2026-10-16

#### 追加

- ACE-562-1: refine の stale 判定は文書からの引用を見ないため、Archive 候補は現行ルールとして参照されていないかを確かめてから承認する（PR #562）

#### カウンター更新

- ACE-447-2: Helpful 1→2（PR #562 で、配布される PLAYBOOK.md / git-workflow.md から `/ace-setup` が配置しない `playbook/archive/` への相対リンクを Codex connector が指摘し、blob/HEAD の絶対 URL に変えた）
- ACE-484-2: Helpful 1→2（PR #562 で、初期セットの PATTERNS.md から 08-knowledge/ への相対リンクを `distribution-github-templates.test.ts` の判定で事前に検出し、出典を絶対 URL にした）
- ACE-484-3: Helpful 2→3（PR #562 で、Windows の `test:ace-scripts` 77 件の失敗を変更を stash した develop 状態でも再現させ、増えた失敗が 0 件であることで既存破綻と切り分けた）

### [1.65.0] - 2026-10-16

#### 整理（/ace-refine）

- Archived: ACE-003, ACE-005, ACE-006, ACE-007, ACE-008, ACE-009, ACE-010, ACE-011, ACE-013, ACE-015, ACE-017, ACE-024, ACE-026, ACE-027, ACE-028, ACE-030, ACE-031, ACE-032, ACE-033, ACE-036, ACE-037, ACE-038, ACE-039, ACE-040, ACE-041, ACE-043, ACE-441-1, ACE-441-2, ACE-443-1, ACE-447-1, ACE-449-1, ACE-459-2, ACE-460-1, ACE-462-1, ACE-464-1, ACE-464-2, ACE-465-1, ACE-469-1, ACE-469-2, ACE-502-1, ACE-508-1, ACE-508-2, ACE-510-1, ACE-510-2, ACE-516-1, ACE-516-2, ACE-516-3, ACE-519-1, ACE-519-2, ACE-519-3, ACE-526-1, ACE-527-1, ACE-532-1, ACE-533-1, ACE-533-2, ACE-534-1, ACE-535-1, ACE-536-1, ACE-536-2, ACE-537-1, ACE-539-1, ACE-539-2（helpful=0・30日以上参照なし。原文は playbook/archive/ のカテゴリ別ファイルへ verbatim 保全）
- Compacted: ACE-001, ACE-002, ACE-004, ACE-012, ACE-014, ACE-016, ACE-018, ACE-019, ACE-020, ACE-021, ACE-022, ACE-023, ACE-025, ACE-029, ACE-034, ACE-035, ACE-042, ACE-044, ACE-045, ACE-046, ACE-445-1, ACE-447-2, ACE-447-3, ACE-449-2, ACE-449-3, ACE-459-1, ACE-464-3, ACE-465-2, ACE-484-1, ACE-484-2, ACE-484-3, ACE-489-1（旧テーブル形式を正準フォーマットへ要約。原文は playbook/archive/ のカテゴリ別ファイルが正）
- Promoted: ACE-001, ACE-018, ACE-445-1, ACE-489-1（PATTERNS.md §14 へ蒸留。元エントリは live に active のまま残す）
- live の旧テーブル形式が 0 件になったため、legacy-format-allowlist.txt を空にした（Issue #561）
