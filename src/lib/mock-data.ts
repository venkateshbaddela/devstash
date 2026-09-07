// Mock data for the dashboard UI (single source of truth until DB integration)

export const currentUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  avatarUrl: '',
  isPro: true,
}

export const itemTypes = [
  { id: 'snippets', name: 'Snippets', count: 24, icon: 'Code', color: '#3b82f6' },
  { id: 'prompts', name: 'Prompts', count: 18, icon: 'Sparkles', color: '#8b5cf6' },
  { id: 'commands', name: 'Commands', count: 15, icon: 'Terminal', color: '#f97316' },
  { id: 'notes', name: 'Notes', count: 12, icon: 'StickyNote', color: '#fde047' },
  { id: 'files', name: 'Files', count: 5, icon: 'File', color: '#6b7280', isPro: true },
  { id: 'images', name: 'Images', count: 3, icon: 'Image', color: '#ec4899', isPro: true },
  { id: 'links', name: 'Links', count: 8, icon: 'Link', color: '#10b981' },
]

export const collections = [
  {
    id: 'col-1',
    name: 'React Patterns',
    description: 'Common React patterns and hooks',
    itemCount: 12,
    isFavorite: true,
    accentColor: '#3b82f6',
    types: ['Code', 'StickyNote', 'Link'],
  },
  {
    id: 'col-2',
    name: 'Python Snippets',
    description: 'Useful Python code snippets',
    itemCount: 8,
    isFavorite: false,
    accentColor: '#3b82f6',
    types: ['Code', 'StickyNote'],
  },
  {
    id: 'col-3',
    name: 'Context Files',
    description: 'AI context files for projects',
    itemCount: 5,
    isFavorite: true,
    accentColor: '#6b7280',
    types: ['StickyNote', 'File'],
  },
  {
    id: 'col-4',
    name: 'Interview Prep',
    description: 'Technical interview preparation',
    itemCount: 24,
    isFavorite: false,
    accentColor: '#fde047',
    types: ['StickyNote', 'Code', 'Link', 'Sparkles'],
  },
  {
    id: 'col-5',
    name: 'Git Commands',
    description: 'Frequently used git commands',
    itemCount: 15,
    isFavorite: true,
    accentColor: '#f97316',
    types: ['Terminal', 'StickyNote'],
  },
  {
    id: 'col-6',
    name: 'AI Prompts',
    description: 'Curated AI prompts for coding',
    itemCount: 18,
    isFavorite: false,
    accentColor: '#8b5cf6',
    types: ['Sparkles', 'Code', 'StickyNote'],
  },
]

export const items = [
  {
    id: 'item-1',
    title: 'useAuth Hook',
    type: 'Snippets',
    typeIcon: 'Code',
    typeColor: '#3b82f6',
    description: 'Custom authentication hook for React applications',
    content: `import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}`,
    language: 'typescript',
    tags: ['react', 'auth', 'hooks'],
    collections: ['React Patterns'],
    isPinned: true,
    isFavorite: true,
    date: 'Jan 15',
    createdAt: 'January 15, 2024',
    updatedAt: 'January 15, 2024',
  },
  {
    id: 'item-2',
    title: 'API Error Handling Pattern',
    type: 'Snippets',
    typeIcon: 'Code',
    typeColor: '#3b82f6',
    description: 'Fetch wrapper with exponential backoff retry logic',
    content: `async function fetchWithRetry(url: string, options = {}, retries = 3, backoff = 300) {
  try {
    const response = await fetch(url, options)
    if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`)
    return await response.json()
  } catch (error) {
    if (retries <= 1) throw error
    await new Promise(resolve => setTimeout(resolve, backoff))
    return fetchWithRetry(url, options, retries - 1, backoff * 2)
  }
}`,
    language: 'typescript',
    tags: ['react', 'auth', 'hooks'],
    collections: ['React Patterns'],
    isPinned: true,
    isFavorite: false,
    date: 'Jan 12',
    createdAt: 'January 12, 2024',
    updatedAt: 'January 12, 2024',
  },
  {
    id: 'item-3',
    title: 'Undo Last Commit (Keep Changes)',
    type: 'Commands',
    typeIcon: 'Terminal',
    typeColor: '#f97316',
    description: 'Frequently used git command to undo commit while keeping staged changes',
    content: 'git reset --soft HEAD~1',
    language: 'bash',
    tags: ['git', 'cli', 'version-control'],
    collections: ['Git Commands'],
    isPinned: false,
    isFavorite: true,
    date: 'Jan 10',
    createdAt: 'January 10, 2024',
    updatedAt: 'January 10, 2024',
  },
  {
    id: 'item-4',
    title: 'Code Review Security Auditor',
    type: 'Prompts',
    typeIcon: 'Sparkles',
    typeColor: '#8b5cf6',
    description: 'Curated AI prompt for reviewing code diffs for security vulnerabilities',
    content: `Act as a senior application security engineer. Analyze the following code diff for potential security vulnerabilities, focusing on:
1. Injection flaws (SQL, command, XSS)
2. Authentication & authorization flaws
3. Sensitive data exposure or credential leaks
4. SSRF or untrusted input handling

Provide actionable remediation guidance with code examples for each issue found.`,
    language: 'markdown',
    tags: ['ai', 'prompts', 'security'],
    collections: ['AI Prompts'],
    isPinned: false,
    isFavorite: false,
    date: 'Jan 8',
    createdAt: 'January 8, 2024',
    updatedAt: 'January 8, 2024',
  },
  {
    id: 'item-5',
    title: 'PostgreSQL Connection Pooling Guide',
    type: 'Notes',
    typeIcon: 'StickyNote',
    typeColor: '#fde047',
    description: 'Production best practices for Neon & Prisma connection pooling in serverless environments',
    content: `# Neon + Prisma Connection Pooling
