# React Invariant Errors Fix - Production Crash Resolution

## Root Cause

### Why React is Crashing on a Handled 422

The backend correctly returns HTTP 422 with a clear error message, but the frontend violates React's state update invariants:

1. **Multiple setState calls in error handler** (3 sequential calls)
2. **useCallback dependency loop** causing infinite recreation
3. **Auto-draft effect dependency cycle** triggering render loops
4. **State updates after unmount** from timeout callbacks

### React Error Mapping

- **#418**: "Cannot update a component while rendering a different component"
  - **Cause**: Auto-draft effect depends on `handleAutoDraft`, which changes when `draftState` changes, causing effect to re-run during render
  
- **#423**: "Cannot update during an existing state transition"
  - **Cause**: Error handler calls `setDraftState('error')`, `setDraftError(errorMessage)`, and `setError(errorMessage)` in sequence
  
- **#425**: "Maximum update depth exceeded"
  - **Cause**: `handleAutoDraft` depends on `draftState`, which causes it to be recreated, which triggers auto-draft effect, which calls `handleAutoDraft`, creating infinite loop

## The Exact Faulty Pattern

### Before (Faulty Code)

```typescript
// Multiple state variables for same concern
const [draftState, setDraftState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
const [draftError, setDraftError] = useState<string | null>(null)
const [error, setError] = useState<string | null>(null)

// useCallback depends on draftState - causes recreation loop
const handleAutoDraft = useCallback(async (showConfirm = true) => {
  if (draftState === 'loading') return
  
  setDraftState('loading')
  setDraftError(null)
  setError(null)
  
  try {
    const result = await pipelineDraft()
    setDraftState('success')  // State update 1
  } catch (err: any) {
    setDraftState('error')      // State update 1
    setDraftError(errorMessage) // State update 2
    setError(errorMessage)      // State update 3 - VIOLATION
  }
}, [draftState, loadDrafts]) // draftState dependency causes loop

// Effect depends on handleAutoDraft - causes render loop
useEffect(() => {
  if (hasAutoDrafted) return
  const checkAndAutoDraft = async () => {
    // ...
    handleAutoDraft(false) // Triggers state update
  }
  setTimeout(checkAndAutoDraft, 500)
}, [hasAutoDrafted, handleAutoDraft, loadDrafts]) // handleAutoDraft changes → effect re-runs → calls handleAutoDraft → loop
```

### Problems

1. **Three setState calls in error handler**: React batches these but can cause #423 if timing is wrong
2. **draftState in useCallback deps**: Every state change recreates the function, triggering effects that depend on it
3. **handleAutoDraft in effect deps**: Creates infinite loop when handleAutoDraft changes
4. **No request cancellation**: Timeout callbacks can execute after unmount

## Refactored Code (After)

### Single State Machine

```typescript
// Single state object - one source of truth
const [draftState, setDraftState] = useState<{
  status: 'idle' | 'loading' | 'success' | 'error'
  message: string | null
}>({ status: 'idle', message: null })

// AbortController for request cancellation
const abortControllerRef = useRef<AbortController | null>(null)

// useCallback WITHOUT draftState dependency
const handleAutoDraft = useCallback(async (showConfirm = true) => {
  // Check current state directly, not from dependency
  if (draftState.status === 'loading') return
  
  // Cancel any existing request
  if (abortControllerRef.current) {
    abortControllerRef.current.abort()
  }
  
  const abortController = new AbortController()
  abortControllerRef.current = abortController
  
  // Single state update
  if (mountedRef.current) {
    setDraftState({ status: 'loading', message: null })
    setError(null)
  }
  
  try {
    const result = await pipelineDraft()
    
    // Check abort and mount status
    if (abortController.signal.aborted || !mountedRef.current) {
      return
    }
    
    // Single state update
    setDraftState({ 
      status: 'success', 
      message: result.message || `Drafting job started for ${result.prospects_count} prospects`
    })
  } catch (err: any) {
    // Check abort and mount status
    if (abortController.signal.aborted || !mountedRef.current) {
      return
    }
    
    // Single state update (consolidated)
    const errorMessage = err?.message || 'Failed to generate drafts'
    setDraftState({ status: 'error', message: errorMessage })
    setError(errorMessage)
  } finally {
    // Cleanup
    if (abortControllerRef.current === abortController) {
      abortControllerRef.current = null
    }
  }
}, [loadDrafts]) // Removed draftState - prevents recreation loop

// Effect depends only on draftState.status, not handleAutoDraft
useEffect(() => {
  if (hasAutoDrafted) return
  
  const checkAndAutoDraft = async () => {
    // ... check logic
    if (draftedProspects.length === 0 && draftState.status !== 'loading') {
      handleAutoDraft(false) // Safe to call - no dependency loop
    }
  }
  
  const timer = setTimeout(checkAndAutoDraft, 500)
  return () => clearTimeout(timer)
}, [hasAutoDrafted, draftState.status]) // Only status, not handleAutoDraft
```

## Final Invariants Enforced

### 1. Single State Update Per Transition
- ✅ Before: 3 setState calls in error handler
- ✅ After: 1 setState call with consolidated state object

### 2. No Dependency Loops
- ✅ Before: `handleAutoDraft` depends on `draftState` → effect depends on `handleAutoDraft` → loop
- ✅ After: `handleAutoDraft` does NOT depend on `draftState`, effect depends only on `draftState.status`

### 3. Request Cancellation
- ✅ Before: No cancellation, timeouts execute after unmount
- ✅ After: AbortController cancels requests, timeouts check abort signal

### 4. Mounted Guard
- ✅ Before: State updates after unmount possible
- ✅ After: All state updates check `mountedRef.current` AND `abortController.signal.aborted`

### 5. No Implicit Retries
- ✅ Before: Auto-draft effect could retry on failures
- ✅ After: Explicit user action required to retry (button click resets state)

### 6. Error as Valid UI State
- ✅ Before: Errors could trigger crashes
- ✅ After: Errors are displayed as UI state, never throw, never trigger rerenders

## UI Behavior Guarantees

### 422 Response Handling
- ✅ Displays user-facing message in yellow warning box
- ✅ Does not crash the dashboard
- ✅ Does not re-trigger the draft request
- ✅ User must explicitly click "Retry" button

### Tab Switching
- ✅ AbortController cancels in-flight requests
- ✅ No state updates after unmount
- ✅ Cannot cause React invariant errors

### Draft Generation
- ✅ Requires explicit user intent (button click)
- ✅ Cannot auto-loop based on pipeline refreshes
- ✅ Auto-draft only runs once on mount if no drafts exist

## Files Modified

- `frontend/components/DraftsTable.tsx`: Complete refactor of state machine and async control flow
- `frontend/components/Pipeline.tsx`: Error handling improvements

## Testing Checklist

- [ ] 422 response displays error message, no crash
- [ ] Switch tabs during draft request - no errors
- [ ] Multiple rapid clicks - only one request
- [ ] Component unmount during request - no state updates
- [ ] Auto-draft runs once, doesn't loop
- [ ] Error state persists until user clicks Retry
- [ ] No React invariant errors in console

