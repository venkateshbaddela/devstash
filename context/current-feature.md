# Current Feature: Auth Setup - NextAuth + GitHub Provider

---

## Status

In Progress

---

## Goals

- [x] Install NextAuth v5 (`next-auth@beta`) and `@auth/prisma-adapter`
- [x] Create edge-compatible auth configuration in `src/auth.config.ts` (providers only, GitHub OAuth)
- [x] Create full auth configuration with Prisma adapter and JWT session strategy in `src/auth.ts`
- [x] Create NextAuth route handlers in `src/app/api/auth/[...nextauth]/route.ts`
- [x] Protect `/dashboard/*` routes using Next.js 16 proxy in `src/proxy.ts` with redirect logic
- [x] Extend NextAuth session types in `src/types/next-auth.d.ts` with `user.id`
- [x] Configure environment variables (`AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`)
- [x] Verify build, linting, and authentication flow (route protection redirect, sign-in, and redirect back to `/dashboard`)

---

## Notes

- Source specification: `context/features/auth-phase-1-spec.md`
- NextAuth version: Use `next-auth@beta` (NextAuth v5), not `@latest` (which installs v4).
- Edge compatibility: Split auth config pattern (`src/auth.config.ts` for edge/proxy, `src/auth.ts` with Prisma adapter for Node.js).
- Proxy file: Must be at `src/proxy.ts` (same level as `app/`) using named export `export const proxy = auth(...)` (not default export).
- Session strategy: Use `session: { strategy: 'jwt' }` with split config pattern.
- Pages: Do not set custom `pages.signIn` — use NextAuth's default page for testing.
- References:
  - Edge compatibility: https://authjs.dev/getting-started/installation#edge-compatibility
  - Prisma adapter: https://authjs.dev/getting-started/adapters/prisma

---

## History

### Initial & Mock Data Setup (2026-09-05)

- Initialized Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4.
- Created `src/lib/mock-data.ts` to power the initial UI prototype.

### Dashboard UI Phase 1 (2026-09-05)

- Initialized shadcn/ui with Tailwind CSS v4 and dark mode by default.
- Created `/dashboard` route shell with `TopBar` (search bar and action buttons).

### Dashboard UI Phase 2 (2026-09-05)

- Built collapsible, responsive sidebar (`src/components/layout/sidebar.tsx`) and mobile drawer (`Sheet`).
- Added system item types with count badges and collapsible `Collections` sections (Favorites and All).
- Added bottom user profile area and dynamic route `/items/[type]` sharing persistent layout.

### Dashboard UI Phase 3 (2026-09-06)

- Implemented 4 overview stats cards (`Total Items`, `Collections`, `Favorite Items`, `Favorite Collections`).
- Implemented `CollectionsGrid` with left accent borders, favorite star indicators, and type icons.
- Built reusable `ItemCard` component supporting left accent borders, tags, and status badges.
- Implemented `PinnedItems` and `RecentItems` sections on `/dashboard`.
- Added breadcrumbs navigation on `/items/[type]` route.

### Neon Postgres & Prisma Setup (2026-09-06)

- Initialized Prisma 7 with Neon PostgreSQL (serverless), with datasource URLs in `prisma.config.ts`.
- Implemented full schema in `prisma/schema.prisma` with NextAuth models, core knowledge models, indexes, and plural lowercase table mappings.
- Created singleton Prisma client in `src/lib/prisma.ts` using `@prisma/adapter-pg`.
- Applied initial migration `20260906092547_init` via `prisma migrate dev`.
- Verified build and lint (`npm run build`, `npm run lint`).

### Database Seed Data Implementation (2026-09-06)

- Added optional `password` field to `User` model, installed `bcryptjs`, and applied migration `20260906101626_add_user_password`.
- Rewrote `prisma/seed.ts` populating demo user (`demo@devstash.io`), 7 system item types, 5 collections, and 18 realistic items.
- Created verification script `scripts/test-db.ts` to query and validate all database records and relations.
- Verified build and lint (`npm run build`, `npm run lint`).