- Use direct connection for Prisma migrations: DIRECT_URL
- Use pooled connection string for runtime queries: DATABASE_URL
- Configure pgBouncer connection limit according to concurrency tier`,
    language: 'markdown',
    tags: ['database', 'postgres', 'prisma'],
    collections: ['Context Files'],
    isPinned: true,
    isFavorite: true,
    date: 'Jan 7',
    createdAt: 'January 7, 2024',
    updatedAt: 'January 7, 2024',
  },
  {
    id: 'item-6',
    title: 'Docker Multi-Stage Next.js Build',
    type: 'Snippets',
    typeIcon: 'Code',
    typeColor: '#3b82f6',
    description: 'Optimized multi-stage Dockerfile producing minimal standalone Next.js image',
    content: `FROM node:20-alpine AS base
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]`,
    language: 'dockerfile',
    tags: ['docker', 'nextjs', 'devops'],
    collections: ['React Patterns'],
    isPinned: false,
    isFavorite: false,
    date: 'Jan 6',
    createdAt: 'January 6, 2024',
    updatedAt: 'January 6, 2024',
  },
  {
    id: 'item-7',
    title: 'Tailwind CSS v4 Documentation',
    type: 'Links',
    typeIcon: 'Link',
    typeColor: '#10b981',
    description: 'Official v4 release documentation highlighting CSS-first configuration and @theme directive',
    content: 'https://tailwindcss.com/docs/v4-beta',
    language: 'url',
    tags: ['css', 'tailwind', 'documentation'],
    collections: ['React Patterns'],
    isPinned: false,
    isFavorite: true,
    date: 'Jan 5',
    createdAt: 'January 5, 2024',
    updatedAt: 'January 5, 2024',
  },
  {
    id: 'item-8',
    title: 'Kill Process Running on Specific Port',
    type: 'Commands',
    typeIcon: 'Terminal',
    typeColor: '#f97316',
    description: 'One-liner to locate and terminate any process listening on port 3000',
    content: 'lsof -ti :3000 | xargs kill -9',
    language: 'bash',
    tags: ['cli', 'bash', 'networking'],
    collections: ['Git Commands'],
    isPinned: false,
    isFavorite: false,
    date: 'Jan 4',
    createdAt: 'January 4, 2024',
    updatedAt: 'January 4, 2024',
  },
  {
    id: 'item-9',
    title: 'Cloud Architecture Overview Diagram',
    type: 'Images',
    typeIcon: 'Image',
    typeColor: '#ec4899',
    description: 'High-level AWS & Cloudflare edge routing architecture diagram for media assets',
    content: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8',
    language: 'image',
    tags: ['architecture', 'cloud', 'diagram'],
    collections: ['Context Files'],
    isPinned: false,
    isFavorite: false,
    date: 'Jan 3',
    createdAt: 'January 3, 2024',
    updatedAt: 'January 3, 2024',
  },
  {
    id: 'item-10',
    title: 'Production .env Configuration Template',
    type: 'Files',
    typeIcon: 'File',
    typeColor: '#6b7280',
    description: 'Sanitized environment variables schema for staging and production deployments',
    content: `DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
NEXTAUTH_SECRET="super-secret-key-at-least-32-chars"
NEXTAUTH_URL="https://app.devstash.dev"
CLOUDFLARE_R2_ACCESS_KEY_ID=""
CLOUDFLARE_R2_SECRET_ACCESS_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""`,
    language: 'shell',
    tags: ['env', 'security', 'deployment'],
    collections: ['Context Files'],
    isPinned: false,
    isFavorite: true,
    date: 'Jan 2',
    createdAt: 'January 2, 2024',
    updatedAt: 'January 2, 2024',
  },
  {
    id: 'item-11',
    title: 'System Prompt for Technical Writer',
    type: 'Prompts',
    typeIcon: 'Sparkles',
    typeColor: '#8b5cf6',
    description: 'Persona prompt designed to convert engineering RFCs into clear developer docs',
    content: `You are an expert developer documentation writer. Given the following engineering RFC or PR description, extract:
1. Summary of changes and why they matter.
2. Step-by-step setup or migration guide.
3. Code examples with TypeScript types.
Maintain a concise, direct tone.`,
    language: 'markdown',
    tags: ['ai', 'prompts', 'docs'],
    collections: ['AI Prompts'],
    isPinned: false,
    isFavorite: false,
    date: 'Dec 30',
    createdAt: 'December 30, 2023',
    updatedAt: 'December 30, 2023',
  },
  {
    id: 'item-12',
    title: 'React Server Components Best Practices',
    type: 'Notes',
    typeIcon: 'StickyNote',
    typeColor: '#fde047',
    description: 'Core rules for data fetching, caching boundaries, and passing props across client-server boundaries',
    content: `# RSC Best Practices
- Keep components as Server Components by default
- Move 'use client' boundaries down to the leaves of the render tree
- Never pass sensitive database connection objects to client components
- Parallelize independent data fetches with Promise.all`,
    language: 'markdown',
    tags: ['react', 'rsc', 'nextjs'],
    collections: ['React Patterns'],
    isPinned: false,
    isFavorite: true,
    date: 'Dec 28',
    createdAt: 'December 28, 2023',
    updatedAt: 'December 28, 2023',
  },
]

export const mockData = {
  currentUser,
  itemTypes,
  collections,
  items,
}

export type CurrentUser = typeof currentUser
export type ItemType = (typeof itemTypes)[number]
export type Collection = (typeof collections)[number]
export type Item = (typeof items)[number]
