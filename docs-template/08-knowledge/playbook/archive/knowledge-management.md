# PLAYBOOK Archive — ナレッジ管理 (knowledge-management)

> **Parent**: [PLAYBOOK.md](../../PLAYBOOK.md) — アーカイブ済みエントリの保管場所。
> `playbook/archive/` 配下は `ace_entry_count`・カテゴリ件数ゲート・reuse 集計の対象外。
> 参照リンクが切れていた場合はこのディレクトリを ID で grep して探す。
>
> **保全本文内の相対リンクは live 基準**: 各エントリ本文は原文を verbatim 保全しているため、本文中のリンクは live の PLAYBOOK.md（`docs-template/08-knowledge/` 直下）を基準に書かれている。`#ace-xxx` だけのリンクは `../../PLAYBOOK.md#ace-xxx`、`./` や `../` で始まるリンクは `docs-template/08-knowledge/` からの相対パスに読み替えること。このディレクトリから直接辿ると (a) ファイルが存在しない、(b) anchor が無い、(c) **live ではなくアーカイブ済みの複製に着地する**（リンクチェッカーには映らない）のいずれかになる。live のエントリは [PLAYBOOK.md のエントリ一覧](../../PLAYBOOK.md#エントリ一覧) から引くこと。

---

<!-- markdownlint-disable MD051 -->

## アーカイブ済みエントリ

<a id="ace-036"></a>

### ACE-036: 外部知見（SNS / ブログ / 社内 wiki）を Playbook に取り込む前に既存 ACE エントリ全件と grep 照合する

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | knowledge-management |
| Origin     | PR #420              |
| Related    | ACE-018 / ACE-023    |
| Date       | 2026-05-19           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 外部の SNS / ブログ / 公式ドキュメント等で見つけた「実装パターン」を Playbook に取り込む前に、既存 ACE エントリのタイトル + Insight 行を全件 grep 照合する。これがないと (a) 既存知見の細分化（同じ insight を別エントリで再記述）、(b) 矛盾する推奨の併存、(c) Related フィールドへの相互リンク漏れ が起きる。

**Context**: PR #420 で Anthropic エンジニアが SNS で公開した implementation-notes.md 並走パターンを取り込む際、ACE-001〜033 を `grep -niE "implementation|notes|decision|tradeoff"` で照合し未抽出と確認。さらに「気付いた瞬間に書く」観点で ACE-032（撤去後の論理連鎖切れ）と類似性があり、Related フィールドに ACE-032 を追加。grep 照合せずに新規追加だけしていたら、ACE-009（Issue spec 曖昧さ）や ACE-023（事実主張は 1 次情報照合）との関連付けも漏れた可能性がある。ACE-018 が「自リポ内の横断的番号変更時の事前 grep」を扱うのに対し、本 Insight は「外部知見取り込み時の事前 grep」を扱う相補的知見。

**Action**:

1. **取り込み前に grep キーワードを決めて全件照合**: 外部パターンの中心概念を 3〜5 個のキーワードに分解 → `grep -niE "kw1|kw2|kw3" docs-template/08-knowledge/PLAYBOOK.md`
2. **照合結果は「重複 / 類似 / 関連 / 新規」の 4 段階で分類**: 「類似」「関連」は Related フィールドへの相互リンクで処理、「重複」は Helpful +1、「新規」のみ新エントリ作成
3. **Issue 起票時点で grep 照合結果を本文に書く**: 「既存 ACE-XXX と類似だが観点が違う」など根拠を明示 → レビュアーが「これは別エントリで正しいか」を判断できる
4. **Related フィールドへの相互リンクは執筆過程で発見した類似性も含める**: ACE-034 で執筆中に気付いた ACE-032 との類似は当初の Issue 本文には無く、執筆中に発覚 → Related に追加した実例

---

<a id="ace-037"></a>

### ACE-037: ACE エントリの新規追加は対応する運用手順（workflow / self-review / ace-cycle）への組み込みを同 PR で済ませる

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                          |
| ---------- | --------------------------- |
| Category   | knowledge-management        |
| Origin     | PR #420                     |
| Related    | ACE-014 / ACE-031 / ACE-034 |
| Date       | 2026-05-19                  |
| Helpful    | 0                           |
| Harmful    | 0                           |
| Status     | active                      |

**Insight**: ACE Playbook に新規エントリを追加する PR では、対応する運用手順（`git-workflow.md` / `self-review.md` / `ace-cycle.md` / `workflow-principles.md` 等）への組み込みも同 PR で済ませる。Playbook に書いてあるだけで運用フックに組み込まれない ACE は「死蔵知見」になり、Helpful カウンターが永久にゼロのまま蓄積する。

**Context**: PR #420 で ACE-034 を追加する際、当初は「Playbook 追加のみ」のスコープも検討したが、概念知見と運用手順はセットで効くため 1 PR で `docs-template/05-operations/deployment/git-workflow.md`（ステップ3 Implement）/ `docs/AI_GIT_WORKFLOW.md`（同）/ `ace-cycle.md`（Phase 1 対象データ）の 3 ドキュメントに組み込んだ。Copilot レビューで Action 4 が指す raw material 取得経路の整合性が指摘されたが、これは「組み込みが片手落ち（ace-cycle.md に PR description が無かった）」ためで、本 Insight の重要性を裏付ける具体例になった。組み込みを全て同 PR で済ませると Copilot のような cross-model reviewer が「整合性チェック」を一気に通せる。

**Action**:

1. **新規 ACE 起票時に「組み込み先候補」を Issue 本文にリストする**: `git-workflow.md` / `self-review.md` / `ace-cycle.md` / `workflow-principles.md` / `PATTERNS.md` / `TESTING.md` のどれに組み込むか or 組み込み不要か を着手前に判定
2. **「組み込み不要」と判断した場合はその理由を Issue に明記**: 後から見た人が「なぜ Playbook だけに残されたのか」を理解できる
3. **組み込みが多数のドキュメントにまたがる場合は ACE-014 の SSOT 原則を遵守**: 1 箇所に詳細、他は誘導リンクのみ
4. **PR レビューで「運用手順との整合性」指摘が出たら本 Insight の発動サイン**: 「組み込み忘れ」ではなく「組み込み計画段階の漏れ」として再発防止を考える（実装後の追記ではなく Issue 段階で判定する）

---
