# PLAYBOOK Archive — ドキュメント (documentation)

> **Parent**: [PLAYBOOK.md](../../PLAYBOOK.md) — アーカイブ済みエントリの保管場所。
> `playbook/archive/` 配下は `ace_entry_count`・カテゴリ件数ゲート・reuse 集計の対象外。
> 参照リンクが切れていた場合はこのディレクトリを ID で grep して探す。
>
> **保全本文内の相対リンクは live 基準**: 各エントリ本文は原文を verbatim 保全しているため、本文中のリンクは live の PLAYBOOK.md（`docs-template/08-knowledge/` 直下）を基準に書かれている。`#ace-xxx` だけのリンクは `../../PLAYBOOK.md#ace-xxx`、`./` や `../` で始まるリンクは `docs-template/08-knowledge/` からの相対パスに読み替えること。このディレクトリから直接辿ると (a) ファイルが存在しない、(b) anchor が無い、(c) **live ではなくアーカイブ済みの複製に着地する**（リンクチェッカーには映らない）のいずれかになる。live のエントリは [PLAYBOOK.md のエントリ一覧](../../PLAYBOOK.md#エントリ一覧) から引くこと。

---

<!-- markdownlint-disable MD051 -->

## アーカイブ済みエントリ

<a id="ace-042"></a>

### ACE-042: テンプレファイル内の同一概念 placeholder は同一シンボル + 大文字で統一する — `XXX`/`NNN`/`xxx` 混在は AI/人のコピペ後置換漏れによる silent rot を誘発する

> Compacted: 2026-10-16（live 側を要約済み。本文の原文は本エントリが正）

| フィールド | 値                          |
| ---------- | --------------------------- |
| Category   | documentation               |
| Origin     | PR #428 / Issue #425        |
| Related    | ACE-014 / ACE-024 / ACE-040 |
| Date       | 2026-05-20                  |
| Helpful    | 1                           |
| Harmful    | 0                           |
| Status     | active                      |

**Insight**: テンプレファイル内で同一概念の placeholder を `XXX`（heading 大文字）/ `xxx`（anchor 小文字）/ `NNN`（guideline 別シンボル）と書き分けると、AI / 人がコピペ後に片方の置換だけ忘れて anchor が壊れる silent rot を誘発する。anchor は ID 文字列の見た目が本物と区別しにくく、`ace-xxx` のまま残っても見落とされやすい。同一概念は **1 文書内で 1 シンボル + 大文字（`XXX` / `NNN` 等「明らかに置換しろ」と読める形）に統一** する。

**Context**: PR #428（Issue #425 anchor 化）で PLAYBOOK.md エントリテンプレに `<a id="ace-xxx"></a>`（lowercase）+ heading `### ACE-XXX:`（uppercase）+ guideline `<a id="ace-NNN"></a>`（uppercase N）の 3 種類の placeholder symbol を混在させた。Copilot review が「コピペ時に `ace-xxx` のまま残り `#ace-001` 等の参照と不一致になる silent rot リスク」を検出。post-merge で Gemini code-assist も別観点（「`NNN` の主語が不明確で `ace-001` 全体を指すかのように読める」）から独立に同じ placeholder 曖昧さを指摘。複数 AI が異なる切り口から同種の構造問題を検出した（[ACE-001](#ace-001) 系の補強）。

**Action**:

1. **同一概念は 1 文書内で同じシンボルに統一**: 「3 桁置換ターゲット」を `XXX` か `NNN` か 1 つに揃える。3 種類混ぜない
2. **シンボルは大文字 + 連続 (`XXX` / `NNN` / `YYY`)**: 小文字 `xxx` は実在の anchor `ace-xxx` と見た目が区別できず誤コピペを誘発する。大文字連続は「明らかに置換せよ」のシグナルとして強い
3. **置換ルールを placeholder の直近に明記**: 「`XXX` は 3 桁数字に置換」と動詞形で書く。「`XXX` は 3 桁ゼロパディング」だけだと、`XXX` が完全形 `ace-001` を指すかと曲解される（Gemini が独立指摘した構造）
4. **複数文書に同じ placeholder 規則を書くなら 1 箇所を SSOT 化、他はポインタ**: 重複させると 1 箇所だけ更新する drift 事故が起きる（[ACE-014](#ace-014) の系。PR #428 では 4 文書重複を Toolkit comment-analyzer が検出）

---
