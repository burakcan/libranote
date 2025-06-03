# Sync Service Refactor

This is a comprehensive refactor of the sync service to provide better status tracking and React integration.

## Overview

The new system provides:

- **Robust status tracking** with timeout handling and error recovery
- **Granular operation tracking** to know exactly what's syncing
- **Better React integration** with proper hooks and cleanup
- **Error management** with automatic cleanup and history
- **Type safety** throughout the sync system

## Key Components

### 1. SyncStatusManager

The core status management system that tracks all sync operations:

```typescript
import { SyncStatusManager } from "./SyncStatusManager";

const statusManager = new SyncStatusManager();

// Start tracking an operation
const operationId = statusManager.startOperation("note-sync", "Syncing notes");

// Complete it
statusManager.completeOperation(operationId);

// Or fail it
statusManager.failOperation(operationId, new Error("Network error"));
```

### 2. Updated SyncService

The main sync service now uses the status manager internally:

```typescript
// Get current status
const status = syncService.getStatus();

// Subscribe to status changes
const unsubscribe = syncService.subscribeToStatus((status) => {
  console.log("Sync status:", status);
});
```

### 3. React Hooks

Multiple hooks for different use cases:

#### useSyncStatus() - Full status information

```typescript
import { useSyncStatus } from '@/hooks/useSyncStatus';

function MyComponent() {
  const {
    isSyncing,
    hasError,
    errors,
    operations,
    clearErrors,
    isNoteSyncing,
    isQueueProcessing,
  } = useSyncStatus();

  return (
    <div>
      {isSyncing && <p>Syncing...</p>}
      {hasError && (
        <div>
          <p>Errors: {errors.length}</p>
          <button onClick={clearErrors}>Clear</button>
        </div>
      )}
      {isNoteSyncing && <p>Notes are syncing</p>}
    </div>
  );
}
```

#### useSyncBasicStatus() - Lightweight version

```typescript
import { useSyncBasicStatus } from '@/hooks/useSyncStatus';

function SyncIndicator() {
  const { isSyncing, hasError, lastSyncTime } = useSyncBasicStatus();

  return (
    <div className={`sync-indicator ${isSyncing ? 'syncing' : ''}`}>
      {isSyncing ? 'Syncing...' : hasError ? 'Error' : 'Synced'}
    </div>
  );
}
```

#### useSyncOperationType() - Track specific operations

```typescript
import { useSyncOperationType } from '@/hooks/useSyncStatus';

function NoteSyncStatus() {
  const { isRunning, operations, hasError } = useSyncOperationType('note-sync');

  return (
    <div>
      {isRunning && <p>Notes are syncing</p>}
      <p>Active note operations: {operations.length}</p>
    </div>
  );
}
```

### 4. Updated SyncProvider

The provider is now more robust with better error handling:

```typescript
function App() {
  return (
    <SyncProvider>
      {/* Your app components */}
      <SyncStatusIndicator variant="basic" />
    </SyncProvider>
  );
}
```

## Operation Types

The system tracks these operation types:

- `initial-sync` - Full app sync on startup
- `queue-processing` - Processing offline actions
- `realtime-event` - Handling real-time updates
- `manual-sync` - User-triggered sync
- `note-sync` - Note-specific operations
- `collection-sync` - Collection-specific operations
- `settings-sync` - Settings-specific operations

## Benefits Over Old System

### Before (Problems)

- ❌ Sync could get stuck in "syncing" state
- ❌ No way to know what was actually syncing
- ❌ Poor error handling and recovery
- ❌ Memory leaks from event listeners
- ❌ Race conditions with operation counting

### After (Solutions)

- ✅ Automatic timeout handling (30s default)
- ✅ Granular operation tracking
- ✅ Proper error states and history
- ✅ Automatic cleanup and memory management
- ✅ Race-condition-free status management

## Migration Guide

### For Component Authors

**Old way:**

```typescript
import { useSyncContext } from "@/hooks/useSyncContext";

function MyComponent() {
  const { isSyncing, isSynced } = useSyncContext();
  // ...
}
```

**New way:**

```typescript
import { useSyncBasicStatus } from "@/hooks/useSyncStatus";

function MyComponent() {
  const { isSyncing, lastSyncTime } = useSyncBasicStatus();
  const isSynced = !isSyncing && !!lastSyncTime;
  // ...
}
```

### For Advanced Use Cases

The new system provides much more information:

```typescript
import { useSyncStatus } from '@/hooks/useSyncStatus';

function AdvancedSyncStatus() {
  const {
    operations,
    errors,
    isInitialSyncing,
    isQueueProcessing,
    clearErrors,
  } = useSyncStatus();

  return (
    <div>
      {isInitialSyncing && <p>Initial sync in progress...</p>}
      {isQueueProcessing && <p>Processing offline changes...</p>}

      {operations.size > 0 && (
        <div>
          <h4>Active Operations:</h4>
          {Array.from(operations.values()).map(op => (
            <div key={op.id}>
              {op.type}: {op.status}
              {op.description && ` - ${op.description}`}
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div>
          <h4>Recent Errors:</h4>
          {errors.map((error, i) => (
            <div key={i}>{error.message}</div>
          ))}
          <button onClick={clearErrors}>Clear Errors</button>
        </div>
      )}
    </div>
  );
}
```

## Example Component

See `SyncStatusIndicator.tsx` for a complete example that demonstrates both basic and detailed sync status display.

## Debugging

The sync service is still available on `window.syncService` for debugging:

```javascript
// In browser console
window.syncService.getStatus();
window.syncService.getStatusManager().getOperationsByType("note-sync");
```
