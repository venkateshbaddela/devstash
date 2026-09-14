# Devstash - Agent Session Handover

> **For Incoming AI Agents:** Read this concise document first to immediately understand current project state, architectural conventions, and what to work on next.

---

## 1. Project Snapshot (Current State)

- **Git Branch:** `main`
- **Last Commit:** `feat(items): add click-to-browse native file manager trigger to empty dropzone`
- **Build & Lint:** 100% passing (`npm run build` and `npm run lint` - 0 errors, 0 warnings)
- **Unit Tests:** 221 / 221 passing Vitest unit tests (`npm test`) across 19 test suites
- **Database Status:** Neon PostgreSQL connected, migrated, and fully seeded with realistic demo data (including `tokenVersion` column on `users` table).
- **Object Storage:** Backblaze B2 S3-compatible cloud storage for file and image attachments.

---

## 2. What We Have Built So Far

### A. Frontend UI (Dashboard & Modular Sidebar)
- **App Shell:** Dark mode UI, persistent shared `(app)` route-group layout (`src/app/(app)/layout.tsx`) preventing shell unmounting during `/dashboard` ↔ `/items/[type]` navigation.
- **Modular Sidebar:** Refactored into clean domain sub-components with shared expansion state in `SidebarContext`:
  - `src/components/layout/sidebar-nav-types.tsx` (System types, live count badges, PRO indicators).
  - `src/components/layout/sidebar-nav-collections.tsx` (Favorites with star icons, recent collections with color dots, active-state detection via `useSearchParams()`).
  - `src/components/layout/sidebar-user-profile.tsx` (User avatar, dropdown menu, profile link, and sign out).
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

### D. Authentication Infrastructure (NextAuth v5 + GitHub & Credentials)
- **NextAuth v5 (`next-auth@beta`):** Configured with Prisma adapter (`@auth/prisma-adapter`) and JWT session strategy (`session: { strategy: 'jwt' }`).
- **Edge Split Pattern:** `src/auth.config.ts` houses edge-safe providers (GitHub OAuth and Credentials placeholder) and pure `jwt` / `session` callbacks, while `src/auth.ts` overrides Credentials with `bcryptjs` password comparison and Prisma database queries.
- **Registration Route:** `src/app/api/auth/register/route.ts` validates registration data, hashes passwords with bcrypt (12 rounds), and persists new users.
- **Route Protection (Next.js 16 Proxy):** `src/proxy.ts` exports named `export const proxy = auth(...)` with `NextResponse.redirect` protecting `/dashboard/*`, `/items/*`, and `/profile/*` routes.
- **Route Handlers:** `src/app/api/auth/[...nextauth]/route.ts` cleanly exposes NextAuth's `GET` and `POST` handlers.
- **Type Augmentations:** `src/types/next-auth.d.ts` extends `Session` with `user.id: string` and `JWT` with `id?: string`.
- **Database Driver Security:** Normalized connection strings in `src/lib/prisma.ts` and `.env` to `sslmode=verify-full` to eliminate `pg` driver deprecation warnings.
- **Automated Verification:** `npm run test:auth` (`scripts/test-auth-flow.ts`) tests providers, proxy redirects, registration validation, duplicate email rejection, and credentials sign-in.

### E. Auth UI & User Session Integration (Phase 3)
- **Custom Sign In (`/sign-in`):** Branded dark mode card with email/password validation, GitHub OAuth button, open redirect sanitization on `callbackUrl`, clear error messaging, and auto-redirect for authenticated visitors.
- **Custom Register (`/register`):** Full name, email, password, confirm password fields with validation, submit handling to `/api/auth/register`, and redirect with success banner to `/sign-in`.
- **Reusable UserAvatar (`src/components/ui/user-avatar.tsx`):** Displays GitHub user image or falls back to initials generated from name or email with responsive typography scaling.
- **Sidebar Integration & Session Scoping:** `DashboardLayout` retrieves user session and scopes `getSidebarItemTypes(userId)` and `getSidebarCollections(userId)` to active user ID.
- **Sidebar Dropdown Menu:** User profile trigger in sidebar footer opens dropdown menu with "Profile" link and native NextAuth `signOut()` handler.
- **Account Profile Page (`/profile`):** Server-rendered profile screen displaying name, email, avatar, tier, authentication method, and session sign-out action.
- **GitHub OAuth Test Script:** `scripts/test-github-oauth.ts` verifies OAuth initiation, PKCE challenges, CSRF tokens, and database account links.

