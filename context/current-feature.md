# Current Feature

---

## Status

Not Started

---

## Goals

<!-- Goals will be loaded from a feature spec or user prompt -->

---

## Notes

<!-- Notes and constraints will be loaded with the feature -->

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

### Email Verification on Register (2026-09-09)

- Configured Resend SDK (`src/lib/mail.ts`) using `RESEND_API_KEY` from `.env` with branded HTML and plain-text email templates.
- Implemented verification token lifecycle in `src/lib/tokens.ts` (`generateVerificationToken`, `verifyToken`) using Prisma `VerificationToken` model with 24-hour expiration.
- Updated user registration route (`src/app/api/auth/register/route.ts`) to generate tokens and dispatch verification emails via Resend.
- Updated credentials sign-in authorization in `src/auth.ts` to require `emailVerified`, throwing `EmailNotVerifiedError` (`code: "email_not_verified"`).
- Built email verification page at `src/app/(auth)/verify-email/page.tsx` and programmatic endpoints (`/api/auth/verify-email`, `/api/auth/resend-verification`).
- Built reusable `ResendVerificationForm` and server actions (`resendVerificationAction`, `verifyEmailAction`) in `src/actions/auth.ts`.
- Updated `RegisterForm` to show email verification confirmation and `SignInForm` to handle unverified error states with inline resend support and `verified=true` banner.
- Added database user cleanup script `scripts/cleanup-users.ts` (`npm run db:clean-users`) safeguarding `demo@devstash.io` and system knowledge data.
- Expanded integration test suite `scripts/test-auth-flow.ts` covering unverified login rejection, token verification, token consumption, and post-verification session login.
- Verified cleanly across ESLint (`npm run lint`), production build (`npm run build`), and end-to-end integration tests (`npm run test:auth`).

### Forgot Password & Password Reset Functionality (2026-09-10)

- Reused existing Prisma `VerificationToken` model with namespaced identifiers (`password-reset:${email}`) and 1-hour expiration.
- Implemented token lifecycle helpers in `src/lib/tokens.ts` (`generatePasswordResetToken`, `getPasswordResetTokenByToken`, `verifyPasswordResetToken`, `consumePasswordResetToken`) ensuring strict token isolation from email verification.
- Added `sendPasswordResetEmail(email, token)` in `src/lib/mail.ts` using Resend with branded HTML and plain-text templates.
- Added Server Actions in `src/actions/auth.ts` (`requestPasswordResetAction`, `resetPasswordAction`) with input validation, generic response to prevent email enumeration, bcrypt hashing (12 rounds), atomic token consumption, and automatic email verification upon successful reset.
- Added "Forgot password?" link next to the password input label in `src/components/auth/sign-in-form.tsx` and handled `?reset=true` success notification banner.
- Built `/forgot-password` route and `ForgotPasswordForm` component in `src/app/(auth)/forgot-password/page.tsx` and `src/components/auth/forgot-password-form.tsx`.
- Built `/reset-password` route and `ResetPasswordForm` component in `src/app/(auth)/reset-password/page.tsx` and `src/components/auth/reset-password-form.tsx` with token verification on load, expired/invalid token handling, and new password confirmation.
- Added automated integration test suite in `scripts/test-password-reset.ts` and `npm run test:reset` in `package.json`.
- Verified 100% passing tests, zero ESLint errors/warnings (`npm run lint`), and clean production build (`npm run build`).

### Profile Page & Account Settings (2026-09-10)

- Queried live user profile details (`createdAt`, `image`, `hasPassword`, `authMethod`) and Knowledge Hub statistics (total items, collections, system item type breakdown) directly via Prisma with React `cache()` deduplication.
- Separated `/profile` (identity showcase and knowledge metrics) from `/settings` (account actions, credentials, active sessions, and danger zone) to eliminate visual clutter.
- Built streamlined `ProfileHeader` on `/profile` displaying avatar, user name, tier badge (`Free Tier` / `PRO Plan`), email, member since date, authentication method, and direct link to Settings.
- Built dedicated `SettingsPage` (`src/app/(app)/settings/page.tsx`) organized into modular cards:
  - `GeneralSettingsForm`: Custom avatar management (with 256px client-side canvas resizing) and editable display name with dirty-state save.
  - `SecurityCard`: Authentication provider status, primary login email editing with Option B email verification (generating tokens via Prisma and sending verification links via Resend), password update dialog with current password check and 8+ char rule, and active device session with red destructive `SignOutButton`.
  - `DangerZoneCard`: Account deletion confirmation modal requiring typing current email before cascading permanent deletion (safeguarding `demo@devstash.io`).
