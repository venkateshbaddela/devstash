# Current Feature: Markdown Editor

---

## Status

In Progress

---

## Goals

- Create reusable `MarkdownEditor` component with tabbed interface (`Write` / `Preview`) matching Devstash dark theme and `CodeEditor` styling.
- Support both edit mode (defaulting to Write tab with Preview tab available) and display / readonly mode (showing only the rendered Preview tab).
- Include header action with copy button (matching `CodeEditor` styling with clipboard copy and feedback).
- Render markdown using `react-markdown` and `remark-gfm` with complete GitHub Flavored Markdown support (headings h1-h6, lists, blockquotes, links, tables, code blocks, and inline code).
- Implement custom dark mode preview styling (e.g. `.markdown-preview`) with fluid height capped at `max 400px` (matching `CodeEditor` height behavior).
- Replace plain textareas with `MarkdownEditor` for `note` and `prompt` item types in `CreateItemDialog`.
- Replace plain textareas / raw text display with `MarkdownEditor` for `note` and `prompt` item types in `ItemDrawer` (both view mode in readonly and edit mode).
- Keep `CodeEditor` unchanged for `snippet` and `command` items.

---

## Notes

- Spec file: [markdown-editor-spec.md](file:///workspaces/devstash/context/features/markdown-editor-spec.md)
- Requires installing `react-markdown` and `remark-gfm`.
- Integration Points:
  - `CreateItemDialog` (`src/components/items/create-item-dialog.tsx`): Note and prompt content input field.
  - `ItemDrawer` (`src/components/items/item-drawer.tsx`): Edit mode for note and prompt content field; view mode in readonly for note and prompt content display.
  - Preserve `CodeEditor` for `snippet` and `command`.
- Styling Details:
  - Headings (h1-h6) visually distinct with proper sizing and weight.
  - Code blocks with dark background and monospace font.
  - Inline code with subtle background highlight.
  - Lists (ordered/unordered) with proper indentation and bullets.
  - Blockquotes with left border accent.
  - Links in blue with hover state.
  - Tables with borders and header background.
  - Custom CSS class (e.g., `.markdown-preview`) for dark mode styling.
  - Fluid height with max 400px, matching `CodeEditor` behavior.

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

### Vitest Unit Testing Setup (2026-09-11)

- Installed `vitest` and configured `vitest.config.mts` with `environment: 'node'` and Next.js path aliases (`@/*`, `~/*`).
- Strictly scoped unit testing to Server Actions (`src/actions/`) and utilities (`src/lib/`), excluding React components.
- Added `test` (`vitest run`), `test:unit`, and `test:watch` scripts to `package.json`.
- Implemented 6 unit test suites with 61 passing tests across `tests/unit/`:
  - `tests/unit/lib/rate-limit.test.ts`: Client IP header parsing & 429 response generation.
  - `tests/unit/lib/icons.test.ts`: Lucide icon mapping, case-insensitivity, and fallback safety.
  - `tests/unit/lib/auth-core.test.ts`: Password reset validation, bcrypt length constraint (8-72 chars), and generic enumeration defense.
  - `tests/unit/lib/items-slug.test.ts`: Slug resolution, plural/singular normalization, and PRO item type gating.
  - `tests/unit/actions/profile.test.ts`: User authentication guards, demo user protection, and password length bounds.
  - `tests/unit/actions/auth.test.ts`: Email verification resend, verification tokens, and enumeration-safe responses.
- Updated documentation and testing standards across `context/ai-interaction.md`, `context/coding-standards.md`, `context/project-overview.md`, `context/session-handover.md`, and `AGENTS.md`.
- Verified cleanly with 61/61 passing unit tests (`npm test`), 0 ESLint errors/warnings (`npm run lint`), and clean production build (`npm run build`).

### Responsive Three-Column Item Grid (2026-09-11)

- Updated items list view grid layout in `src/app/(app)/items/[type]/page.tsx` from 2 columns to 3 columns on larger viewports (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4`).
- Aligned grid density with `CollectionsGrid` on `/dashboard`, improving visual balance in the `max-w-7xl` container on desktop screens ($\ge 1024\text{px}$).
- Preserved single-column presentation on mobile and two-column presentation on tablets (`md:`).
- Verified `ItemCard` visual components (Lucide type icons, color accents, tags, star/pin badges, dates) scale cleanly in 3-column rows without text overflow.
- Verified 100% passing across Vitest unit tests (`npm test` - 61/61 passed), integration tests (`npm run test:items` - 47/47 passed), ESLint (`npm run lint`), and Next.js production build (`npm run build`).

### Item Detail Drawer (2026-09-12)

- Implemented right-side slide-in `ItemDrawer` component using shadcn `Sheet` (`SheetContent side="right"`) as the primary item detail view.
- Added `getItemById` in `src/lib/db/items.ts` fetching full item relations (types, tags, collections), date formatting, BigInt serialization safety, and user scoping with React `cache()`.
- Created dynamic API route handler `GET /api/items/[id]` in `src/app/api/items/[id]/route.ts` with NextAuth session verification, demo user fallback, and HTTP error responses.
- Implemented `ItemDrawerProvider` and `useItemDrawer` / `useOptionalItemDrawer` context in `src/components/items/item-drawer-context.tsx` ensuring clean separation without circular module dependencies.
- Added progressive loading skeleton to `ItemDrawer` displaying instantaneous preview metadata from card clicks while fetching full details from the API.
- Rendered drawer header with Lucide type icon, item title, and color-coded item type badge with CSS `color-mix` styling.
- Rendered full action bar matching reference design: Favorite (star icon toggling yellow fill), Pin, Copy (with clipboard write and "Copied!" feedback), Edit, and right-aligned Delete (trash icon).
- Rendered item detail sections: Description, syntax-style line-numbered code table for content, URL external link cards, file metadata previews, tags with tag icon, collections with folder icon and accent color, and Created/Updated timestamps.
- Enhanced `ItemCard` (`src/components/dashboard/item-card.tsx`) with client click and keyboard interactions (`Enter`/`Space`) triggering drawer opening across Dashboard (`PinnedItems`, `RecentItems`) and Items List (`/items/[type]`).
- Wrapped `(app)` route layout (`src/app/(app)/layout.tsx`) in `ItemDrawerProvider` and rendered `ItemDrawer` without converting Server Components into Client Components.
- Added unit test suites in `tests/unit/lib/items-query.test.ts` and `tests/unit/lib/items-api.test.ts` (73/73 passing unit tests).
- Added end-to-end database integration test in `scripts/test-item-drawer.ts` (`npm run test:drawer` - 20/20 passing assertions).
- Verified with Playwright visual testing across Dashboard and Items List views, 0 ESLint errors/warnings (`npm run lint`), and clean production build (`npm run build`).

### Item Drawer — Edit Mode (2026-09-12)

- Implemented inline edit mode within `ItemDrawer` (`src/components/items/item-drawer.tsx`), allowing fields to become editable inputs without page navigation or modal popping.
- Added `updateItemSchema` Zod validation in `src/lib/validations/items.ts` validating title (required), description, content, url, language, and tags array.
- Created `updateItem` query function in `src/lib/db/items.ts` performing transactional tag reconciliation (disconnecting existing and upserting/connecting new tags), in-memory tag deduplication, core field updates, and interactive transaction timeout safety (15000ms).
- Implemented `updateItemAction` Server Action in `src/actions/items.ts` with NextAuth session authentication, demo user fallback, ownership check, Zod input validation, path cache revalidation (`/dashboard`, `/items`), and `{ success, data, error }` response structure.
- Exposed `setItemDetail` in `src/components/items/item-drawer-context.tsx` to immediately synchronize drawer state upon saving.
- Rendered controlled editable form inputs: Title (required with dynamic header reflection), Description (textarea), Language (snippets, commands), Content (snippets, prompts, commands, notes), URL (links), and Tags (comma-separated input).
- Kept item type, collections, and created/updated timestamps read-only in edit mode.
- Handled client-side UX guards: disabled Save button when title is empty or actively saving (showing spinner with "Saving..."), Cancel button discarding edits, auto-dismissing toast notifications on success/error, and `router.refresh()` triggering instant underlying card list refresh.
- Added comprehensive unit tests in `tests/unit/actions/items.test.ts` and `tests/unit/lib/items-query.test.ts` (93/93 passing unit tests).
- Added end-to-end database integration test in `scripts/test-item-edit.ts` (`npm run test:edit` - 17/17 passing assertions).
- Verified with Playwright visual testing and interactions, 0 ESLint errors/warnings (`npm run lint`), and clean production build (`npm run build`).

### Item Deletion with Confirmation & Toast (2026-09-12)

- Implemented `deleteItem(itemId, userId)` in `src/lib/db/items.ts` with user authorization checks and cascading database deletion of item associations (`item_tags`, `item_collections`) while keeping tags and collections intact.
- Implemented `deleteItemAction(itemId)` in `src/actions/items.ts` with NextAuth authentication, demo user fallback, input validation, and Next.js cache revalidation for `/dashboard` and `/items`.
- Created accessible `AlertDialog` primitives in `src/components/ui/alert-dialog.tsx` using `@base-ui/react/alert-dialog` and shadcn styling tokens.
- Created reusable `DeleteItemDialog` in `src/components/items/delete-item-dialog.tsx` featuring a destructive alert header, item title verification, permanent removal notice, loading spinner during deletion, and inline error feedback.
- Integrated deletion modal into `ItemDrawer` (`src/components/items/item-drawer.tsx`) triggered by the header action bar trash button.
- Extended `ItemDrawerProvider` in `src/components/items/item-drawer-context.tsx` with unified `showToast(type, message)` and rendered a viewport-fixed floating toast notification container that remains visible after drawer dismissal with auto-dismiss and close controls.
- On successful deletion: closes the confirmation dialog, closes the drawer, displays success toast ("Item deleted successfully."), and refreshes underlying page lists via `router.refresh()`.
- Added unit tests in `tests/unit/actions/items.test.ts` and `tests/unit/lib/items-query.test.ts` bringing total unit tests to 105/105 passed.
- Added database integration test script in `scripts/test-item-delete.ts` (`npm run test:delete`) verifying live item creation, unauthorized deletion rejection, cascade cleanup, and non-existent item error handling (19/19 assertions passed).
- Verified cleanly against ESLint (`npm run lint`), all test suites (`npm test`, `npm run test:delete`), and Next.js production build (`npm run build`).

### Item Create (2026-09-12)

- Implemented `createItemSchema` Zod validation in `src/lib/validations/items.ts` supporting polymorphic creation item types (`snippet`, `prompt`, `command`, `note`, `link`), requiring valid `http(s)://` URL for links, trimming inputs, and capping lengths.
- Implemented `createItem` query function in `src/lib/db/items.ts` resolving system item types, running atomic Prisma `$transaction` for item creation and tag upserting with timeout safeguards (`15000ms`), and returning mapped `ItemDetail`.
- Implemented `createItemAction` Server Action in `src/actions/items.ts` with NextAuth authentication, demo user fallback, Zod parsing, path cache revalidation (`/dashboard`, `/items`), and `{ success, data, message }` response structure.
- Built accessible `CreateItemDialog` component in `src/components/items/create-item-dialog.tsx` using shadcn `Dialog`, featuring a polymorphic form that dynamically adjusts visible inputs based on selected item type.
- Rendered dynamic type selector dropdown with exact database color codes and Lucide icons (`Code`, `Sparkles`, `Terminal`, `StickyNote`, `LinkIcon`), applying direct inline style colors to prevent CSS overrides on focus/hover.
- Rendered common inputs (Title with 255-character counter, Description, Tags), type-specific inputs (Language & Content for `snippet`/`command`, Textarea Content for `prompt`/`note`, URL input for `link`), and smooth exit transitions without type flashing.
- Connected "New Item" button in `TopBar` (`src/components/layout/top-bar.tsx`) to trigger the creation dialog.
- Wrapped `(app)` route layout in `ItemDrawerProvider` around `DashboardLayout` so `TopBar` can trigger global toast notifications on item creation success.
- Handled UX states: disabled submit button when title/URL invalid, spinner during submission, inline error banners, and `router.refresh()` list view refresh.
- Added comprehensive unit tests in `tests/unit/actions/items.test.ts` and `tests/unit/lib/items-query.test.ts` (125/125 passed).
- Added end-to-end database integration test in `scripts/test-item-create.ts` (`npm run test:create` - 24/24 assertions passed).
- Verified cleanly against ESLint (`npm run lint`), all test suites (`npm test`), and Next.js production build (`npm run build`).

### Monaco Code Editor & Form Consistency (2026-09-12)

- Integrated `@monaco-editor/react` with custom `devstash-dark` theme matching Devstash UI tokens (`#09090b` canvas).
- Built reusable `CodeEditor` component (`src/components/ui/code-editor.tsx`) featuring macOS-style window dots, formatted language badge, quick clipboard copy with temporary "Copied!" feedback, dynamic height auto-sizing (up to 400px), and custom dark scrollbar sliders.
- Integrated `CodeEditor` for `snippet` and `command` item types across `CreateItemDialog` and `ItemDrawer` (both view and edit modes), while preserving native textareas for notes and prompts.
- Added language normalization and formatting utilities in `src/lib/monaco-languages.ts` with comprehensive unit tests (`tests/unit/lib/monaco-languages.test.ts`).
- Harmonized form field backgrounds across `CreateItemDialog` and `ItemDrawer` by aligning `dark:bg-input/30` across textareas and dropdown triggers.
- Standardized border radius to `rounded-lg` (`var(--radius)`) across all input, textarea, dropdown, and editor fields.
- Created `CreateTypeItemButton` component and integrated type-specific creation buttons on each `/items/[type]` page header and empty state, automatically preselecting the active type in `CreateItemDialog`.
- Verified 100% passing across Vitest unit tests (140/140 passed), ESLint (`npm run lint`), and Next.js production build (`npm run build`).
