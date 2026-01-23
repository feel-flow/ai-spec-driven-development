# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 MANDATORY: Always Read MASTER.md First

**Before starting any work on this project, you MUST read and understand the contents of `docs-template/MASTER.md`.**

This document contains:
- Project identification and context
- Technical stack and architecture patterns
- Mandatory coding rules and constraints
- AI-specific prompts and guidelines
- Implementation priorities and phases

**Failure to reference MASTER.md will result in incorrect implementations that violate project standards.**

## 🚨 Information Verification Protocol

**CRITICAL RULE: When information is missing, DO NOT make assumptions. Always request confirmation.**

### Required Information Checklist

Before proceeding with any implementation, verify you have:

**Project Fundamentals**:
- [ ] Project name (specific, not generic)
- [ ] Target users (who is this for?)
- [ ] Core features (what does it do?)
- [ ] Technology stack (languages, frameworks, databases)

**Technical Details**:
- [ ] Database type (PostgreSQL? MongoDB? MySQL?)
- [ ] Authentication method (JWT? OAuth? Session?)
- [ ] Deployment environment (AWS? GCP? Azure? Vercel?)
- [ ] API format (REST? GraphQL? gRPC?)

**Requirements**:
- [ ] Performance targets (specific numbers)
- [ ] Security requirements (mandatory safeguards)
- [ ] Scalability needs (concurrent users, data volume)
- [ ] Budget/timeline constraints

### Confirmation Template

When missing information, output in this format:

```markdown
⚠️ Missing Information - Confirmation Required

I need clarification on the following before proceeding:

[Required Confirmations]
1. Database Type
   - Why needed: PostgreSQL and MongoDB require fundamentally different designs
   - Options: 
     * PostgreSQL (recommended for relational data)
     * MongoDB (recommended for document-oriented data)
     * MySQL (recommended for simplicity)
   - Please specify: Which database do you want to use?

2. [Other missing info]
   ...

[Optional Confirmations (Can proceed with assumptions)]
1. Test Coverage Target
   - Assumption: 80% minimum coverage
   - Risk: May need adjustment based on project criticality
   - Confirm if different: Yes/No

[Next Steps]
After confirmation, please instruct: "Proceed with [confirmed details]"
```

### Allowed Assumptions (Must Be Stated)

These defaults can be assumed if not specified, but **must be explicitly stated**:

- ✅ TypeScript strict mode: Enabled (stating this)
- ✅ Test coverage: 80%+ target (stating this)
- ✅ No magic numbers: Strictly enforced (stating this)
- ✅ Error handling: Result pattern (stating this)
- ✅ Naming conventions: Per MASTER.md (stating this)

### Examples of Good vs Bad Practice

❌ **Bad - Making Assumptions**:
```
"Since you didn't specify a database, I'll use PostgreSQL as it's common."
→ User wanted MongoDB, entire design needs rework
```

✅ **Good - Requesting Confirmation**:
```
"I notice the database type wasn't specified. Please choose:
1. PostgreSQL (best for relational data, ACID compliance)
2. MongoDB (best for flexible schemas, document storage)
3. MySQL (best for simplicity, wide support)

Which would you prefer for this project?"
```

For complete details, see `docs-template/MASTER.md` section "Information Verification Protocol".

---

## Project Overview

This repository contains a comprehensive guide and template system for AI-driven development documentation strategy. It demonstrates how to optimize documentation for AI development tools (Claude Code, GitHub Copilot, Cursor) through a streamlined 7-document structure instead of traditional 60+ document approaches.

**Key Concept**: The project advocates for "less is more" - fewer, highly-focused documents that AI tools can effectively parse and understand, rather than sprawling documentation that becomes counterproductive.

## Architecture & Document Structure

This project implements an AI-optimized documentation framework with 7 core documents:

1. **MASTER.md** - Central coordination document containing project identification, tech stack, coding rules, and AI prompts
2. **PROJECT.md** - Vision, requirements, stakeholder analysis, and business objectives  
3. **ARCHITECTURE.md** - System design, component architecture, and technical decisions
4. **DOMAIN.md** - Business logic, domain models, entities, and business rules
5. **PATTERNS.md** - Implementation patterns, coding standards, and best practices
6. **TESTING.md** - AI-driven testing strategies, test patterns, and automation approaches
7. **DEPLOYMENT.md** - Release strategies, CI/CD pipelines, and operational procedures

