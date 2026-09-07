# Codebase Findings & Required Fixes

## Objective

Fix the bugs identified by the code-scanner subagent. Only neccesary bugs to be fixed and no over engineering. 
1. Fix only bugs tat cause severe problems to the code base
2. Just let me know before fixing a bug if it breaks te code
3. After fixing each bug let me know how you solved the problem and check if it is correctly fixed.
4. Don't over engineering in fixing bugs.
5. Solve one bug at a time and intimate me before moving to next bug fix.

### Severity Summary

| Severity  | Count |
| --------- | ----: |
| Critical  |     0 |
| High      |     3 |
| Medium    |     4 |
| Low       |     1 |
| **Total** | **8** |

---

# Priority 1 — High Severity

## 1. Fix Broken Active Collection Highlighting in Sidebar

### Problem

**Files:**

* `sidebar.tsx:320-321`
* `sidebar.tsx:362-363`

The collection navigation currently builds a URL such as:

```text
/dashboard?collection=<collectionId>
```

but active-state detection compares:

```ts
pathname === colHref
```

`pathname` only contains the path portion:

```text
/dashboard
```

It does **not** contain the query string.

Therefore this comparison can never succeed:

```ts
"/dashboard" === "/dashboard?collection=123"
```

### Current Behavior

When the user opens a collection:

```text
/dashboard?collection=<collectionId>
```

the corresponding collection in:

* Favorites
* Recent Collections

is not highlighted.

Instead, the generic Dashboard navigation item remains active.

### Required Fix

Use `useSearchParams()` from `next/navigation`.

Example:

```tsx
import { useSearchParams } from "next/navigation";
```

Then:

```tsx
const searchParams = useSearchParams();

const activeCollectionId = searchParams.get("collection");

const isActive =
  pathname === "/dashboard" &&
  activeCollectionId === col.id;
```

### Requirements

* Preserve the existing collection URL format.
* Do not compare query parameters against `pathname`.
* A collection is active only when:

  * pathname is `/dashboard`
  * `collection` query parameter equals the collection ID.
* Normal `/dashboard` should continue to highlight Dashboard when no collection is selected.
* Favorites and Recent Collections should use the same active-state logic.

### Acceptance Criteria

* Opening `/dashboard?collection=abc` highlights collection `abc`.
* Opening `/dashboard?collection=xyz` does not highlight collection `abc`.
* Opening `/dashboard` with no collection query highlights Dashboard.
* No collection remains highlighted when a different collection is selected.

---

## 2. Eliminate Duplicate User Database Queries

### Problem

**File:**

```text
collections.ts:32-39
```

`getDefaultUserId()` performs:

```ts
prisma.user.findUnique({
  where: { email: DEMO_USER_EMAIL },
  select: { id: true },
});
```

This lookup is independently called from multiple functions across:

* `dashboard-layout.tsx`
* `page.tsx`
* `items.ts`
* `collections.ts`

The same user lookup is therefore executed repeatedly during a single page request.

### Impact

This creates unnecessary database round-trips to Neon PostgreSQL and increases:

* page latency
* connection pool pressure
* database compute
* server-side work

### Required Fix

Wrap the function with React's request-scoped `cache()`.

```ts
import { cache } from "react";

export const getDefaultUserId = cache(
  async (): Promise<string | null> => {
    const user = await prisma.user.findUnique({
      where: {
        email: DEMO_USER_EMAIL,
      },
      select: {
        id: true,
      },
    });

    return user?.id ?? null;
  }
);
```

### Requirements

* Keep the existing function API unless there is a strong reason to change it.
* `getDefaultUserId()` must return:

  * user ID when the user exists
  * `null` when the user does not exist
* The lookup must be memoized per request.
* Do not introduce global mutable state.
* Do not cache the result across unrelated requests.

### Acceptance Criteria

For one server request/render tree:

```text
getDefaultUserId()
getDefaultUserId()
getDefaultUserId()
```

must result in only one database query.

Across separate requests, the function must still resolve independently.

---

## 3. Stop Over-Fetching Collection Data for the Sidebar

### Problem

**Files:**

