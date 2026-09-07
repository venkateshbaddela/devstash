---
name: cleanup
description: Clean up project housekeeping tasks (add "run" to execute fixes)
argument-hint: run|check
---

Review the codebase for cleanup tasks:

1. Be targeted and efficient. Do NOT perform an exhaustive codebase audit.
2. Avoid repeated searches or redundant commands.
3. Make sure that the history in @context/current-feature.md is in order from oldest to newest
4. Find unnecessary console.log statements in src/
5. Find unused imports
6. Check for stale TODO comments
7. Find orphaned/unused files
8. Check that context files match actual project state
9. Check if the .env.production has the same variables (not always the same value) as the .env. If something is missing, tell me. Do NOT read or expose secret values from .env files. For environment-file checks, compare variable names only.
10. Find `@ts-ignore` comments that might be stale
11. Do not make changes unless the mode and user confirms them.

**Mode: $ARGUMENTS**

If no argument or argument is "check":

- Only report findings, don't modify anything
- List what WOULD be cleaned up

If the argument is "run" or "fix":

- First, report all findings with numbered items
- Then ask: "Which items would you like me to fix? (enter numbers like 1,3,5 or 'all' or 'none')"
- Wait for user response before making any changes
- Only fix the items the user specifies
- Report what you changed