## Key Principles Implemented

### Anti-Magic Number Policy
The project enforces strict prohibition of magic numbers/hardcoded values:
- All meaningful values must be extracted to named constants
- Configuration values injected via environment variables or settings
- Units (ms, KB, etc.) and valid ranges must be documented
- Constants organized by architectural layer (Domain/Application/Infrastructure)

### File Size Guidelines  
- Soft limit: 500 lines per file
- Hard limit: 800 lines (exceptions for generated code, schemas)
- Automatic splitting recommended when limits exceeded
- Linter configurations provided for enforcement

### AI-First Development
- Documentation optimized for AI tool comprehension
- Structured templates for consistent AI interaction
- Prompt assistance included for magic number avoidance
- Code generation rules emphasize type safety and error handling

## Development Approach

This is a **documentation-only project** with no executable code. The focus is on:
- Template creation and refinement
- Documentation strategy research
- Best practice compilation
- Real-world pattern validation

### Working with This Repository

When making changes:
1. Understand the AI-optimization principles in `ai_spec_driven_development.md`
2. Follow the 7-document structure templates
3. Maintain consistency with the established patterns
4. Keep magic number prohibition guidelines updated
5. Ensure all examples remain practical and actionable

## Special Considerations

- **No build/test commands** - This is a pure documentation project
- **Version control** - All changes should maintain the integrity of the 7-document system
- **Examples** - All code examples should demonstrate anti-magic number practices
- **Templates** - Maintain template sections as placeholders for actual project adaptation

## Document Relationships

```
MASTER.md (Central Hub)
├── PROJECT.md (Business Layer)  
├── ARCHITECTURE.md (Technical Layer)
├── DOMAIN.md (Business Logic Layer)
├── PATTERNS.md (Implementation Layer)
├── TESTING.md (Quality Layer)
└── DEPLOYMENT.md (Operations Layer)
```

Each document serves a specific AI-readable purpose while maintaining cross-references to others, creating a coherent information architecture that LLMs can effectively navigate and utilize.

## Usage Notes for AI Tools

- Prioritize reading MASTER.md first for project context
- Reference PATTERNS.md for coding standards and anti-magic number enforcement  
- Use ARCHITECTURE.md for technical design decisions
- Apply DOMAIN.md for business rule validation
- Follow TESTING.md for quality assurance patterns
- Consult DEPLOYMENT.md for operational requirements

This structure enables AI tools to quickly locate relevant information without parsing through dozens of scattered documents.

---

## 📚 Book Writing Git Workflow

本の執筆タスクは、以下のGit Workflowに従って作業を行うこと。

### Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Issue作成 → 2. ブランチ作成 → 3. プラン作成                   │
│       ↓                                                          │
│  4. 実装 → 5. 自己レビュー → 6. PR作成                           │
│       ↓                                                          │
│  7. レビュー（/proofread自動実行）                                │
│       ↓                                                          │
│  8. 指摘対応 → 9. 再レビュー（ループ）                            │
│       ↓                                                          │
│  10. マージ可能 → ユーザー確認 → 11. マージ → 12. クリーンナップ   │
└─────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Process

#### 1. Issue作成
- タスクの内容を明確にしたIssueをGitHubに作成
- 適切なラベルを付与

#### 2. ブランチ作成
- Issue番号を含むブランチ名で作成
- 命名規則: `feature/#<issue番号>-<簡潔な説明>`
- 例: `feature/#42-add-chapter3-section`

#### 3. プラン作成
- 複雑なタスクの場合は `EnterPlanMode` でプランを作成
- ユーザー承認を得てから実装開始

#### 4. 実装
- 執筆・編集作業を実施
- 小さな単位でコミット

#### 5. 自己レビュー（Pre-commit）
- コミット前に内容を確認
- 明らかなミスを修正

#### 6. PR作成
- `/commit-push-pr` または個別コマンドでPR作成
- **※ PR作成後、hookにより自動的に校正レビューが促される**

#### 7. レビュー（文章校正）
- `/proofread` スキルを実行
- 日本語・構造・用語・Markdown・ファクトチェックを実施

#### 8. 指摘対応
- レビュー結果に基づき修正を実施
- 対応可能な指摘はすべて対応