```text
collections.ts:136-140
collections.ts:55-84
```

`getCollections()` delegates to:

```ts
getDashboardCollections(userId, undefined)
```

with no limit.

That query loads:

* every collection
* item/collection join records
* related items
* related item types

and calculates type distributions in memory.

However, the sidebar only displays:

```text
id
name
isFavorite
color
itemCount
```

`col.types` is not used by the sidebar.

### Impact

As the number of collections/items grows, every sidebar render can unnecessarily load large relational datasets into Node.js memory.

This creates:

* excessive database reads
* unnecessary network transfer
* increased server memory usage
* unnecessary in-memory processing
* slower layout rendering

### Required Fix

Create a dedicated lightweight sidebar query.

Suggested implementation:

```ts
export async function getSidebarCollections(userId?: string) {
  const targetUserId = userId ?? (await getDefaultUserId());

  if (!targetUserId) {
    return [];
  }

  return prisma.collection.findMany({
    where: {
      userId: targetUserId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      isFavorite: true,
      color: true,
      _count: {
        select: {
          items: true,
        },
      },
    },
  });
}
```

### Requirements

* Do not fetch related item records for sidebar rendering.
* Do not calculate type distributions for sidebar data.
* Return only fields actually required by the sidebar.
* Preserve collection ordering.
* Preserve user scoping.
* Preserve item counts.

### Sidebar Data Contract

The sidebar should receive data equivalent to:

```ts
type SidebarCollection = {
  id: string;
  name: string;
  isFavorite: boolean;
  color: string | null;
  _count: {
    items: number;
  };
};
```

If the component currently expects `itemCount`, map `_count.items` to that shape without fetching additional data.

### Acceptance Criteria

* Sidebar collection query does not join/load collection items.
* Sidebar collection query does not load item types.
* Sidebar still shows:

  * collection name
  * favorite status
  * color
  * item count
* Query is correctly scoped to the active user.
* Rendering remains functionally unchanged.

---

# Priority 2 — Medium Severity

## 4. Fix Broken `/collections` Navigation Link

### Problem

**File:**

```text
sidebar.tsx:394-402
```

The sidebar contains:

```tsx
href="/collections"
```

but there is no:

```text
src/app/collections/page.tsx
```

route.

### Current Behavior

Clicking:

```text
View all collections
```

produces a `404`.

### Required Fix

Choose one of these implementations:

### Preferred

Point the link to the existing dashboard destination used by the application for viewing all collections.

Example:

```tsx
href="/dashboard"
```

### Alternative

Implement:

```text
src/app/collections/page.tsx
```

only if `/collections` is intended to be a real dedicated route.

### Requirements

Do not leave a navigation link pointing to a nonexistent route.

### Acceptance Criteria

Clicking **View all collections** must never produce a 404.

---

## 5. Bound Pinned/Recent Item Queries and Avoid Fetching Large Payloads

### Problem

**Files:**

```text
items.ts:80-113
items.ts:125-150
```

`getPinnedItems()` and `getRecentItems()` currently:

1. Have no reasonable result limit.
2. Fetch all `Item` columns.
3. Include large `content` fields.
4. Include file metadata such as:

   * `fileUrl`
   * `storageKey`

The UI component:

```text
item-card.tsx:38-105
```

does not need those fields.

It only displays information such as:

* title
* description
* date
* tags
* type badge

### Impact

Potentially large database payloads are transferred and processed even though the UI discards most of the data.

### Required Fix

Add a reasonable limit.

Recommended:

```ts
take: 12
```

Use an explicit `select`.

Example:

```ts
select: {
  id: true,
  title: true,
  description: true,
  contentType: true,
  isFavorite: true,
  isPinned: true,
  createdAt: true,
  itemType: {
    select: {
      name: true,
      icon: true,
      color: true,
    },
  },
  tags: {
    include: {
      tag: {
        select: {
          name: true,
        },
      },
    },
  },
}
```

### Requirements

* Add a bounded `take` limit to pinned items.
* Use explicit field selection.
* Do not fetch `content` unless the specific UI requires it.
* Do not fetch `fileUrl` or `storageKey` unless required.
* Preserve existing sorting/order.
* Preserve tags and item-type display data.