### F. Email Verification & Password Reset Flows
- **VerificationToken Model Reuse:** Utilizes existing Prisma `verification_tokens` table for both email verification (24h expiry) and password reset tokens (1h expiry, namespaced identifier `password-reset:${email}`).
- **Resend Integration (`src/lib/mail.ts`):** Sends branded HTML and plain-text emails for verification (`/verify-email?token=...`) and password resets (`/reset-password?token=...`).
- **Forgot Password Flow:** Dedicated `/forgot-password` route with `ForgotPasswordForm` providing generic success feedback against email enumeration.
- **Reset Password Flow:** Dedicated `/reset-password` route with server-side token validation on load, invalid/expired token handling, `ResetPasswordForm` with password confirmation and show/hide toggles, atomic token consumption, and auto email verification on password reset.
- **Sign In Link & Feedback:** Direct "Forgot password?" link on `/sign-in` and `?reset=true` success notification alert.
- **Automated Verification:** `npm run test:reset` (`scripts/test-password-reset.ts`) tests token generation, namespace isolation, expiration, password reset, token replay protection, and bcrypt verification.

### G. Rate Limiting for Auth
- **Upstash Redis Integration (`src/lib/rate-limit.ts`):** Serverless sliding-window counter rate limiting using `@upstash/ratelimit` and `@upstash/redis` with fail-open timeout safety (`timeout: 1500`).
- **Protected Endpoints:**
  - Credentials login: Two-tier defense in `src/auth.ts` (`login-ip` 30 attempts / 15 min against password spraying, and `login` 5 attempts / 15 min keyed by `IP:email`).
  - Registration (`POST /api/auth/register`): 3 attempts / 1 hour keyed by client IP.
  - Resend verification (`POST /api/auth/resend-verification` and `resendVerificationAction`): 3 attempts / 15 min keyed by `IP:email`.
  - Forgot password (`requestPasswordResetAction` and `POST /api/auth/forgot-password`): 3 attempts / 1 hour keyed by client IP.
  - Reset password (`resetPasswordAction` and `POST /api/auth/reset-password`): 5 attempts / 15 min keyed by client IP.
- **Architectural Security:** Extracted core logic into `src/lib/auth-core.ts` (pure library code without `"use server"`) to prevent RPC parameter tampering, and prioritized trusted proxy headers (`cf-connecting-ip`, `x-real-ip`) over `x-forwarded-for` to prevent IP spoofing.
- **RFC-Compliant Responses & UI Feedback:** API routes return 429 Too Many Requests with `Retry-After` and `X-RateLimit-*` headers; Server Actions return user-friendly error messages, properly rendered across all 5 auth forms.
### H. Auth Security Remediation
- **Session Invalidation on Password Change/Reset [HIGH-1]:** Added `tokenVersion Int @default(0)` to `User` model (`20260911101800_add_user_token_version` migration applied to Neon `development` branch). Increments `tokenVersion` on password change and password reset. NextAuth `jwtCallback` in `src/auth.ts` verifies `token.tokenVersion === dbUser.tokenVersion` and invalidates (`return null`) stale sessions immediately.
- **SHA-256 Reset Token Hashing [HIGH-2]:** `src/lib/tokens.ts` hashes password reset tokens with SHA-256 before inserting into or querying `verification_tokens`. Plaintext tokens are only dispatched to user emails.
- **Atomic Registration [LOW-1]:** User creation and verification token generation in `src/app/api/auth/register/route.ts` are bound within an atomic `prisma.$transaction`.
- **Password Length Enforcement [MED-2]:** Hardened registration, reset, and profile password change endpoints and UI forms with $\le 72$ character limits preventing silent bcrypt truncation and CPU exhaustion DoS.
- **Account Enumeration Defense [MED-1]:** Unified `POST /api/auth/resend-verification` and `resendVerificationAction` responses to return an identical generic HTTP 200 message regardless of account status.
- **Automated Verification:**
  - `npm run test:session` (`scripts/test-token-version.ts`) tests token version invalidation.
  - `npm run test:atomic-reg` (`scripts/test-atomic-registration.ts`) tests atomic registration rollbacks.
  - `npm run test:length` (`scripts/test-password-length.ts`) tests 72-char bcrypt boundary constraints.

### I. Item Types & CRUD System Specifications
- **Item Types Documentation (`docs/item-types.md`):** Complete reference covering all 7 system item types (`snippet`, `prompt`, `command`, `note`, `file`, `image`, `link`), their visual accents (Lucide icons and hex colors), storage classification (`ContentType.TEXT`, `ContentType.FILE`, `ContentType.URL`), shared attributes, relational models, and tier gating.
- **Item CRUD Architecture (`docs/item-crud-architecture.md`):** System blueprint for unified item mutations in `src/actions/items.ts`, direct Prisma queries in `src/lib/db/items.ts`, unified dynamic routing at `/items/[type]`, and polymorphic UI adapters (`ItemForm`, `ItemContentRenderer`, `ItemDrawer`).

