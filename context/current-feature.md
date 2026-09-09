# Current Feature: Email Verification on Register

---

## Status

In Progress

---

## Goals

- [x] Install and configure Resend SDK (`resend`) using `RESEND_API_KEY` from `.env`.
- [x] Implement email verification token generation, storage, and validation using Prisma's `VerificationToken` model with an expiration time.
- [x] Update user registration (`/api/auth/register`) to generate token and dispatch verification email via Resend instead of immediately allowing unverified sign-in.
- [x] Update credentials sign-in authentication (`src/auth.ts`) to check `emailVerified` and reject unverified users with a clear error.
- [x] Create verification page / route (`src/app/(auth)/verify-email/page.tsx`) to process verification tokens, mark `emailVerified` on the user, and provide clean user feedback.
- [x] Add resend verification email functionality (API endpoint / action) for users whose token expired or was lost.
- [x] Update registration UI (`RegisterForm`) to show confirmation message prompting the user to check their email.
- [x] Write integration test script to verify token generation, email dispatch, verification handling, and credentials protection.
- [x] Ensure clean lint (`npm run lint`) and production build (`npm run build`).

---

## Notes

- `RESEND_API_KEY` is present in `.env`.
- Sender address: `onboarding@resend.dev` (standard Resend testing domain) or custom domain if configured.
- `prisma/schema.prisma` already includes `VerificationToken` (`identifier`, `token`, `expires`) and `User.emailVerified` (`DateTime?`).
- Existing GitHub OAuth users should remain unaffected as OAuth providers verify emails externally.
- Keep Edge runtime compatibility intact for `src/proxy.ts` and `src/auth.config.ts` (Resend client and Prisma token management run in Node.js runtime).

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

### Auth Setup - NextAuth + GitHub Provider (2026-09-08)

- Installed NextAuth v5 (`next-auth@beta`) and `@auth/prisma-adapter`.
- Created edge-compatible auth configuration in `src/auth.config.ts` with GitHub OAuth provider and pure edge-safe `jwt` and `session` callbacks.
- Created full auth configuration in `src/auth.ts` integrating Prisma adapter and JWT session strategy.
- Created route handlers in `src/app/api/auth/[...nextauth]/route.ts` re-exporting NextAuth `GET` and `POST` handlers.
- Implemented route protection using Next.js 16 proxy convention in `src/proxy.ts` protecting `/dashboard/*` and `/items/*` with seamless `NextResponse.redirect` to sign-in.
- Extended NextAuth types in `src/types/next-auth.d.ts` augmenting `Session` with `user.id` and `JWT` with `id`.
- Normalized database SSL connections to `sslmode=verify-full` in `src/lib/prisma.ts` and `.env` to eliminate pg driver deprecation warnings.
- Verified build and lint (`npm run build`, `npm run lint`) and confirmed OAuth redirect flows.

### Auth Credentials - Email/Password Provider (2026-09-09)

- Registered Credentials provider placeholder with `authorize: () => null` in `src/auth.config.ts` to preserve edge runtime compatibility in `src/proxy.ts`.
- Implemented Node.js Credentials provider in `src/auth.ts` with Prisma database query and `bcrypt.compare` password verification.
- Built user registration API route at `src/app/api/auth/register/route.ts` with input validation, duplicate email detection, bcrypt password hashing (12 rounds), and Prisma user creation.
- Added comprehensive integration test script `scripts/test-auth-flow.ts` and `test:auth` npm script.
- Verified registration, duplicate rejection, credentials login flow, session cookie generation, protected route access, and GitHub OAuth continuity.
- Verified build and lint (`npm run build`, `npm run lint`).

### Auth UI - Sign In, Register & Sign Out (2026-09-09)

- Configured custom auth pages in `src/auth.config.ts` (`pages: { signIn: "/sign-in" }`) and updated route protection in `src/proxy.ts` (protecting `/dashboard/*`, `/items/*`, and `/profile/*`).
- Built custom Sign In page (`src/app/sign-in/page.tsx`, `src/components/auth/sign-in-form.tsx`) with dark mode card, email/password validation, GitHub OAuth button, and open redirect protection.
- Built custom Register page (`src/app/register/page.tsx`, `src/components/auth/register-form.tsx`) with password confirmation, validation, and `/api/auth/register` integration.
- Created reusable `UserAvatar` component (`src/components/ui/user-avatar.tsx`) supporting GitHub images and dynamic initials fallback with responsive font scaling.
- Integrated authenticated user session into `DashboardLayout` and scoped sidebar queries (`getSidebarItemTypes`, `getSidebarCollections`) to active user.
- Updated sidebar user footer (`src/components/layout/sidebar-user-profile.tsx`) with dropdown menu (`src/components/ui/dropdown-menu.tsx`) linking to `/profile` and native NextAuth `signOut()`.
- Created account profile page (`src/app/(app)/profile/page.tsx`) displaying user info and session management with server-side protection.
- Verified test suites (`test:auth`, `test-github-oauth.ts`), ESLint, and production build cleanly.

### Refactor Folder Structure - Route Groups & Server Actions (2026-09-09)

- Reorganized auth route pages into `(auth)` route group (`src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/register/page.tsx`) to mirror `(app)` structure without altering URL paths.
- Moved Server Actions from `src/app/actions/auth.ts` to `src/actions/auth.ts` matching project coding standards.
- Verified zero breaking changes via ESLint (`npm run lint`), production build (`npm run build`), and database tests (`npm run test:db`).
