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

## 3. Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19 (React Compiler enabled)
- **Language:** TypeScript 5 (Strict mode)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`, `@import "tailwindcss";`)
- **Linting:** ESLint 9 (`eslint-config-next`)
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
```

---