### J. Dynamic Items List View (`/items/[type]`)
- **Live Database Connection:** Replaced static mock data in `/items/[type]` with live PostgreSQL queries via Prisma (`src/lib/db/items.ts`).
- **Slug Normalization:** `resolveItemTypeBySlug` transparently normalizes both singular and plural type routes (e.g., `/items/snippets` and `/items/snippet`, `/items/notes` and `/items/note`) with React `cache()` memoization.
- **User Scoping:** Scopes queries to active authenticated user session (`auth()`) with fallback to default demo user.
- **RSC Boundary Safety:** Centralized dynamic Lucide icon rendering in `src/lib/icons.tsx` (`<ItemTypeIcon />`), eliminating RSC boundary serialization errors (`Element type is invalid`) and adhering to React Compiler static component rules.
- **Responsive 3-Column Grid:** Displays `ItemCard` grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4`) with type-matched left accent borders, tags, pin indicators, and favorite stars.
- **Header & Breadcrumbs:** Displays breadcrumb navigation (`Dashboard > [Item Type]`), page title, description, PRO badge, item counter, and polished empty state when no items exist.
### K. Unit Testing Infrastructure (Vitest)
- **Framework & Config:** Configured Vitest 5 (`vitest.config.mts`) targeting Node.js environment (`environment: 'node'`) with automatic `.env` loading and path alias resolution (`@/*`, `~/*`).
- **Target Scope:** Strictly scoped to Server Actions (`src/actions/`) and utilities (`src/lib/`). Excludes React components (`*.tsx`).
- **Test Coverage (183 passing unit tests across 15 test suites):**
  - Rate limiting (`lib/rate-limit.test.ts`), icons resolution (`lib/icons.test.ts`), auth core validation (`lib/auth-core.test.ts`), item slug normalization (`lib/items-slug.test.ts`), profile actions (`actions/profile.test.ts`), auth actions (`actions/auth.test.ts`), item queries & API (`lib/items-query.test.ts`, `lib/items-api.test.ts`), item server actions (`actions/items.test.ts`), monaco languages (`lib/monaco-languages.test.ts`), markdown utilities (`lib/markdown.test.ts`), storage service (`lib/storage.test.ts`), file constraints (`lib/file-constraints.test.ts`), upload API (`lib/upload-api.test.ts`), type creation buttons (`lib/create-type-button.test.ts`).

### L. Item Detail Drawer & Interactive UI
- **Drawer Architecture:** Slide-in `ItemDrawer` (`src/components/items/item-drawer.tsx`) built with shadcn `Sheet`, progressive loading skeleton, and color-coded type badges.
- **Provider & Context:** `ItemDrawerProvider` in `src/components/items/item-drawer-context.tsx` provides item preview metadata, dynamic API fetching (`GET /api/items/[id]`), and global viewport-fixed toast notifications.
- **Header Actions:** Quick star favorite, pin toggle, clipboard copy with temporary feedback, edit mode trigger, and destructive delete button.

### M. Item Drawer Inline Edit Mode
- **Inline Editing:** Toggle into edit mode within drawer without page navigation or modal popping.
- **Input Validation & Mutation:** Zod validation (`updateItemSchema` in `src/lib/validations/items.ts`), transactional tag reconciliation, and `updateItemAction` Server Action in `src/actions/items.ts`.

### N. Item Deletion with Confirmation Modal
- **Accessible Alert Dialog:** Built accessible confirmation dialog using `@base-ui/react/alert-dialog` (`src/components/items/delete-item-dialog.tsx`).
- **Cascading Cleanup & Storage Safety:** `deleteItem` cascades deletion of item relations and automatically deletes associated attachments from Backblaze B2 storage (`src/lib/storage.ts`).

### O. Polymorphic Item Creation Dialog
- **Dynamic Creation Form:** `CreateItemDialog` (`src/components/items/create-item-dialog.tsx`) dynamically adapts form fields according to selected item type (code/editor for snippets/commands, markdown for notes/prompts, URL for links, file upload for files/images).
- **Trigger Points:** "New Item" button in `TopBar`, header "New [Type]" button (`CreateTypeItemButton`), and empty states.

### P. Monaco Code Editor & Markdown Editor
- **Monaco Code Editor (`src/components/ui/code-editor.tsx`):** Integrated `@monaco-editor/react` with custom `devstash-dark` palette, macOS window dots, auto-height sizing, and language formatting.
- **Markdown Editor (`src/components/ui/markdown-editor.tsx`):** Tabbed Write/Preview editor with `react-markdown` and `remark-gfm` for notes and prompts.

### Q. Cloud Storage & File/Image Upload (Backblaze B2)
- **Object Storage Service (`src/lib/storage.ts`):** Direct upload and deletion via `@aws-sdk/client-s3` targeting Backblaze B2 with fallback CORS proxy download handler (`/api/files/download`).
- **File Constraints:** Enforced in `src/lib/file-constraints.ts` (Images $\le 5$ MB, Files $\le 10$ MB).
- **Dual Affordance Empty Dropzone (`src/components/items/file-image-empty-dropzone.tsx`):** Drag-and-drop auto-staging and native picker trigger for files and images list views.

### R. Image Gallery View
- **Dedicated Image Card (`src/components/items/image-card.tsx`):** 16:9 thumbnail ratio (`aspect-video`), `object-cover`, 5% hover zoom transition (`duration-300`), pin/star overlays, and tag pills.
- **Responsive 3-Column Grid:** Clean layout on `/items/images`.
- **Full-Size Modal Viewer:** High-resolution image preview modal in `ItemDrawer` with download and open-in-new-tab actions.

### S. Codebase Audit Remediation & Hardening
- **Security Hardening:** Namespaced email-change verification tokens, IDOR mitigation on file downloads via key prefix and ownership checks, stored XSS mitigation on SVGs, upload rate limiting, data-URL picture stripping from JWT payloads, and consolidated password reset validations.
- **Database & Query Performance:** Batched tag reconciliation in item mutations, bounded collection preview items (`take: 5`) and collection query limits (`take: 50`), and scoped dashboard data queries to authenticated `session.user.id`.
- **UI & State Cleanup:** Replaced render-phase state mutations with derived state in `ItemDrawer`, consolidated toast notifications under global provider, centralized icon rendering, and eliminated unused NextAuth imports.
- **Full Verification:** 221 / 221 passing unit tests across 19 suites, 14 passing integration test suites, clean Playwright MCP testing, 0 ESLint warnings, and clean production build.

---

## 3. Handy Commands

```bash
npm run dev         # Next.js dev server
npm run build       # Next.js production build (Turbopack)
npm run lint        # ESLint check
npm test            # Run Vitest unit tests (221 tests across 19 suites)
npm run test:unit   # Alias for npm test
npm run test:watch  # Run Vitest unit tests in interactive watch mode
npm run test:db     # Test Neon DB connection and print all demo data
npm run test:auth   # Run end-to-end authentication and registration test suite
npm run test:reset  # Run password reset integration tests
npm run test:profile # Run profile and settings integration tests
npm run test:rate-limit # Run rate limiting integration tests
npm run test:session # Run session invalidation token version tests
npm run test:atomic-reg # Run atomic registration transaction tests
npm run test:length  # Run password length constraint tests
npm run test:items   # Run items list view integration tests
npm run test:drawer  # Run item drawer integration tests
npm run test:edit    # Run item edit integration tests
npm run test:delete  # Run item deletion integration tests
npm run test:create  # Run item creation integration tests
npm run test:files   # Run file upload and storage integration tests
npm run studio      # Launch Prisma Studio web GUI
npm run db:migrate  # Run prisma migrate dev (dev schema changes)
npm run db:deploy   # Run prisma migrate deploy (prod migrations)
npm run db:seed     # Run prisma db seed
npm run db:clean-users # Clean test users from DB
```

---

## 4. Strict Operational Rules

1. **NEVER run `prisma db push`**. Always create migrations using `npx prisma migrate dev --name <migration_name>`.
2. **Never commit without permission** and never commit until `npm run build` passes.
3. **Workflow for any feature/fix:**
   - Document in `context/current-feature.md`
   - Create branch `feature/<name>` or `fix/<name>`
   - Implement & verify (`npm run build`, `npm run lint`)
   - Merge to `main`, delete feature branch, push to `origin/main`
   - Mark completed in `context/current-feature.md` and update history.

---

## 5. Logical Next Step
 
Core Item Knowledge Management and Audit Remediation are complete, thoroughly tested, and merged into `main`. The logical next tasks based on our roadmap are:
1. **Filter Dashboard by Collection:** Wire up `?collection=...` search param to filter dashboard items with an active filter badge and clear filter button.
2. **Collection CRUD & Management:** Implement "New Collection" creation modal in `TopBar`/sidebar and collection edit/delete actions.
3. **Search & Command Palette (Phase 3):** Implement `⌘K` / `Ctrl+K` global command palette and full-text search across items, tags, and collections.