### Acceptance Criteria

Pinned and recent item queries:

* have a finite result size
* do not retrieve full item content unnecessarily
* return all fields required by `item-card.tsx`
* render exactly the same visible information as before

---

## 6. Add Correct User Scoping to System Item Type Query

### Problem

**File:**

```text
items.ts:215-261
```

The query currently uses:

```ts
prisma.itemType.findMany({
  where: {
    isSystem: true,
  },
});
```

This is globally scoped.

However, item types can be user-scoped.

The schema supports per-user types using:

```text
@@unique([userId, name])
```

and seeded system types are associated with a specific user.

### Impact

With multiple users or user-specific system types, the query can return types belonging to other users.

This may produce duplicate or incorrect sidebar entries, such as:

```text
Snippets
Snippets
Prompts
Prompts
```

### Required Fix

Scope system types to:

1. the active user
2. globally available types where `userId === null`

Example:

```ts
where: {
  isSystem: true,
  OR: [
    {
      userId: targetUserId,
    },
    {
      userId: null,
    },
  ],
}
```

### Requirements

* Resolve the active user ID first.
* Never return another user's user-scoped item types.
* Preserve global system types.
* Preserve existing ordering unless there is a reason not to.

### Acceptance Criteria

For user `A`:

* user `A` system types are returned
* global system types (`userId = null`) are returned
* user `B` system types are not returned

---

## 7. Prevent Layout Remounting Between Dashboard and Item Routes

### Problem

The application currently has peer layouts:

```text
app/dashboard/layout.tsx
app/items/layout.tsx
```

Each independently instantiates the dashboard shell.

Because they are separate route branches, navigating between:

```text
/dashboard
```

and:

```text
/items/[type]
```

causes the shell to unmount and mount again.

### Impact

Client-side state is lost during navigation.

Affected state includes:

```text
sidebar-context.tsx
  isCollapsed

sidebar.tsx
  isTypesOpen
  isCollectionsOpen
```

The user may therefore experience:

* sidebar collapse resetting
* expanded sections resetting
* unnecessary shell re-render/remount

### Required Fix

Create a shared route-group layout.

Recommended structure:

```text
src/app/
  (app)/
    layout.tsx
    dashboard/
      page.tsx
      ...
    items/
      [type]/
        page.tsx
        ...
```

Shared shell should be instantiated from:

```text
src/app/(app)/layout.tsx
```

### Requirements

* Dashboard and item routes must share one persistent application shell.
* Do not create duplicate dashboard-layout instances for sibling routes.
* Preserve existing URLs.
* Preserve existing route behavior.
* Preserve authentication/authorization behavior.

### Acceptance Criteria

When navigating:

```text
/dashboard
→ /items/snippets
→ /dashboard
```

the sidebar shell should remain mounted.

The following state should persist:

```text
isCollapsed
isTypesOpen
isCollectionsOpen
```

unless the user explicitly changes it.

---

# Priority 3 — Low Severity

## 8. Refactor Monolithic Sidebar and Centralize Sidebar State

### Problem

**File:**

```text
sidebar.tsx:94-443
```

The sidebar currently combines too many responsibilities:

* user initials calculation
* section expansion state
* item type rendering
* Pro badge logic
* collection partitioning
* favorite collections
* recent collections
* color resolution
* user profile/footer
* desktop navigation
* mobile navigation

The component is approximately 350 lines and has mixed UI/business responsibilities.

Additionally:

```text
sidebar.tsx:461-486
```

is rendered both:

* inside desktop `<aside>`
* inside mobile `<SheetContent>`

This creates independent component instances.

### Impact

This makes the component:

* harder to maintain
* harder to test
* harder to reason about
* prone to duplicated state
* susceptible to desktop/mobile state desynchronization

### Required Refactor

Split the sidebar into dedicated components.

Suggested structure:

```text
sidebar/
  sidebar.tsx
  sidebar-nav-types.tsx
  sidebar-nav-collections.tsx
  sidebar-user-profile.tsx
```