- Created accessible `Dialog` modal primitive in `src/components/ui/dialog.tsx` using `@base-ui/react/dialog` and shadcn design tokens.
- Added "Settings" link to sidebar user dropdown in `src/components/layout/sidebar-user-profile.tsx` and protected `/settings/*` in `src/proxy.ts`.
- Implemented Server Actions in `src/actions/profile.ts` (`updateNameAction`, `updateEmailAction`, `updateProfileDetailsAction`, `updateAvatarAction`, `changePasswordAction`, `deleteAccountAction`) with strict validation, bcrypt hashing, and demo user safeguards.
- Added automated integration test suite in `scripts/test-profile-actions.ts` (`npm run test:profile`) covering all 6 core workflows.
- Verified cleanly across ESLint (`npm run lint`), production build (`npm run build`), and automated tests (`npm run test:profile`).

### Rate Limiting for Auth (2026-09-11)

- Installed `@upstash/ratelimit` and `@upstash/redis` for serverless-native sliding window rate limiting.
- Implemented reusable rate-limiting utility in `src/lib/rate-limit.ts` supporting sliding window quotas, timeout-based fail-open safety (`timeout: 1500`), and RFC-compliant HTTP 429 response formatting with `Retry-After` and `X-RateLimit-*` headers.
- Built robust client IP extraction helper (`getClientIp`) prioritizing authenticated edge headers (`cf-connecting-ip`, `x-real-ip`) over `x-forwarded-for` with `127.0.0.1` fallback, effectively preventing IP spoofing.
- Implemented two-tier rate limiting for NextAuth credentials sign-in in `src/auth.ts`: global per-IP limiter (`login-ip`, 30 attempts / 15 min) preventing horizontal password spraying, and per-account limiter (`login`, 5 attempts / 15 min keyed by `IP:email`) preventing targeted brute force.
- Protected registration endpoint (`POST /api/auth/register`) with 3 attempts per 1 hour keyed by client IP.
- Protected email verification resend endpoint (`POST /api/auth/resend-verification`) and Server Action (`resendVerificationAction`) with 3 attempts per 15 min keyed by `IP:email`.
- Protected forgot password requests (`requestPasswordResetAction` and `POST /api/auth/forgot-password`) with 3 attempts per 1 hour keyed by client IP.
- Protected password reset completion (`resetPasswordAction` and `POST /api/auth/reset-password`) with 5 attempts per 15 min keyed by client IP.
- Extracted core password reset business logic into `src/lib/auth-core.ts` (pure library code without `"use server"`) to eliminate client-side parameter manipulation/bypass attacks and prevent double rate-limiting between API routes and Server Actions.
- Validated email and password input formats before checking rate limits to avoid consuming user quotas on accidental typos.
- Enhanced client-side `SignInForm` to inspect `res?.url` for `code=rate_limited` and `code=email_not_verified` under NextAuth v5 `signIn("credentials", { redirect: false })`.
- Verified user-facing cooldown feedback across all authentication forms (Sign In, Register, Forgot Password, Reset Password, Resend Verification).
- Documented `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.example`.
- Created comprehensive integration test suite `scripts/test-rate-limit.ts` (`npm run test:rate-limit`).
- Verified 100% passing tests across all test suites (`test:rate-limit`, `test:reset`, `test:profile`), clean ESLint (`npm run lint`), and clean production build (`npm run build`).

### Auth Security Remediation (2026-09-11)

