# TypeScript Window Property Fix

## Root Cause

TypeScript's strict mode doesn't allow arbitrary properties on the `Window` interface. Even though the code has `'use client'` and guards with `typeof window !== 'undefined'`, TypeScript still type-checks the code during build time, causing errors when assigning custom properties to `window`.

## Fix Strategy

Use TypeScript declaration merging to augment the `Window` interface with the custom diagnostic properties. This satisfies TypeScript during build while preserving runtime functionality.

## Code Changes

### 1. Created `frontend/types/window.d.ts`

```typescript
interface Window {
  // Dashboard runtime proof markers
  __DASHBOARD_RUNTIME_PROOF__?: string
  __DASHBOARD_REPO__?: string
  __DASHBOARD_VERSION__?: string
  __DASHBOARD_LOADED__?: boolean
  
  // Repo and build identification
  __REPO_PROOF__?: string
  __RUNTIME_PROOF__?: string
  __BUILD_ID__?: string
  __BUILD_TIME__?: string
  __RUNTIME_TIME__?: string
  
  // Monorepo activation flag
  __LIQUIDCANVAS_MONOREPO_ACTIVE__?: boolean
  
  // Debug utilities
  __DRAFTS_TAB_DEBUG__?: {
    exists: boolean
    tabId?: string
    label?: string
    [key: string]: unknown
  }
}
```

### 2. Updated `frontend/tsconfig.json`

Added `types/**/*.ts` to the `include` array:
```json
"include": ["next-env.d.ts", "types/**/*.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
```

### 3. Removed `as any` cast in `frontend/app/dashboard/page.tsx`

Changed from:
```typescript
;(window as any).__DRAFTS_TAB_DEBUG__ = { ... }
```

To:
```typescript
window.__DRAFTS_TAB_DEBUG__ = { ... }
```

## Why This Works

1. **Declaration Merging**: TypeScript automatically merges interface declarations with the same name, so our `Window` interface augmentation extends the global `Window` interface.

2. **Build-Time Safety**: TypeScript now knows about these properties during build, eliminating type errors.

3. **Runtime Unchanged**: The declaration file doesn't affect runtime behavior - it's purely for type checking.

4. **Strict Mode Compatible**: All properties are marked optional (`?`), which is correct since they're only set client-side.

## Verification

After deployment:

1. **Build succeeds**: No TypeScript errors during `next build`
2. **Runtime proof works**: Check browser console:
   ```javascript
   window.__DASHBOARD_RUNTIME_PROOF__  // Should return string
   window.__LIQUIDCANVAS_MONOREPO_ACTIVE__  // Should return true
   ```
3. **Type safety preserved**: TypeScript still catches typos and type mismatches

## Files Modified

- ✅ Created: `frontend/types/window.d.ts`
- ✅ Modified: `frontend/tsconfig.json` (added types directory to include)
- ✅ Modified: `frontend/app/dashboard/page.tsx` (removed `as any` cast)