Suggested responsibilities:

### `SidebarNavTypes`

Responsible for:

* rendering item types
* active item-type state
* Pro badge UI

### `SidebarNavCollections`

Responsible for:

* favorites
* recent collections
* collection active state
* collection color indicator
* collection item counts

### `SidebarUserProfile`

Responsible for:

* user initials
* user profile/footer UI

### State

Move shared expansion state into:

```text
sidebar-context.tsx
```

For example:

```ts
isTypesOpen
isCollectionsOpen
```

The context should expose both state and setters/toggle functions.

### Requirements

* Avoid duplicated state between desktop and mobile sidebar instances.
* Desktop and mobile should consume the same sidebar context.
* Keep visual behavior unchanged.
* Do not mix database fetching into purely presentational sub-components.
* Keep navigation logic testable.

### Acceptance Criteria

* Desktop and mobile sidebar share expansion state.
* Opening Collections on desktop reflects the same state when the mobile sidebar is opened.
* The sidebar is split into focused components.
* Existing navigation and visual behavior remains intact.

---

# Implementation Order

Implement the fixes in this order:

## Step 1 — Database/request performance

1. Memoize `getDefaultUserId()` with `cache()`.
2. Add `getSidebarCollections()`.
3. Replace the sidebar's heavy collection query with `getSidebarCollections()`.
4. Add bounded/selective queries for pinned/recent items.
5. Correct user scoping for item types.

## Step 2 — Navigation correctness

6. Fix collection active-state detection using `useSearchParams()`.
7. Fix the broken `/collections` link.

## Step 3 — Application architecture

8. Move dashboard and item routes under a shared `(app)` route-group layout.
9. Refactor sidebar components and move shared expansion state to context.

---

# Important Constraints

Do not introduce unrelated behavior changes.

Do not rewrite the application's data model unless necessary.

Do not change public URLs unless the existing `/collections` route is explicitly implemented.

Do not remove fields from queries that are actually required by the UI.

Do not solve performance problems by adding arbitrary global caching.

Use request-scoped memoization for repeated request-level lookups.

Preserve existing authentication and user-scoping semantics.

---

# Verification Checklist

After implementation, verify all of the following.

## Sidebar collections

* [ ] Correct collection highlights when `?collection=<id>` is present.
* [ ] Dashboard highlights when no collection is selected.
* [ ] Favorites work.
* [ ] Recent Collections work.
* [ ] Collection count remains correct.
* [ ] Collection color remains correct.

## Database performance

* [ ] `getDefaultUserId()` executes only once per request.
* [ ] Sidebar collections do not load related items/types.
* [ ] Pinned items have a result limit.
* [ ] Recent items have a result limit where appropriate.
* [ ] Item `content` is not unnecessarily loaded.
* [ ] File metadata is not unnecessarily loaded.
* [ ] Item types are correctly user-scoped.

## Navigation

* [ ] `/dashboard` works.
* [ ] `/dashboard?collection=<id>` works.
* [ ] `/items/[type]` works.
* [ ] "View all collections" does not produce 404.

## Layout persistence

* [ ] Sidebar state survives dashboard → item-type navigation.
* [ ] Sidebar state survives item-type → dashboard navigation.
* [ ] No duplicate dashboard shell is mounted unnecessarily.

## Sidebar architecture

* [ ] Type navigation is separated.
* [ ] Collection navigation is separated.
* [ ] User profile UI is separated.
* [ ] Shared expansion state lives in context.
* [ ] Desktop/mobile sidebar state remains synchronized.

---

# Final Expected Outcome

The implementation should result in:

1. Correct collection active-state highlighting.
2. One user lookup per request instead of repeated identical queries.
3. Lightweight sidebar collection queries.
4. Bounded and selective item queries.
5. Correct user-scoped system item types.
6. No broken `/collections` navigation.
7. Persistent application shell across dashboard/item navigation.
8. A smaller, more maintainable sidebar architecture.

The highest-priority performance fix is:

```text
collections.ts:getDefaultUserId()
```

Wrap it with React `cache()` first, because this removes the repeated identical database round-trips occurring during a single page render.