- Created dedicated branch `feat/auth-security-remediation` to resolve all 5 remaining findings from `docs/audit-results/AUTH_SECURITY_REVIEW.md`.
- **[MED-1] Unified Resend Verification Response:** Hardened `src/actions/auth.ts` and `src/app/api/auth/resend-verification/route.ts` to return an identical generic HTTP 200 message regardless of whether the account does not exist, is unverified, or is already verified, completely eliminating email enumeration.
- **[MED-2] Max Password Length Constraint ($\le 72$ chars):** Added explicit length checks and input `maxLength={72}` in `src/app/api/auth/register/route.ts`, `src/lib/auth-core.ts` (`executePasswordReset`), `src/actions/auth.ts` (`resetPasswordAction`), `src/actions/profile.ts` (`changePasswordAction`), `register-form.tsx`, `reset-password-form.tsx`, and `change-password-dialog.tsx`, preventing silent bcrypt truncation and CPU DoS attacks. Created `scripts/test-password-length.ts` (`npm run test:length`).
- **[LOW-1] Atomic Registration & Verification Token Generation:** Updated `generateVerificationToken` in `src/lib/tokens.ts` to accept an optional transaction client `tx?: Prisma.TransactionClient`, and wrapped user creation and token creation inside `prisma.$transaction` in `src/app/api/auth/register/route.ts`. Created `scripts/test-atomic-registration.ts` (`npm run test:atomic-reg`).
- **[HIGH-2] Password Reset Token SHA-256 Hashing:** Updated `generatePasswordResetToken`, `getPasswordResetTokenByToken`, `verifyPasswordResetToken`, and `consumePasswordResetToken` in `src/lib/tokens.ts` to compute SHA-256 hashes of reset tokens. Database `verification_tokens` table now stores exclusively 64-char hex hashes, while plaintext tokens are only sent via email. Updated `scripts/test-password-reset.ts` (`npm run test:reset`).
- **[HIGH-1] Session Invalidation on Password Change/Reset:** Added `tokenVersion Int @default(0)` to `User` model in `prisma/schema.prisma` and applied migration `20260911101800_add_user_token_version` to Neon `development` database branch. Updated `consumePasswordResetToken` and `changePasswordAction` to increment `tokenVersion: { increment: 1 }`. Configured `jwtCallback` in `src/auth.ts` to validate `dbUser.tokenVersion === token.tokenVersion`, immediately invalidating active JWT sessions across all devices upon password change or reset. Created `scripts/test-token-version.ts` (`npm run test:session`).
- Verified 100% passing automated test suites across all 6 test suites (`test:session`, `test:atomic-reg`, `test:length`, `test:reset`, `test:rate-limit`, `test:profile`), 0 ESLint errors/warnings (`npm run lint`), and 0 build errors (`npm run build`).

### Item Types & CRUD Architecture Research (2026-09-11)

- Executed research skill tasks `item-types-research` and `item-crud-research` based on specifications in `context/research/`.
- Created comprehensive technical documentation in `docs/item-types.md` detailing all 7 system item types (`snippet`, `prompt`, `command`, `note`, `file`, `image`, `link`), visual properties (Lucide icons and hex colors), storage classification (`ContentType.TEXT`, `ContentType.FILE`, `ContentType.URL`), shared properties, display behaviors, and plan entitlements.
- Created architectural design specification in `docs/item-crud-architecture.md` defining a unified polymorphic CRUD system for all 7 item types:
  - Single Server Action file (`src/actions/items.ts`) for unified mutations (`createItemAction`, `updateItemAction`, `deleteItemAction`, status toggles) enforcing transactional relation management and cache revalidation.
  - Direct database read queries (`src/lib/db/items.ts`) called directly from React Server Components.
  - Unified dynamic route handler (`src/app/(app)/items/[type]/page.tsx`) with Next.js 16 Promise params resolution and slug normalization.
  - Polymorphic UI architecture keeping type-specific presentation logic in components (`ItemContentRenderer`, `ItemForm`, `ItemDrawer`) rather than server actions.
- Verified cleanly against ESLint (`npm run lint`) and production build (`npm run build`).

### Items List View (2026-09-11)

- Replaced static mock data (`src/lib/mock-data.ts`) on dynamic route `/items/[type]` with live PostgreSQL queries via Prisma.
- Implemented `resolveItemTypeBySlug` and `getItemsByType` in `src/lib/db/items.ts` with React `cache()` deduplication.
- Supported slug normalization handling both singular and plural type routes (e.g., `/items/snippets` and `/items/snippet`, `/items/notes` and `/items/note`).
- Scoped item queries to active authenticated user session (`auth()`) with fallback to default demo user.
- Created boundary-safe `<ItemTypeIcon />` component and icon resolution helper in `src/lib/icons.tsx` resolving RSC boundary serialization (`Element type is invalid`) and React Compiler static component lint rules.
- Rendered responsive 2-column grid (`grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4`) of `ItemCard` components, displaying type color left accent borders, Lucide type icons, tags, favorite stars, and pin indicators.
- Added type header with Lucide icon, type name, description, PRO badge indicator, item counter, breadcrumbs navigation (`Dashboard > [Item Type]`), and polished empty state when no items exist.
- Implemented dynamic Next.js metadata generation (`generateMetadata`) using Next.js 16 asynchronous `params` (`await params`).
- Created automated integration test suite in `scripts/test-item-list-view.ts` (`npm run test:items`) with 47/47 passing assertions.
- Verified cleanly against ESLint (`npm run lint`), automated tests (`npm run test:items`), and production build (`npm run build`).
