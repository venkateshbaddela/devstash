import "dotenv/config";
import bcrypt from "bcryptjs";
import { ContentType } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

// -----------------------------------------------------------------------------
// 1. System Item Types Specification (from seed-spec.md)
// -----------------------------------------------------------------------------
const SYSTEM_ITEM_TYPES = [
  { name: "snippet", icon: "Code", color: "#3b82f6", contentType: ContentType.TEXT },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6", contentType: ContentType.TEXT },
  { name: "command", icon: "Terminal", color: "#f97316", contentType: ContentType.TEXT },
  { name: "note", icon: "StickyNote", color: "#fde047", contentType: ContentType.TEXT },
  { name: "file", icon: "File", color: "#6b7280", contentType: ContentType.FILE },
  { name: "image", icon: "Image", color: "#ec4899", contentType: ContentType.FILE },
  { name: "link", icon: "Link", color: "#10b981", contentType: ContentType.URL },
];

// -----------------------------------------------------------------------------
// 2. Collections Specification (from seed-spec.md)
// -----------------------------------------------------------------------------
const COLLECTIONS = [
  {
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    color: "#3b82f6",
    isFavorite: true,
  },
  {
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    color: "#8b5cf6",
    isFavorite: true,
  },
  {
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    color: "#f97316",
    isFavorite: false,
  },
  {
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
    color: "#10b981",
    isFavorite: true,
  },
  {
    name: "Design Resources",
    description: "UI/UX resources and references",
    color: "#ec4899",
    isFavorite: false,
  },
];

// -----------------------------------------------------------------------------
// 3. Items Specification (from seed-spec.md)
// -----------------------------------------------------------------------------
interface SeedItem {
  title: string;
  typeName: string;
  description: string;
  content: string;
  url?: string;
  language?: string;
  collections: string[];
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
}

