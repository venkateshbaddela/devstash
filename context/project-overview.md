# DevStash — Project Overview

> **DevStash** is a fast, searchable, developer-native knowledge hub for snippets, prompts, commands, notes, links, files, and images.

- **Status:** Foundation / MVP
- **Primary Audience:** Developers, AI-first engineers, educators, full-stack builders.
- **Product Loop:** Capture → Organize → Find → Use → Enhance.

---

## 1. Tech Stack & Architecture

| Layer | Technology | Key Details |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server components default, Server Actions for mutations |
| **UI Library** | React 19 | React Compiler enabled (`reactCompiler: true`) |
| **Language** | TypeScript 5 | Strict mode, no `any` types |
| **Styling** | Tailwind CSS v4 | CSS-based config (`@import "tailwindcss";`, `@theme` in `globals.css`) |
| **Components** | shadcn/ui + Lucide Icons | Clean, accessible, developer-focused |
| **Database** | Neon PostgreSQL | Hosted Postgres |
| **ORM** | Prisma 7 | Migrations-only workflow (`prisma migrate dev`) |
| **Auth** | Auth.js / NextAuth | GitHub OAuth & Email/Password |
| **Storage** | Cloudflare R2 | S3-compatible storage for files and images (Pro) |
| **Payments** | Stripe | Customer portal, webhook-driven subscriptions |
| **AI** | OpenAI API | Server-side abstraction for tags, summaries, prompts |
| **Testing** | Vitest | Fast Node.js unit tests for Server Actions and utilities |

### Architectural Rules
- **Monolith first:** Single Next.js repository. Do not prematurely split into separate microservices.
- **Server Components by default:** Only add `'use client'` where client interactivity or state is required.
- **Tailwind CSS v4:** Never create a `tailwind.config.ts/js`. Theme tokens belong in `src/app/globals.css` under `@theme`.
- **Database Migrations:** Never run `prisma db push`. All schema changes must use `prisma migrate dev`.
- **Ownership Scoping:** Every query/mutation must scope to the session user's `userId`. Never trust client-provided IDs.

---

## 2. Core Data Model

```text
User
 ├── Item Types (System defaults + Custom Pro types)
 ├── Collections (Many-to-Many with Items)
 ├── Tags (User-scoped, Many-to-Many with Items)
 └── Items (Central entity)
```

### System Item Types

| Type | Storage | Icon | Color Accent | Purpose |
|---|---|---|---|---|
| **Snippet** | Text | `Code` | `#3b82f6` (Blue) | Code blocks with syntax highlighting & language |
| **Prompt** | Text | `Sparkles` | `#8b5cf6` (Purple) | AI system prompts, templates, and workflows |
| **Command** | Text | `Terminal` | `#f97316` (Orange) | CLI commands, shell one-liners, scripts |
| **Note** | Text | `StickyNote` | `#fde047` (Yellow) | Markdown documentation, scratch notes, checklists |
| **File** | File | `File` | `#6b7280` (Gray) | Documents, PDFs, configs stored in R2 |
| **Image** | File | `Image` | `#ec4899` (Pink) | Screenshots, architecture diagrams stored in R2 |
| **Link** | URL | `Link` | `#10b981` (Green) | Bookmarks, documentation links, PR references |

### Storage Rules by `ContentType`
- **`TEXT`** (Snippet, Prompt, Command, Note): `content` stores markdown/plain text; `fileUrl` is null.
- **`URL`** (Link): `url` stores destination URL; `content` stores optional description/notes.
- **`FILE`** (File, Image): Stored in Cloudflare R2; `fileUrl`, `fileName`, `fileSize`, `mimeType`, and `storageKey` tracked in database.

### Core Relationships
1. **Items & Collections (Many-to-Many):** An item does *not* live in a single folder; it can belong to multiple collections simultaneously (e.g., a hook can be in both "React Patterns" and "Interview Prep").
2. **Tags (User-scoped):** Tags are unique per user and cross-cut across item types and collections.

---

## 3. Prisma Schema Reference