#### 9. 再レビュー
- 修正完了後、再度 `/proofread` を実行
- 問題がなくなるまで 8-9 を繰り返す

#### 10. マージ確認
- すべての指摘に対応完了後、**必ずユーザーに確認を取る**
- 「マージしてよろしいですか？」と確認

#### 11. マージ
- ユーザー承認後にPRをマージ

#### 12. クリーンナップ
- `/clean_gone` でマージ済みブランチを削除
- developブランチに戻る

### Available Commands

| ステップ | 使用するスキル/コマンド |
|---------|----------------------|
| コミット | `/commit` |
| コミット→PR一括 | `/commit-push-pr` |
| 文章校正（総合） | `/proofread` |
| 構造チェック | `/proofread-structure` |
| ファクトチェック | `/proofread-facts` |
| 用語抽出 | `/extract-terms` |
| ブランチクリーンナップ | `/clean_gone` |

### Important Rules

1. **PRマージ前には必ずユーザー確認を取ること**
2. **レビュー指摘は可能な限りすべて対応すること**
3. **ブランチはマージ後に必ずクリーンナップすること**
4. **大きな変更は複数のPRに分割すること**

---

## 🎨 書籍「ai-small-is-accurate」挿絵ルール

### キャラクター使用ルール

本書籍の挿絵・図解には、以下の2キャラクターを使用すること。

**公式キャラクターデザイン**: `books/ai-small-is-accurate/images/characters.png` を参照

#### AI侍（あいさむらい）
- **役割**: 知識を授ける師匠キャラ
- **外見**:
  - ひげを生やした中年男性
  - グレー/ダークグレーの着物
  - 腰に刀を差している
  - 自信満々でニッコリした笑顔
  - ちびキャラ（2〜3頭身）スタイル
- **セリフ調**: 「〜である」「〜なのだ」「わしは〜」など武士言葉

#### DJ町娘（でぃーじぇーまちむすめ）
- **役割**: 読者代理、学ぶ側のキャラ
- **外見**:
  - 若い女性
  - オレンジ/金色の着物（花柄）
  - 白いヘッドフォン着用
  - かわいらしい笑顔、明るい表情
  - ちびキャラ（2〜3頭身）スタイル
- **セリフ調**: 「〜ですか？」「なるほど！」「〜ですね✨」など明るく素直

### 挿絵作成ガイドライン

#### キャラクター付き挿絵（シーン・比喩の説明）
1. **比喩やシーンの説明**: AI侍とDJ町娘を登場させる
2. **概念説明**: AI侍が解説、DJ町娘が質問や驚きのリアクション
3. **スタイル**: 公式デザインに準拠したちびキャラスタイル
4. **配色**: テックブルー背景 ＋ キャラクターの暖色

#### 図解・チャート（データ・グラフ）
1. **キャラクターは使わない**: シンプルなインフォグラフィック
2. **棒グラフ、折れ線、フローチャート等**: クリーンでプロフェッショナルなスタイル
3. **配色**: グリーン→ブルー→イエロー→オレンジ（良→悪のグラデーション）
4. **日本語ラベル**: タイトル、軸、注釈は日本語で

### 画像生成プロンプトの例

```text
Educational illustration with two chibi-style Japanese characters.

AI侍: Bearded middle-aged samurai in dark gray kimono with katana at waist,
confident smile, 2-3 head proportion chibi style.

DJ町娘: Young girl in orange/gold floral kimono with white headphones,
cheerful expression, 2-3 head proportion chibi style.

[場面の説明]

Style: Cute chibi anime style matching the reference design,
tech-blue background, warm character colors.
```

### 重要

**画像生成時は必ず以下の手順を踏むこと：**

1. **参照画像を渡して生成**: `books/ai-small-is-accurate/images/characters.png` をGemini APIに参照画像として渡す
2. **本文への差し込み**: 生成後、Markdownファイルに `![alt](./画像名.png)` で画像参照を追加
3. **コメントのプロンプトは削除**: 画像生成用コメント（`<!-- -->`）は実際の画像に置き換える

### 画像生成コード例

```python
import google.generativeai as genai

# 公式キャラクター画像を参照として渡す
character_image = genai.upload_file("books/ai-small-is-accurate/images/characters.png")

prompt = """Using the exact character designs from the reference image, create...
[場面の説明]
"""

response = model.generate_content([prompt, character_image])
```