const SEED_ITEMS: SeedItem[] = [
  // --- React Patterns (3 snippets) ---
  {
    title: "useDebounce Hook",
    typeName: "snippet",
    language: "typescript",
    description: "Custom hook that delays updating a value until a specified delay has elapsed",
    content: `import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}`,
    collections: ["React Patterns"],
    tags: ["react", "hooks", "typescript", "performance"],
    isPinned: true,
    isFavorite: true,
  },
  {
    title: "useLocalStorage Hook",
    typeName: "snippet",
    language: "typescript",
    description: "Persistent state hook synchronized with browser window.localStorage",
    content: `import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    }
  };

  return [storedValue, setValue];
}`,
    collections: ["React Patterns"],
    tags: ["react", "hooks", "typescript", "storage"],
    isPinned: true,
    isFavorite: false,
  },
  {
    title: "Compound Component Pattern (Accordion)",
    typeName: "snippet",
    language: "typescript",
    description: "Context-driven compound component pattern for flexible composable UIs",
    content: `import React, { createContext, useContext, useState } from "react";

interface AccordionContextType {
  expandedId: string | null;
  toggle: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

export function Accordion({ children }: { children: React.ReactNode }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <AccordionContext.Provider value={{ expandedId, toggle }}>
      <div className="divide-y divide-border border rounded-lg">{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("AccordionItem must be inside Accordion");
  const isOpen = ctx.expandedId === id;

  return (
    <div className="p-4">
      <button onClick={() => ctx.toggle(id)} className="w-full flex justify-between font-medium">
        {title}
        <span>{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}`,
    collections: ["React Patterns"],
    tags: ["react", "patterns", "components", "architecture"],
    isPinned: false,
    isFavorite: true,
  },

  // --- AI Workflows (3 prompts) ---
  {
    title: "Security & Vulnerability Code Review",
    typeName: "prompt",
    language: "markdown",
    description: "Senior application security auditor persona to inspect pull requests for OWASP vulnerabilities",
    content: `Act as a senior application security engineer. Analyze the following code diff for potential security vulnerabilities:

Focus on:
1. Injection flaws (SQL, shell command, template, XSS)
2. Authentication & session authorization bypasses
3. Sensitive credential leakage or improper secret handling
4. SSRF and untrusted input validation
5. Insecure deserialization

Provide actionable remediation guidance with before/after code examples for each finding.`,
    collections: ["AI Workflows"],
    tags: ["ai", "prompts", "security", "code-review"],
    isPinned: true,
    isFavorite: true,
  },
  {
    title: "Technical Documentation Generator",
    typeName: "prompt",
    language: "markdown",
    description: "AI prompt to transform engineering code modules into comprehensive developer documentation",
    content: `You are an expert technical writer. Given the following TypeScript module or API endpoint:

1. Write a 2-sentence executive summary of the module's core responsibility.
2. Document every exported function, type, and interface with parameter breakdowns.
3. Provide 2 realistic usage examples (happy path and error handling).
4. Highlight performance considerations and third-party dependencies.
Maintain a concise, developer-native tone.`,
    collections: ["AI Workflows"],
    tags: ["ai", "prompts", "documentation", "typescript"],
    isPinned: false,
    isFavorite: false,
  },
  {
    title: "Clean Architecture Refactoring Guide",
    typeName: "prompt",
    language: "markdown",
    description: "Prompt to guide refactoring complex spaghetti code into modular SOLID domain layers",
    content: `Act as a software architect specializing in Clean Architecture and Domain-Driven Design (DDD).
Analyze the provided function or service:

- Separate business rules from transport/database details.
- Identify domain entities and extract repository interfaces.
- Decouple side effects and make pure functions unit-testable.
- Generate step-by-step refactoring stages with intermediate verification tests.`,
    collections: ["AI Workflows"],
    tags: ["ai", "prompts", "refactoring", "clean-code"],
    isPinned: false,
    isFavorite: true,
  },

  // --- DevOps (1 snippet, 1 command, 2 links) ---
  {
    title: "Next.js 16 Multi-Stage Production Dockerfile",
    typeName: "snippet",
    language: "dockerfile",
    description: "Optimized Alpine container build utilizing standalone Next.js output for minimal image size",
    content: `FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]`,
    collections: ["DevOps"],
    tags: ["docker", "nextjs", "devops", "container"],
    isPinned: false,
    isFavorite: false,
  },
  {
    title: "Deploy with Healthcheck Verification",
    typeName: "command",
    language: "bash",
    description: "Deployment pipeline script with automated curl polling until the app responds healthy",
    content: "docker compose pull && docker compose up -d --remove-orphans && until [ $(curl -s -o /dev/null -w \"%{http_code}\" http://localhost:3000/api/health) -eq 200 ]; do sleep 2; done && echo 'Deployment Verified 🚀'",
    collections: ["DevOps", "Terminal Commands"],
    tags: ["deployment", "docker", "bash", "devops"],
    isPinned: false,
    isFavorite: true,
  },
  {
    title: "Neon Serverless PostgreSQL Documentation",
    typeName: "link",
    language: "url",
    description: "Official documentation for branching, autoscaling, and connection pooling in Neon Postgres",
    content: "https://neon.tech/docs/introduction",
    url: "https://neon.tech/docs/introduction",
    collections: ["DevOps"],
    tags: ["postgres", "neon", "database", "documentation"],
    isPinned: false,
    isFavorite: true,
  },
  {
    title: "Cloudflare R2 Storage Documentation",
    typeName: "link",
    language: "url",
    description: "S3-compatible zero-egress distributed object storage API and JavaScript SDK reference",
    content: "https://developers.cloudflare.com/r2/",
    url: "https://developers.cloudflare.com/r2/",
    collections: ["DevOps"],
    tags: ["cloudflare", "storage", "r2", "cloud"],
    isPinned: false,
    isFavorite: false,
  },

  // --- Terminal Commands (4 commands) ---
  {
    title: "Interactive Git Rebase on Main",
    typeName: "command",
    language: "bash",
    description: "Cleanly rebase current feature branch onto latest origin/main with automatic stashing",
    content: "git fetch origin main && git rebase -i --autostash origin/main",
    collections: ["Terminal Commands"],
    tags: ["git", "cli", "workflow"],
    isPinned: true,
    isFavorite: true,
  },
  {
    title: "Prune Unused Docker Cache & Containers",
    typeName: "command",
    language: "bash",
    description: "Reclaim disk space by deleting stopped containers, unused networks, and dangling images",
    content: "docker system prune -af --volumes",
    collections: ["Terminal Commands"],
    tags: ["docker", "cli", "cleanup", "devops"],
    isPinned: false,
    isFavorite: false,
  },
  {
    title: "Kill Process Running on Port",
    typeName: "command",
    language: "bash",
    description: "Identify and immediately terminate any process or zombie listening on port 3000",
    content: "lsof -ti :3000 | xargs kill -9",
    collections: ["Terminal Commands"],
    tags: ["bash", "process", "networking", "cli"],
    isPinned: false,
    isFavorite: true,
  },
  {
    title: "Audit and Update Outdated Dependencies",
    typeName: "command",
    language: "bash",
    description: "Inspect outdated package versions and execute automatic vulnerability resolution",
    content: "npm outdated && npm audit fix",
    collections: ["Terminal Commands"],
    tags: ["npm", "node", "security", "cli"],
    isPinned: false,
    isFavorite: false,
  },

  // --- Design Resources (4 links with real URLs) ---
  {
    title: "Tailwind CSS v4 Documentation",
    typeName: "link",
    language: "url",
    description: "Official guide to Tailwind CSS v4 CSS-first configuration and dynamic @theme directive",
    content: "https://tailwindcss.com/docs",
    url: "https://tailwindcss.com/docs",
    collections: ["Design Resources"],
    tags: ["css", "tailwind", "design", "documentation"],
    isPinned: false,
    isFavorite: true,
  },
  {
    title: "shadcn/ui Component Library",
    typeName: "link",
    language: "url",
    description: "Accessible, customizable Radix Primitives and Tailwind components designed for Next.js",
    content: "https://ui.shadcn.com",
    url: "https://ui.shadcn.com",
    collections: ["Design Resources"],
    tags: ["react", "ui", "components", "design-system"],
    isPinned: false,
    isFavorite: true,
  },
  {
    title: "Linear Design System & Craft",
    typeName: "link",
    language: "url",
    description: "Design philosophy, visual principles, and interactions behind Linear's developer UI",
    content: "https://linear.app/design",
    url: "https://linear.app/design",
    collections: ["Design Resources"],
    tags: ["design-system", "ui", "ux", "inspiration"],
    isPinned: false,
    isFavorite: false,
  },
  {
    title: "Lucide React Icons",
    typeName: "link",
    language: "url",
    description: "Complete catalog of open-source, customizable SVG icons for React applications",
    content: "https://lucide.dev/icons",
    url: "https://lucide.dev/icons",
    collections: ["Design Resources"],
    tags: ["icons", "lucide", "svg", "design"],
    isPinned: false,
    isFavorite: false,
  },
];

