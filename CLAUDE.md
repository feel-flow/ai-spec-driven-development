# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 MANDATORY: Always Read MASTER.md First

**Before starting any work on this project, you MUST read and understand the contents of `docs/MASTER.md`.**

This document contains:
- Project identification and context
- Technical stack and architecture patterns
- Mandatory coding rules and constraints
- AI-specific prompts and guidelines
- Implementation priorities and phases

**Failure to reference MASTER.md will result in incorrect implementations that violate project standards.**

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