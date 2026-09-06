# Devstash - Agent Session Handover

> **For Incoming AI Agents:** Read this concise document first to immediately understand current project state, architectural conventions, and what to work on next.

---

## 1. Project Snapshot (Current State)

- **Git Branch:** `main`
- **Last Commit:** `5cd3892` (`feat: connect stats and sidebar to database with refined collection layout`)
- **Build & Lint:** 100% passing (`npm run build` and `npm run lint`)
- **Database Status:** Neon PostgreSQL connected, migrated, and fully seeded with realistic demo data.

---

## 2. What We Have Built So Far

### A. Frontend UI (Dashboard & Sidebar)
- **App Shell:** Dark mode UI, responsive collapsible Sidebar (`src/components/layout/sidebar.tsx`), dynamic mobile Sheet drawer, and top bar with search (`src/components/layout/top-bar.tsx`).
- **Sidebar & Stats:** 100% live database-driven!
  - System item types with live item count badges, colored icons, and links to `/items/[type]`.
  - Collections section with folder icon, favorite collections with left star icons and live item counts, recent collections with type-based color dots and live item counts, and "View all collections" link (`/collections`).
- **Dashboard (`/dashboard`):** 100% live database-driven!
  - 4 live metric cards (Total Items, Collections, Favorites).
  - `CollectionsGrid` with live dynamic left border accents and item type icons (`src/lib/db/collections.ts`).
  - `PinnedItems` and `RecentItems` sections with live item data, tags, and type indicators (`src/lib/db/items.ts`).
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