async function main() {
  console.log("🌱 Starting database seeding per seed-spec.md...\n");

  // 1. Clean existing data for a clean, deterministic seed state
  console.log("🧹 Cleaning existing data...");
  await prisma.itemCollection.deleteMany({});
  await prisma.itemTag.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.collection.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("   Existing records cleaned.\n");

  // 2. Create Demo User
  console.log("👤 Creating Demo User...");
  const hashedPassword = await bcrypt.hash("12345678", 12);

  const demoUser = await prisma.user.create({
    data: {
      email: "demo@devstash.io",
      name: "Demo User",
      password: hashedPassword,
      isPro: false,
      emailVerified: new Date(),
    },
  });
  console.log(`   Created User: ${demoUser.name} (${demoUser.email})\n`);

  // 3. Create System Item Types
  console.log("🏷️  Creating System Item Types...");
  const typeMap = new Map<string, string>();

  for (const itemType of SYSTEM_ITEM_TYPES) {
    const createdType = await prisma.itemType.create({
      data: {
        name: itemType.name,
        icon: itemType.icon,
        color: itemType.color,
        isSystem: true,
        userId: demoUser.id,
      },
    });
    typeMap.set(itemType.name, createdType.id);
  }
  console.log(`   Created ${SYSTEM_ITEM_TYPES.length} System Item Types.\n`);

  // 4. Create Collections
  console.log("📁 Creating Collections...");
  const collectionMap = new Map<string, string>();

  for (const col of COLLECTIONS) {
    const createdCollection = await prisma.collection.create({
      data: {
        name: col.name,
        description: col.description,
        color: col.color,
        isFavorite: col.isFavorite,
        userId: demoUser.id,
      },
    });
    collectionMap.set(col.name, createdCollection.id);
  }
  console.log(`   Created ${COLLECTIONS.length} Collections.\n`);

  // 5. Create Items, Relations, and Tags
  console.log("📦 Creating Items, Collections links, and Tags...");
  const tagMap = new Map<string, string>();

  for (const item of SEED_ITEMS) {
    const typeId = typeMap.get(item.typeName);
    if (!typeId) {
      console.warn(`   ⚠️ Type ${item.typeName} not found, skipping item: ${item.title}`);
      continue;
    }

    const sysType = SYSTEM_ITEM_TYPES.find((t) => t.name === item.typeName);
    const contentType = sysType?.contentType ?? ContentType.TEXT;

    const createdItem = await prisma.item.create({
      data: {
        title: item.title,
        contentType,
        content: contentType === ContentType.TEXT ? item.content : null,
        url: item.url || (contentType === ContentType.URL ? item.content : null),
        description: item.description,
        language: item.language,
        isPinned: item.isPinned,
        isFavorite: item.isFavorite,
        userId: demoUser.id,
        itemTypeId: typeId,
      },
    });

    // Link Collections (Many-to-Many)
    for (const colName of item.collections) {
      const colId = collectionMap.get(colName);
      if (colId) {
        await prisma.itemCollection.create({
          data: {
            itemId: createdItem.id,
            collectionId: colId,
          },
        });
      }
    }

    // Link Tags (User-scoped Many-to-Many)
    for (const tagName of item.tags) {
      let tagId = tagMap.get(tagName);
      if (!tagId) {
        const tag = await prisma.tag.upsert({
          where: {
            userId_name: {
              userId: demoUser.id,
              name: tagName,
            },
          },
          update: {},
          create: {
            name: tagName,
            userId: demoUser.id,
          },
        });
        tagId = tag.id;
        tagMap.set(tagName, tagId);
      }

      await prisma.itemTag.create({
        data: {
          itemId: createdItem.id,
          tagId,
        },
      });
    }
  }

  console.log(`   Created ${SEED_ITEMS.length} Items with relations and tags.\n`);
  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
