<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 1. Devstash - Project Overview

Guidelines and specifications for AI coding agents working on the Devstash codebase.

---

---

## 2. Context Files

Read te following to get the full context of te project:

~ @context/project-overview.md
~ @context/coding-standards.md
~ @context/ai-interaction.md
~ @context/current-feature.md
~ @context/session-handover.md

## 3. Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19 (React Compiler enabled)
- **Language:** TypeScript 5 (Strict mode)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`, `@import "tailwindcss";`)
- **Linting:** ESLint 9 (`eslint-config-next`)
- **Testing:** Vitest (Unit testing for Server Actions and utilities)
- **Package Manager:** npm

---

## 4. Common Commands

Run all commands from the project root (`/devstash`):

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint check
npm run lint

# Run unit tests (Vitest)
npm test

# Run unit tests in watch mode
npm run test:watch
```

---

## 5. Database & Neon MCP Rules

> [!CAUTION]
> **Database Branch Safety**
> Whenever interacting with the database via **Neon MCP**, you must strictly follow these rules:
>
> 1. **Project Scope:** Always operate exclusively on the **`devstash`** project.
> 2. **Default Branch:** Always use the **`development`** database branch for all operations (running SQL queries, reading schemas, executing migrations, seeding, etc.).
> 3. **Production Safeguard:** **NEVER** query, modify, migrate, or alter the **`production`** (or `main`) branch unless the user explicitly instructs you to do so in their message.
> 4. **Pre-execution Verification:**
>    - Verify that the target branch is `development` before issuing any Neon MCP tool calls.
>    - If the `development` branch cannot be found or the tool defaults to `production`, **STOP and ask the user for confirmation** before proceeding.
