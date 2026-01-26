# GitHub Copilot Instructions

## � はじめに

このファイルはGitHub Copilot固有の設定を記載しています。

**全AIエージェント共通のルールは [`AGENTS.md`](../AGENTS.md) を参照してください。**

- 情報確認プロトコル
- MASTER.md参照ルール
- 書籍執筆Git Workflow
- 挿絵ルール
- 校正レビュー指示

これらはすべて AGENTS.md に記載されています。

---

## 🚨 MANDATORY: Read MASTER.md and AGENTS.md First

Before generating any code suggestions:
1. **Read `AGENTS.md`** for common AI agent guidelines
2. **Read `docs-template/MASTER.md`** for project-specific requirements

## Project Context
This is an AI-driven development project using a streamlined 7-document structure optimized for AI tools. The project emphasizes "less is more" - fewer, highly-focused documents that AI can effectively parse and understand.

## Key Constraints from MASTER.md

### Type Safety
- Use TypeScript with strict type safety
- No `any` types (use `unknown` or proper types)
- Explicit type definitions for all variables, functions, and API responses

### Code Quality
- No magic numbers/hardcoded values (use named constants)
- No `console.log` in production code
- No unused imports or variables
- No error swallowing (always handle errors properly)
- Functions should be under 30 lines

### Naming Conventions
- Variables: camelCase (e.g., `userName`, `isActive`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- Types/Interfaces: PascalCase (e.g., `UserProfile`, `ApiResponse`)

### Error Handling
- Use Result pattern for error handling
- Implement try-catch blocks with proper error messages
- Log errors with structured logging

### Testing
- Generate unit tests for all functions (80%+ coverage target)
- Use AAA pattern (Arrange-Act-Assert)
- Mock dependencies appropriately

## Architecture Patterns
- Clean Architecture
- Repository Pattern
- CQRS (Command Query Responsibility Segregation)
- Event-Driven Architecture
- Dependency Injection

## Security Requirements
- Input sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Proper authentication/authorization
- HTTPS usage
- Environment variable management

## Performance Goals
- Page load time: < 3 seconds
- API response time: < 200ms (95th percentile)
- Concurrent users: 1000

## Implementation Priority
1. **Phase 1: MVP** - Essential features only
2. **Phase 2: Extension** - Additional features
3. **Phase 3: Optimization** - Performance and scalability

## Code Generation Rules

### Before Suggesting Code
1. Read `docs-template/MASTER.md` for project context
2. Check `docs-template/03-implementation/PATTERNS.md` for implementation patterns
3. Verify `docs-template/02-design/ARCHITECTURE.md` for technical decisions
4. Review `docs-template/02-design/DOMAIN.md` for business logic

### During Code Suggestion
1. Follow the coding rules from MASTER.md
2. Use the patterns from PATTERNS.md
3. Implement proper error handling
4. Suggest corresponding tests
5. Add appropriate comments

### After Code Suggestion
1. Verify no magic numbers are used
2. Check type safety
3. Ensure error handling is proper
4. Validate security requirements
5. Confirm performance considerations

## Prohibited Patterns
- ❌ `any` type usage
- ❌ Magic numbers/hardcoded values
- ❌ `console.log` in production
- ❌ Unused imports/variables
- ❌ Error swallowing
- ❌ Functions over 30 lines
- ❌ Inconsistent naming

## Required Patterns
- ✅ TypeScript with strict types
- ✅ Named constants for all values
- ✅ Result pattern for error handling
- ✅ Comprehensive error handling
- ✅ Unit tests for all functions
- ✅ Proper logging
- ✅ Security best practices

## AI Prompt Assistance
When suggesting code, always consider this constraint:

```
Constraint: No magic numbers or hardcoded values. Extract meaningful values into named constants and inject via environment variables or configuration modules. Document units (ms, KB, etc.) and valid ranges in comments or types. URLs, paths, header names, and error codes must be constantized.

Recommended Tooling: Use Playwright with MCP integration for AI-driven visual debugging and automated test healing. On E2E test failure, automatically analyze screenshots and generate remediation suggestions.
```

## Document References
- **`AGENTS.md`** - Common AI agent guidelines (READ THIS FIRST)
- `docs-template/MASTER.md` - Project overview and rules
- `docs-template/01-context/PROJECT.md` - Business requirements
- `docs-template/02-design/ARCHITECTURE.md` - Technical architecture
- `docs-template/02-design/DOMAIN.md` - Business logic
- `docs-template/03-implementation/PATTERNS.md` - Implementation patterns
- `docs-template/04-quality/TESTING.md` - Testing strategies
- `docs-template/05-operations/DEPLOYMENT.md` - Deployment procedures
- `docs-template/08-knowledge/` - Knowledge base and best practices

## GitHub Copilot for Pull Requests Behavior Control

### PR Comment Policy
When reviewing pull requests, GitHub Copilot MUST follow these rules:

1. **Single Comment per Review Session**
   - Provide ONE comprehensive review comment per PR update
   - Consolidate all feedback into a single structured comment
   - DO NOT post multiple separate comments for different issues

2. **Triggering Conditions**
   - Comment ONLY on the following PR events:
     - Initial PR creation (`opened`)
     - New commits pushed (`synchronize`)
   - DO NOT comment on:
     - PR reopening (`reopened`)
     - PR closing (`closed`)
     - Draft PR state changes

3. **Comment Structure**
   When commenting, use this structure:
   ```markdown
   ## Review Summary
   [Overall assessment]

   ## Critical Issues
   - [Issue 1]
   - [Issue 2]

   ## Suggestions
   - [Suggestion 1]
   - [Suggestion 2]

   ## Checklist
   - [ ] MASTER.md rules followed
   - [ ] No magic numbers
   - [ ] Type safety ensured
   ```

4. **Avoid Redundant Comments**
   - Check if a similar comment already exists before posting
   - Update existing comments instead of creating new ones when possible
   - Group related issues together

5. **Rate Limiting**
   - Maximum 1 review comment per PR event
   - Wait for human response before providing follow-up suggestions
   - Respect the "review requested" flag

### Workflow Integration
- Align with `.github/workflows/release-drafter.yml` triggers
- Do not interfere with automated release note generation
- Focus on code quality, not administrative tasks

## Code Review Checklist
- [ ] AGENTS.md common rules followed
- [ ] MASTER.md rules followed
- [ ] No magic numbers/hardcoded values
- [ ] Type safety ensured
- [ ] Error handling implemented
- [ ] Tests generated
- [ ] Security requirements met
- [ ] Performance considerations addressed
- [ ] Naming conventions followed
- [ ] Constants properly organized by layer

---

## 📝 GitHub Copilot スキル（Book Writing Workflow 用）

スコープを分割した 6 つのスキルを `.github/copilot/skills` に配置：

| スキル | 対象 | 説明 |
|--------|------|------|
| [`proofread-japanese.md`](./copilot/skills/proofread-japanese.md) | 日本語表現 | 誤字脱字、文法、読みやすさ |
| [`proofread-terms.md`](./copilot/skills/proofread-terms.md) | 用語統一 | 表記揺れ、用語の一貫性 |
| [`proofread-facts.md`](./copilot/skills/proofread-facts.md) | ファクトチェック | 統計データ、出典、技術的正確性 |
| [`proofread-structure.md`](./copilot/skills/proofread-structure.md) | 文書構造 | 見出しレベル、必須セクション |
| [`proofread-markdown.md`](./copilot/skills/proofread-markdown.md) | Markdown 記法 | リスト、強調、コードブロック、テーブル |
| [`generate-illustration.md`](./copilot/skills/generate-illustration.md) | 画像生成 | 挿絵・図解生成用 Python コード作成 |

### スキル実行方法

**PR 作成時に自動実行:**
```
PR が作成されると、校正スキルが自動実行され、
各スキルが独立した PR コメントを投稿
```

**手動実行:**
```markdown
@github-copilot /proofread-japanese
@github-copilot /generate-illustration
```

**詳細**: [`./copilot/skills/README.md`](./copilot/skills/README.md) を参照

---

**Important Notes:**
- For book writing workflow, see [`AGENTS.md`](../AGENTS.md) § "Book Writing Git Workflow"
- For GitHub Copilot skills, see [`./copilot/skills/README.md`](./copilot/skills/README.md) § "スキル一覧"
- For illustration rules, see [`AGENTS.md`](../AGENTS.md) § "書籍「ai-small-is-accurate」挿絵ルール"
- For proofreading instructions, see [`AGENTS.md`](../AGENTS.md) § "校正レビュー指示"

Remember: Always reference AGENTS.md and MASTER.md for project requirements and constraints.
