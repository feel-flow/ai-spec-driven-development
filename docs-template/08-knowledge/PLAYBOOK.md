---
title: "PLAYBOOK"
version: "1.67.0"
status: "approved"
created: "2026-03-10"
updated: "2026-10-16"
owner: "@fffokazaki"
changeImpact: "medium"
ace_entry_count: 51
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
- **形式ゲート**: ff-dev-toolkit の `/ace-curate` 手順 4-f が実行する `check-entry-format.ts` が、PLAYBOOK.md と同階層の `legacy-format-allowlist.txt` に無い旧形式エントリを見つけると exit 1 でブロックする（allowlist 不在なら strict）。このリポジトリ同梱の `.claude/commands/ace-curate.md` には形式ゲート実行段は無い。**新規追記のために allowlist へ ID を足さない**

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
| Helpful | 5 | Harmful | 0 |
| Status | active |

番号・順序の横断変更は、想定の 2〜3 倍のファイルに散らばっている（PR #397 では想定 6 ファイルが実際は 10 ファイル）。番号への直接参照・順序の散文・状態の説明（「マージ前」等）・メタデータ・段階数への言及は、意味が等価でも字面が違うため、1 種類の grep キーワードでは拾いきれない。着手前に意味的に等価な複数の grep パターンで対象を全部列挙して作業リストに登録し、ナビゲーション表・対応表も対象に含め、「旧表現の grep ヒットなし」を受け入れ条件に書く（経緯として意図的に旧表現を残す注記は除外する）。

---

<a id="ace-019"></a>

### ACE-019: 既存ルール違反になる新パターンは「例外」として明示的に名乗らせる

| Category | process | Origin | PR #397 / Issue #396 |
| Related | ACE-012（修正対象） |
| Date | 2026-05-06 |
| Helpful | 2 | Harmful | 0 |
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
| Helpful | 0 | Harmful | 0 |
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

## Changelog

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
