/**
 * Checks whether an item type should use the Markdown editor.
 * Notes and prompts are edited and previewed with Markdown.
 */
export function isMarkdownItemType(itemType: string | null | undefined): boolean {
  if (!itemType) return false;
  const normalized = itemType.toLowerCase().trim();
  return normalized === "note" || normalized === "prompt";
}

/**
 * Checks whether an item type should use the Monaco code editor.
 * Snippets and commands are edited and viewed with the Code editor.
 */
export function isCodeItemType(itemType: string | null | undefined): boolean {
  if (!itemType) return false;
  const normalized = itemType.toLowerCase().trim();
  return normalized === "snippet" || normalized === "command";
}
