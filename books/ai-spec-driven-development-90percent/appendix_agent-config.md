# 付録：AIエージェント設定ファイル一覧

> **注意**: この情報は2026年1月6日時点の調査結果です。AIコーディングツールの仕様は頻繁に更新されるため、最新情報は各ツールの公式ドキュメントを確認してください。

---

## AGENTS.mdとは

**AGENTS.md** は、AIコーディングエージェント向けのオープンスタンダードです。

- **Linux Foundation傘下のAgentic AI Foundation** が管理
- **20,000以上のリポジトリ** で採用（2025年時点）
- GitHub Copilot, Cursor, OpenAI Codex等の主要ツールが対応

AGENTS.mdは「AIエージェント向けのREADME」として設計されています。README.mdが人間向けの説明であるのに対し、AGENTS.mdはAIが効率的にコードを理解・生成するための指示を記述します。

### 公式リソース

- 公式サイト: <https://agents.md>
- GitHub: <https://github.com/agentsmd/agents.md>
- OpenAI Codexガイド: <https://developers.openai.com/codex/guides/agents-md/>

---

## ツール別設定ファイル一覧

| ツール | 設定ファイル | AGENTS.md対応 |
| ------ | ----------- | :-----------: |
| Claude Code | `CLAUDE.md` | ❌ |
| GitHub Copilot | `.github/copilot-instructions.md`, `AGENTS.md` | ✅ |
| OpenAI Codex | `AGENTS.md`, `SKILL.md` | ✅ |
| Cursor | `AGENTS.md`, `.cursor/rules/*.mdc` | ✅ |
| Windsurf | `AGENTS.md`, Cascade Rules | ✅ |
| Gemini CLI | `AGENTS.md` | ✅ |
| Google Antigravity | `~/.gemini/GEMINI.md`, `AGENTS.md` | ✅ |
| Kiro (AWS) | `.kiro/steering/*.md`, `AGENTS.md` | ✅ |
| Cline | `.clinerules` | - |
| Factory/Droid | `AGENTS.md`, `.factory/droids/*.md` | ✅ |

### Claude Codeの注意点

Claude CodeはAGENTS.md標準に **ネイティブ対応していません**。`CLAUDE.md`のみを読み込みます。

**ワークアラウンド**: `CLAUDE.md`内でAGENTS.mdを参照するよう記述すれば、間接的に読み込ませることは可能です。

```markdown
# CLAUDE.md

このリポジトリのルールは AGENTS.md に記載されています。
実装前に必ず AGENTS.md を読んでください。
```

**Agent Skills**: AnthropicはAGENTS.mdの代わりに独自の「Agent Skills」システムを開発しています。`SKILL.md`ファイルを使用し、Claude.ai、Claude Code、Claude Agent SDKで利用可能です。

複数のAIツールを併用する場合は、`CLAUDE.md`と`AGENTS.md`の両方を用意することを推奨します。

### Google Antigravityの特徴

Google Antigravity（2025年11月リリース）は、Googleが提供するエージェント型開発プラットフォームです。

- **グローバル設定**: `~/.gemini/GEMINI.md` に個人の設定を記述
- **AGENTS.md対応**: リポジトリルートのAGENTS.mdも読み込み可能
- **アーティファクト機能**: Google Docsスタイルのコメントでエージェントにフィードバック可能

### Kiro（AWS）の特徴

Kiro（2025年7月リリース）は、AWSが提供する仕様駆動開発に特化したエージェント型IDEです。

- **Steeringファイル**: `.kiro/steering/*.md` でプロジェクト固有のルールを定義
- **AGENTS.md対応**: AGENTS.mdも読み込み可能（ただし inclusion modes は非対応）
- **Spec駆動**: `requirements.md`, `design.md`, `tasks.md` による仕様管理
- **Foundation files**: `product.md`, `tech.md`, `structure.md` でプロジェクトコンテキストを提供

---

## 7文書との連携

### 基本方針

