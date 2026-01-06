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

- 公式サイト: https://agents.md
- GitHub: https://github.com/agentsmd/agents.md
- OpenAI Codexガイド: https://developers.openai.com/codex/guides/agents-md/

---

## ツール別設定ファイル一覧

| ツール | 設定ファイル | AGENTS.md対応 |
|--------|-------------|:-------------:|
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

Claude CodeはAGENTS.md標準に **対応していません**。`CLAUDE.md`のみを読み込みます。

複数のAIツールを併用する場合は、`CLAUDE.md`と`AGENTS.md`の両方を用意することを推奨します。

### Google Antigravityの特徴

Google Antigravity（2025年11月リリース）は、Googleが提供するエージェント型開発プラットフォームです。

- **グローバル設定**: `~/.gemini/GEMINI.md` に個人の設定を記述
- **AGENTS.md対応**: リポジトリルートのAGENTS.mdも読み込み可能
- **アーティファクト機能**: Google Docsスタイルのコメントでエージェントにフィードバック可能

詳細: [Google Antigravity 公式ドキュメント](https://antigravity.google/docs/home)

### Kiro（AWS）の特徴

Kiro（2025年7月リリース）は、AWSが提供する仕様駆動開発に特化したエージェント型IDEです。

- **Steeringファイル**: `.kiro/steering/*.md` でプロジェクト固有のルールを定義
- **AGENTS.md対応**: AGENTS.mdも読み込み可能（ただし inclusion modes は非対応）
- **Spec駆動**: `requirements.md`, `design.md`, `tasks.md` による仕様管理
- **Foundation files**: `product.md`, `tech.md`, `structure.md` でプロジェクトコンテキストを提供

詳細: [Kiro 公式ドキュメント](https://kiro.dev/docs/steering/)

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

### 各ツールの公式ドキュメント

- [Google Antigravity](https://antigravity.google/docs/home)
- [Kiro (AWS)](https://kiro.dev/docs/)
- [Cursor Rules](https://docs.cursor.com/)
- [GitHub Copilot Instructions](https://docs.github.com/en/copilot)
