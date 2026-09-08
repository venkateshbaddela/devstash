# Devstash - Agent Session Handover

> **For Incoming AI Agents:** Read this concise document first to immediately understand current project state, architectural conventions, and what to work on next.

---

## 1. Project Snapshot (Current State)

- **Git Branch:** `main`
- **Last Commit:** `3aa592a` (`fix: resolve performance, routing, and architectural codebase issues`)
- **Build & Lint:** 100% passing (`npm run build` and `npm run lint`)
- **Database Status:** Neon PostgreSQL connected, migrated, and fully seeded with realistic demo data (including global system item types).

---

## 2. What We Have Built So Far

### A. Frontend UI (Dashboard & Modular Sidebar)
- **App Shell:** Dark mode UI, persistent shared `(app)` route-group layout (`src/app/(app)/layout.tsx`) preventing shell unmounting during `/dashboard` ↔ `/items/[type]` navigation.
- **Modular Sidebar:** Refactored into clean domain sub-components with shared expansion state in `SidebarContext`:
  - `src/components/layout/sidebar-nav-types.tsx` (System types, live count badges, PRO indicators).
  - `src/components/layout/sidebar-nav-collections.tsx` (Favorites with star icons, recent collections with color dots, active-state detection via `useSearchParams()`).
  - `src/components/layout/sidebar-user-profile.tsx` (User initials avatar and settings).
  - `src/components/layout/sidebar.tsx` (Assembles desktop `<aside>` and mobile drawer `<Sheet>`).
- **Dashboard (`/dashboard`):** 100% live database-driven!
  - 4 live metric cards (Total Items, Collections, Favorites).
  - `CollectionsGrid` with live dynamic left border accents and item type icons (`src/lib/db/collections.ts`).
  - `PinnedItems` and `RecentItems` sections with live bounded items (`take: 12`), selective column projections, tags, and type indicators (`src/lib/db/items.ts`).
- **Dynamic Route (`/items/[type]`):** Filtered item list view with breadcrumb navigation.

### B. Database & Backend Architecture (Prisma 7 + Neon)
- **Database:** Neon Serverless PostgreSQL (`ep-jolly-fire-a5ldwe0z.us-east-2.aws.neon.tech`).
- **Prisma 7 Breaking Convention:** Connection strings (`DATABASE_URL`, `DIRECT_URL`) are configured in `prisma.config.ts`, **NOT** inside `schema.prisma`.
- **Client Singleton:** `src/lib/prisma.ts` initializes `@prisma/adapter-pg` with `pg.Pool`.
- **Schema & Plural Table Names:** All Prisma models use `@@map` to lowercase plural table names (`users`, `items`, `collections`, `item_types`, `accounts`, `sessions`, `verification_tokens`, `tags`, `item_collections`, `item_tags`).
- **Migrations Applied:**
  1. `20260906092547_init` — NextAuth & Devstash core knowledge models.
  2. `20260906101626_add_user_password` — Added `password String?` to `User` for credentials auth.

### C. Seed Data Populated
Overwrote `prisma/seed.ts` and executed `prisma db seed` against Neon:
- **Demo User:** `demo@devstash.io` | Name: "Demo User" | Password: `12345678` (Bcrypt 12 rounds)
- **7 System Item Types:** `snippet`, `prompt`, `command`, `note`, `file`, `image`, `link`
- **5 Collections:** `React Patterns`, `AI Workflows`, `DevOps`, `Terminal Commands`, `Design Resources`
- **18 Items:** Real developer snippets, prompts, bash commands, and resource links with tags and join tables.
- **Verification Script:** Run `npm run test:db` (`scripts/test-db.ts`) to view all records and live stats.

### D. Authentication Infrastructure (NextAuth v5 & GitHub OAuth)
- **NextAuth v5 (`next-auth@beta`):** Configured with Prisma adapter (`@auth/prisma-adapter`) and JWT session strategy (`session: { strategy: 'jwt' }`).
- **Edge Split Pattern:** `src/auth.config.ts` houses edge-safe providers (GitHub OAuth) and pure `jwt` / `session` callbacks mapping `user.id`, while `src/auth.ts` integrates the Prisma adapter.
- **Route Protection (Next.js 16 Proxy):** `src/proxy.ts` exports named `export const proxy = auth(...)` with `NextResponse.redirect` protecting `/dashboard/*` and `/items/*` routes.
- **Route Handlers:** `src/app/api/auth/[...nextauth]/route.ts` exposes NextAuth's `GET` and `POST` handlers.
- **Type Augmentations:** `src/types/next-auth.d.ts` extends `Session` with `user.id: string` and `JWT` with `id?: string`.
- **Database Driver Security:** Normalized connection strings in `src/lib/prisma.ts` and `.env` to `sslmode=verify-full` to eliminate `pg` driver deprecation warnings.

---

## 3. Handy Commands

```bash
npm run dev         # Next.js dev server
npm run build       # Next.js production build (Turbopack)
npm run lint        # ESLint check
npm run test:db     # Test Neon DB connection and print all demo data
npm run studio      # Launch Prisma Studio web GUI
npm run db:migrate  # Run prisma migrate dev (dev schema changes)
npm run db:deploy   # Run prisma migrate deploy (prod migrations)
npm run db:seed     # Run prisma db seed
```

---

## 4. Strict Operational Rules

1. **NEVER run `prisma db push`**. Always create migrations using `npx prisma migrate dev --name <migration_name>`.
2. **Never commit without permission** and never commit until `npm run build` passes.
3. **Workflow for any feature/fix:**
   - Document in `context/current-feature.md`
   - Create branch `feature/<name>` or `fix/<name>`
   - Implement & verify (`npm run build`, `npm run lint`)
   - Ask user before committing (use conventional commit message)
   - Merge to `main`, delete feature branch, push to `origin/main`
   - Mark completed in `context/current-feature.md` and update history.

---

## 5. Logical Next Step
 
Both collections and items on the dashboard are now fully connected to the live Neon database. The logical next tasks are:
1. **Connect Dynamic Route (`/items/[type]`):** Replace `mock-data.ts` in `/items/[type]` with live queries filtering items by system item type.
2. **Item Quick-View Drawer:** Implement slide-over item details drawer with syntax highlighting, copy-to-clipboard, tags, and actions per `project-overview.md`.
