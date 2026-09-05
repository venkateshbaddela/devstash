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
  { id: 'files', name: 'Files', count: 5, icon: 'File', color: '#6b7280' },
  { id: 'images', name: 'Images', count: 3, icon: 'Image', color: '#ec4899' },
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