AIエージェント設定ファイルには、**7文書への参照を明記**します。これにより、AIは自動的に仕様を参照してからコードを生成します。

### Claude Code向け（CLAUDE.md）

```markdown
# CLAUDE.md

## プロジェクト概要

このリポジトリでは docs/ 配下の7文書に仕様が記載されています。

## 必読ドキュメント

実装前に必ず以下を読んでください：

1. [docs/MASTER.md](docs/MASTER.md) - プロジェクト全体の索引
2. [docs/03-implementation/PATTERNS.md](docs/03-implementation/PATTERNS.md) - 実装パターン

## コーディングルール

- マジックナンバー禁止（定数化必須）
- エラーハンドリングはResult型を使用
- テストカバレッジ80%以上を維持

## Git運用

- コミットメッセージはConventional Commits形式
- PRはdevelopブランチにマージ
```

### AGENTS.md対応ツール向け

```markdown
# AGENTS.md

## Project Context

This repository uses a 7-document structure under docs/.
Always read docs/MASTER.md before implementing any feature.

## Build & Test

- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`

## Coding Standards

- No magic numbers (use named constants)
- Error handling with Result type
- Maintain 80%+ test coverage

## PR Guidelines

- Target branch: develop
- Use Conventional Commits format
- Include issue number in PR title
```

---

## モノレポでの運用

AGENTS.mdはモノレポ構成にも対応しています。

各パッケージに個別のAGENTS.mdを配置すると、**最も近いファイルが優先**されます。

```text
monorepo/
├── AGENTS.md              # リポジトリ全体のルール
├── packages/
│   ├── frontend/
│   │   └── AGENTS.md      # フロントエンド固有のルール
│   └── backend/
│       └── AGENTS.md      # バックエンド固有のルール
└── docs/
    └── MASTER.md
```

---

## 参考リンク

### AGENTS.md関連

- [AGENTS.md 公式サイト](https://agents.md)
- [GitHub agentsmd/agents.md](https://github.com/agentsmd/agents.md)
- [OpenAI Codex AGENTS.mdガイド](https://developers.openai.com/codex/guides/agents-md/)
- [InfoQ: AGENTS.md Emerges as Open Standard](https://www.infoq.com/news/2025/08/agents-md/)

### 各ツールの公式リリース・ドキュメント

| ツール | 公式リリース | ドキュメント |
| ------ | ----------- | ----------- |
| Claude Code | [Claude 3.7 Sonnet and Claude Code](https://www.anthropic.com/news/claude-3-7-sonnet) | [Claude Code Docs](https://code.claude.com/docs/) |
| GitHub Copilot | [Coding Agent for GitHub Copilot](https://github.com/newsroom/press-releases/coding-agent-for-github-copilot) | [GitHub Copilot Docs](https://docs.github.com/en/copilot) |
| OpenAI Codex | [Codex is now generally available](https://openai.com/index/codex-now-generally-available/) | [Codex Changelog](https://developers.openai.com/codex/changelog/) |
| Cursor | [Cursor 2.0](https://cursor.com/blog/2-0) | [Cursor Docs](https://docs.cursor.com/) |
| Windsurf | [Windsurf Launch](https://windsurf.com/blog/windsurf-launch) | [Windsurf Changelog](https://windsurf.com/changelog) |
| Gemini CLI | [Introducing Gemini CLI](https://blog.google/technology/developers/introducing-gemini-cli-open-source-ai-agent/) | [Gemini CLI Docs](https://geminicli.com/docs/) |
| Google Antigravity | [Build with Google Antigravity](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/) | [Antigravity Docs](https://antigravity.google/docs/home) |
| Kiro (AWS) | [Kiro Launch](https://kiro.dev/blog/introducing-kiro-cli/) | [Kiro Docs](https://kiro.dev/docs/) |
| Cline | [GitHub cline/cline](https://github.com/cline/cline) | [Cline Docs](https://docs.cline.bot/) |
| Factory/Droid | [Factory is GA](https://factory.ai/news/factory-is-ga) | [Factory Docs](https://factory.ai/) |