```prisma
enum ContentType {
  TEXT
  URL
  FILE
}

model User {
  id                   String       @id @default(cuid())
  name                 String?
  email                String?      @unique
  emailVerified        DateTime?
  image                String?
  isPro                Boolean      @default(false)
  stripeCustomerId     String?      @unique
  stripeSubscriptionId String?      @unique

  items                Item[]
  collections          Collection[]
  itemTypes            ItemType[]
  tags                 Tag[]

  createdAt            DateTime     @default(now())
  updatedAt            DateTime     @updatedAt
}

model ItemType {
  id        String   @id @default(cuid())
  name      String
  icon      String
  color     String
  isSystem  Boolean  @default(false)

  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     Item[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, name])
  @@index([userId])
}

model Item {
  id          String           @id @default(cuid())
  title       String
  contentType ContentType
  content     String?          @db.Text
  description String?          @db.Text
  url         String?

  fileUrl     String?
  fileName    String?
  fileSize    BigInt?
  mimeType    String?
  storageKey  String?

  language    String?
  isFavorite  Boolean          @default(false)
  isPinned    Boolean          @default(false)

  userId      String
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  itemTypeId  String
  itemType    ItemType         @relation(fields: [itemTypeId], references: [id], onDelete: Restrict)

  collections ItemCollection[]
  tags        ItemTag[]

  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@index([userId, createdAt])
  @@index([userId, isPinned])
  @@index([userId, isFavorite])
  @@index([userId, itemTypeId])
}

model Collection {
  id            String           @id @default(cuid())
  name          String
  description   String?          @db.Text
  isFavorite    Boolean          @default(false)
  color         String?
  defaultTypeId String?

  userId        String
  user          User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  items         ItemCollection[]

  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@index([userId, createdAt])
  @@index([userId, isFavorite])
}

model ItemCollection {
  itemId       String
  collectionId String
  addedAt      DateTime   @default(now())

  item         Item       @relation(fields: [itemId], references: [id], onDelete: Cascade)
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  @@id([itemId, collectionId])
  @@index([collectionId, addedAt])
}

model Tag {
  id        String    @id @default(cuid())
  name      String
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     ItemTag[]

  createdAt DateTime  @default(now())

  @@unique([userId, name])
  @@index([userId])
}

model ItemTag {
  itemId String
  tagId  String

  item   Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([itemId, tagId])
  @@index([tagId])
}
```

---

## 4. UI / UX Design & Layout

### Design Aesthetics
- **Style:** Modern, minimal, developer-focused (inspired by Linear, Raycast, Notion).
- **Theme:** Dark-mode first with high contrast, subtle borders, restrained shadows.
- **Reference Screenshots:**
  - Main Dashboard: `@context/screenshots/dashboard-ui-main.png`
  - Item Drawer: `@context/screenshots/dashboard-ui-drawer.png`

### Key UI Components
1. **Sidebar Navigation (Left):**
   - Top: DevStash logo & collapse toggle.
   - Types: System types with icons and real-time item counts.
   - Collections: Collapsible sections for *Favorites* (starred) and *All Collections* with counts.
   - Bottom: Authenticated user profile (avatar, name, email) and settings trigger.
2. **Top Navigation Bar:**
   - Global Search input (trigger for `⌘K` command palette).
   - Quick action buttons: `+ New Collection` and `+ New Item`.
3. **Main Dashboard View:**
   - Header with greeting and subtitle.
   - **Collections Grid:** Visual cards featuring collection title, star toggle, item count, description, and type badge pills with custom accent borders.
   - **Pinned Section:** Quick-access list of pinned/starred items with title, badges, description, tag chips, and relative date.
4. **Slide-over Item Drawer:**
   - Quick-view drawer on the right side upon clicking any item.
   - Header: Item type icon, title, type badge, language tag, favorite/pin toggles, copy, edit, delete buttons.
   - Body: Description, syntax-highlighted code/markdown viewer with line numbers, tags list, collection badges, and creation/update timestamps.

---

## 5. Plans & Feature Entitlements

| Feature | Free Tier | Pro Tier ($8/mo) |
|---|---|---|
| **Items Limit** | Up to 50 items | Unlimited |
| **Collections Limit** | Up to 3 collections | Unlimited |
| **Item Types** | Snippet, Prompt, Command, Note, Link | All types + Custom Types |
| **File & Image Uploads** | ❌ None | ✅ Cloudflare R2 uploads |
| **AI Features** | ❌ None | ✅ Auto-tagging, summaries, prompt optimizer |
| **Data Export** | ❌ None | ✅ JSON & ZIP export |

> **Development Rule:** Check entitlements using a centralized helper (e.g., `canAccess(user, 'ai')`). In local development and testing, bypass restrictions so all features can be verified.

---

## 6. Development Roadmap & Scope

### Phase 1 — Foundation (Current)
- Next.js 16 + React 19 + Tailwind v4 setup.
- Mock data foundation for dashboard UI development.
- Database setup (Prisma + Neon Postgres) and Auth.js integration.

### Phase 2 — Core Knowledge Management
- Dashboard UI implementation (Sidebar, Collections grid, Pinned items).
- Item Drawer with syntax highlighting and copy-to-clipboard.
- Create / Edit / Delete items and collections with many-to-many relationships.

### Phase 3 — Search & Command Palette
- `⌘K` / `Ctrl+K` global command palette.
- PostgreSQL full-text search across titles, descriptions, content, tags, and types.
- Filtering by type, tag, and collection.

### Phase 4 — Pro Features & Storage
- Cloudflare R2 integration for file and image uploads.
- Stripe subscription integration with webhooks.

### Phase 5 — AI Enhancements
- AI auto-tag generation, code explanations, and prompt optimization via OpenAI API.

### Out of MVP Scope (Deferred)
- Team workspaces / real-time collaboration.
- Dedicated search clusters (Elasticsearch/Typesense) or Redis caching.
- Browser / VS Code extensions and CLI tool.
