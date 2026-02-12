# /setup-ai-config — AI開発ツール設定ファイル生成

プロジェクトの `docs/` を基に、各AI開発ツール向けの設定ファイルを生成します。

## 対象ツール

| ツール | 生成ファイル | 配置場所 |
|--------|-------------|---------|
| Claude Code | `CLAUDE.md` | プロジェクトルート |
| Cursor | `.cursorrules` | プロジェクトルート |
| GitHub Copilot | `.github/copilot-instructions.md` | `.github/` |

## 手順

### 1. 既存ドキュメントの読み取り

以下のファイルを読み取り、プロジェクト情報を抽出します:

- `docs/MASTER.md` — プロジェクト識別、技術スタック、ルール
- `docs/01-context/PROJECT.md` または `docs/01-business/PROJECT.md` — 要件
- `docs/02-design/ARCHITECTURE.md` — アーキテクチャ
- `docs/03-implementation/PATTERNS.md` — コーディング規約

ファイルが見つからない場合は、ユーザーに情報を確認してください。

### 2. 生成するツールの選択

AskUserQuestion を使用して、どのツール向けの設定を生成するか確認します:

- **Claude Code (CLAUDE.md)** — 推奨
- **Cursor (.cursorrules)**
- **GitHub Copilot (.github/copilot-instructions.md)**
- **すべて**

### 3. CLAUDE.md の生成

以下のセクションを含む `CLAUDE.md` を生成します:

```markdown
# CLAUDE.md

## MANDATORY: Always Read MASTER.md First
[MASTER.md への参照指示]

## Project Overview
[docs/MASTER.md から抽出]

## Architecture
[docs/02-design/ARCHITECTURE.md から要約]

## Coding Standards
[docs/03-implementation/PATTERNS.md から抽出]
- 命名規則
- エラーハンドリング方針
- マジックナンバー禁止ルール

## Build Commands
[プロジェクトの package.json / Makefile 等から検出]

## Development Workflow
[docs/05-operations/ から抽出、なければデフォルト]

## Information Verification Protocol
[MASTER.md の確認プロトコルをそのまま含める]
```

### 4. .cursorrules の生成

以下の構造で `.cursorrules` を生成します:

```markdown
# Project Rules for Cursor

## Language
[プロジェクトの主要言語]

## Project Context
[PROJECT.md からの要約]

## Coding Standards
[PATTERNS.md からの抽出]

## Architecture
[ARCHITECTURE.md からの要約]

## Important Rules
- Always read docs/MASTER.md first for project context
- Follow the coding standards in docs/03-implementation/PATTERNS.md
- Never use magic numbers — extract to named constants
- Always verify information before generating code
```

### 5. copilot-instructions.md の生成

以下の構造で `.github/copilot-instructions.md` を生成します:

```markdown
# GitHub Copilot Instructions

## Project Overview
[PROJECT.md からの要約]

## Technology Stack
[MASTER.md からの技術スタック]

## Coding Standards
[PATTERNS.md からの抽出]

## Key Architecture Decisions
[ARCHITECTURE.md からの要約]

## Reference Documents
- docs/MASTER.md — Central coordination document
- docs/01-context/PROJECT.md — Project vision and requirements
- [その他のドキュメントリンク]
```

### 6. 完了報告

生成したファイルの一覧と、各ファイルの要約を表示してください。

## 重要ルール

- 既存ファイルがある場合は上書き前に必ず確認すること
- docs/ の内容を正確に反映すること（推測で情報を追加しない）
- CLAUDE.md には必ず「情報不足時の確認プロトコル」を含めること
- 各ツール固有のフォーマットや慣習に従うこと
- 生成後、ファイルの内容をユーザーに確認してもらうこと