### Dashboard Collections Database Integration (2026-09-06)

- Created `src/lib/db/collections.ts` to query collections and live stats for demo user (`demo@devstash.io`) via Prisma.
- Connected `DashboardPage` Server Component (`src/app/dashboard/page.tsx`) and `StatsCards` to live database queries.
- Dynamically derived collection card left border colors from the most-used item type in each collection.
- Rendered small icons for all distinct item types present in each collection with matching accent colors.
- Kept mock items in `PinnedItems` and `RecentItems` sections for subsequent phase integration.
- Verified build and lint (`npm run build`, `npm run lint`).

### Dashboard Items Database Integration (2026-09-06)

- Created `src/lib/db/items.ts` to query pinned items, recent items, and item counts for demo user (`demo@devstash.io`) via Prisma.
- Connected `PinnedItems` and `RecentItems` to live database queries with automatic hiding when no pinned items exist.
- Derived item card icon and left border accent dynamically from each item's system item type (`itemType`).
- Rendered item tags, status badges (pin, star), and relative dates matching design.
- Updated `StatsCards` to show live counts for `totalItems` and `favoriteItems`, fully retiring mock data from overview stats.
- Verified build and lint (`npm run build`, `npm run lint`).

### Stats & Sidebar Database Integration (2026-09-06)

- Added `getSidebarItemTypes` in `src/lib/db/items.ts` to fetch system item types with live item counts per user.
- Updated `DashboardLayout` to fetch sidebar item types and collections from Neon database on the server.
- Connected `Sidebar` to live database types and collections, linking types to `/items/[typename]`.
- Implemented colored circle indicators for recent collections derived from the most-used item type.
- Refined collection layout: star icons on the left with item counts on the right for favorites, folder icon on Collections header (left of text), and Lucide ArrowRight icon on "View all collections".
- Verified build and lint (`npm run build`, `npm run lint`).

### Add Pro Badge to Sidebar (2026-09-07)

- Added PRO badge to "Files" and "Images" item types in sidebar navigation (`src/components/layout/sidebar.tsx`).
- Integrated shadcn/ui `Badge` component with custom refined styling (`rounded-lg`, `h-4.5 px-1.5 text-[9px] font-semibold uppercase tracking-normal leading-none`).
- Added `isPro?: boolean` to `SidebarItemType` interface in `src/lib/db/items.ts` and configured `isPro: true` in `src/lib/mock-data.ts`.
- Verified layout and responsiveness across desktop and mobile drawer sidebars.

### Fix Codebase Bugs & Performance Issues (2026-09-07)

- Wrapped `getDefaultUserId()` with React `cache()` in `src/lib/db/collections.ts` to eliminate duplicate database queries per request (Bug 2).
- Added dedicated lightweight `getSidebarCollections()` query in `src/lib/db/collections.ts` fetching only required fields and item counts (Bug 3).
- Bounded pinned and recent item queries (`take: 12`) and added selective column projection in `src/lib/db/items.ts` to prevent fetching heavy content and file metadata (Bug 5).
- Scoped system item types to active user and global types (`userId: null`), updated `prisma/seed.ts` to seed system types with `userId: null`, and migrated existing database rows to be globally available (Bug 6).
- Fixed active collection highlighting in `src/components/layout/sidebar.tsx` using `useSearchParams()` (Bug 1).
- Removed redundant and broken "View all collections" 404 link from sidebar navigation (Bug 4).
- Prevented layout remounting and state loss between `/dashboard` and `/items/[type]` routes via shared `src/app/(app)/layout.tsx` route group (Bug 7).
- Centralized `isTypesOpen` and `isCollectionsOpen` section expansion state in `src/components/layout/sidebar-context.tsx` to synchronize desktop and mobile drawers (Bug 8).
- Verified build and lint (`npm run build`, `npm run lint`).
