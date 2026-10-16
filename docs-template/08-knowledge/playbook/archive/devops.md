# PLAYBOOK Archive — DevOps (devops)

> **Parent**: [PLAYBOOK.md](../../PLAYBOOK.md) — アーカイブ済みエントリの保管場所。
> `playbook/archive/` 配下は `ace_entry_count`・カテゴリ件数ゲート・reuse 集計の対象外。
> 参照リンクが切れていた場合はこのディレクトリを ID で grep して探す。
>
> **保全本文内の相対リンクは live 基準**: 各エントリ本文は原文を verbatim 保全しているため、本文中のリンクは live の PLAYBOOK.md（`docs-template/08-knowledge/` 直下）を基準に書かれている。`#ace-xxx` だけのリンクは `../../PLAYBOOK.md#ace-xxx`（リンク先自体がアーカイブ済みならこのディレクトリを ID で grep する）、`./` や `../` で始まるリンクは `docs-template/08-knowledge/` からの相対パスに読み替えること。このディレクトリから直接辿ると (a) ファイルが存在しない、(b) anchor が無い、(c) **live ではなくアーカイブ済みの複製に着地する**（リンクチェッカーには映らない）のいずれかになる。live のエントリは [PLAYBOOK.md のエントリ一覧](../../PLAYBOOK.md#エントリ一覧) から引くこと。

---

<!-- markdownlint-disable MD051 -->

## アーカイブ済みエントリ

<a id="ace-003"></a>

### ACE-003: bash スクリプトは macOS デフォルト環境（bash 3.2）でテストする

> Archived: 2026-10-16 / 理由: helpful=0・30日以上参照なし（/ace-refine）

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | devops               |
| Origin     | PR #319 / Issue #317 |
| Date       | 2026-03-10           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: macOS のデフォルト bash は 3.2（bash 4.0+ が GPLv3 に移行したため Apple が更新を停止）であり、`declare -A`（連想配列）、`head -n -1`（GNU拡張）、`timeout` コマンドなどが使えない。CI環境（Linux, bash 5.x）では動くが macOS では動かないスクリプトが生まれやすい。

**Context**: `multi-review.sh` を連想配列ベースで実装したところ、macOS の bash 3.2 で `declare -A: invalid option` エラーが発生。関数ベースのルックアップに書き直し、`head -n -1` を `sed` に変更、`timeout` を kill ベースフォールバックに変更して解決。

**Action**: bash スクリプトの移植性を確保するには、(1) 連想配列の代わりに case 文/関数ルックアップを使用、(2) GNU 拡張コマンドには POSIX 互換フォールバックを用意、(3) macOS のデフォルト環境で `--dry-run` テストを実施する。shebang は `#!/usr/bin/env bash` のまま、bash 3.2+ 互換コードを書く。

---
