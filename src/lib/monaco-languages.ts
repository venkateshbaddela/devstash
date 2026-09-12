/**
 * Monaco Editor language mapping and utility functions.
 */

// Mapping of common language aliases and file extensions to official Monaco Editor language IDs
const LANGUAGE_MAP: Record<string, string> = {
  // JavaScript / TypeScript
  js: "javascript",
  jsx: "javascript",
  javascript: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  typescript: "typescript",

  // Shell / Bash / CLI
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  shell: "shell",
  terminal: "shell",
  command: "shell",
  cli: "shell",
  ps1: "powershell",
  powershell: "powershell",
  cmd: "bat",
  bat: "bat",

  // Python
  py: "python",
  python: "python",
  py3: "python",

  // Web
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  less: "less",
  svg: "xml",
  xml: "xml",

  // Data / Config
  json: "json",
  jsonc: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "ini",
  ini: "ini",
  sql: "sql",
  mysql: "sql",
  pgsql: "sql",
  postgres: "sql",
  graphql: "graphql",
  gql: "graphql",

  // Systems / Backend
  rust: "rust",
  rs: "rust",
  go: "go",
  golang: "go",
  c: "c",
  cpp: "cpp",
  "c++": "cpp",
  cs: "csharp",
  "c#": "csharp",
  csharp: "csharp",
  java: "java",
  kotlin: "kotlin",
  kt: "kotlin",
  swift: "swift",
  php: "php",
  ruby: "ruby",
  rb: "ruby",
  lua: "lua",
  r: "r",
  dart: "dart",

  // DevOps
  docker: "dockerfile",
  dockerfile: "dockerfile",

  // Markup / Docs
  md: "markdown",
  markdown: "markdown",
  text: "plaintext",
  txt: "plaintext",
  plaintext: "plaintext",
};

// Friendly display labels for known languages
const DISPLAY_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  shell: "Shell",
  bash: "Bash",
  zsh: "Zsh",
  powershell: "PowerShell",
  python: "Python",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  json: "JSON",
  yaml: "YAML",
  sql: "SQL",
  graphql: "GraphQL",
  rust: "Rust",
  go: "Go",
  cpp: "C++",
  csharp: "C#",
  c: "C",
  java: "Java",
  kotlin: "Kotlin",
  swift: "Swift",
  php: "PHP",
  ruby: "Ruby",
  dockerfile: "Dockerfile",
  markdown: "Markdown",
  plaintext: "Plain Text",
};

/**
 * Normalizes a user-entered language name or file extension to an official Monaco language identifier.
 * Falls back to "plaintext" if unknown or unspecified.
 */
export function normalizeMonacoLanguage(lang?: string | null): string {
  if (!lang || typeof lang !== "string") return "plaintext";
  const cleaned = lang.trim().toLowerCase();
  if (!cleaned) return "plaintext";

  return LANGUAGE_MAP[cleaned] || cleaned;
}

/**
 * Returns a human-friendly display label for a language.
 */
export function formatLanguageLabel(lang?: string | null): string {
  if (!lang || typeof lang !== "string") return "";
  const cleaned = lang.trim();
  if (!cleaned) return "";

  const lower = cleaned.toLowerCase();
  if (DISPLAY_LABELS[lower]) {
    return DISPLAY_LABELS[lower];
  }

  const normalized = normalizeMonacoLanguage(lower);
  if (DISPLAY_LABELS[normalized]) {
    return DISPLAY_LABELS[normalized];
  }

  // Capitalize first letter of raw string
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
