# Libranote Web App Architecture Analysis

## Current State Analysis

### 1. Directory Structure Overview

```
apps/web/src/
├── services/          # Business logic services
│   ├── SyncService.ts (18KB, 662 lines) - VERY FAT
│   ├── SearchService.ts
│   ├── ApiService.ts
│   ├── NetworkStatusService.ts
│   └── db/           # Database repositories
├── lib/              # Utilities and helpers
│   ├── store/        # Zustand state management
│   ├── utils.ts      # UI utilities, memoization
│   ├── router.ts     # Router setup
│   └── ...
├── components/       # React components
├── hooks/           # Custom React hooks
└── types/           # TypeScript type definitions
```

### 2. Current Architecture Issues Identified

#### Issue #1: Fat SyncService (662 lines, 18KB)

**Problem**: The SyncService is a massive class doing too many things:

- Network status management
- SSE event handling
- YDoc synchronization
- Action queue processing
- Data synchronization for all entities (notes, collections, settings)
- Local/remote data reconciliation

**Responsibilities Mixed**:

- Infrastructure concerns (SSE, network status)
- Business logic (sync logic for different entities)
- Data persistence coordination
- Event handling and state management

#### Issue #2: Unclear Service vs Lib Boundary

**Problem**: No clear distinction between what belongs in `/services` vs `/lib`:

- `lib/utils.ts` contains business logic (getUserColors, getCollectionColor)
- Services contain both infrastructure and business logic
- No consistent pattern for where utilities should live

#### Issue #3: Inconsistent Component-Service Interaction

**Problem**: Components interact with services in different ways:

- Some components directly call store actions (CreateNoteButton)
- Some use services through context providers (SyncProvider)
- Some mix direct service calls with store actions
- No standardized way to handle async operations or errors

#### Issue #4: Tightly Coupled Architecture

**Problem**: High coupling between layers:

- SyncService directly depends on Zustand store
- Components know about specific repository implementations
- Services are mixed with infrastructure concerns
- No clear separation of concerns

#### Issue #5: No Clear Domain Boundaries

**Problem**: Business logic is scattered:

- Note-related logic spread across NoteService, SearchService, SyncService
- Collection logic mixed between store slices and sync service
- No clear aggregate boundaries or domain services

#### Issue #6: Repository Pattern Inconsistency

**Problem**: Data access layer is inconsistent:

- Some operations go through repositories
- Some operations bypass repositories and go directly to ApiService
- Transaction handling is inconsistent
- No consistent error handling patterns

### 3. Technology Stack Assessment

**Current Stack** (keeping these):

- ✅ React + TypeScript
- ✅ Zustand for state management
- ✅ TanStack Router
- ✅ TanStack Query (for server state)
- ✅ Yjs for collaborative editing
- ✅ IndexedDB for local storage
- ✅ SSE for real-time updates

## Proposed Architectural Solutions

### Solution Set 1: Clean Architecture with Domain-Driven Design

#### 1.1 Domain Layer Reorganization

```
src/
├── domain/
│   ├── entities/     # Domain entities and value objects
│   ├── services/     # Pure domain services (business logic)
│   └── repositories/ # Repository interfaces
├── infrastructure/
│   ├── api/          # API clients and HTTP concerns
│   ├── storage/      # Database repositories implementations
│   ├── sync/         # Real-time sync infrastructure
│   └── search/       # Search infrastructure
├── application/
│   ├── commands/     # Command handlers (CQRS pattern)
│   ├── queries/      # Query handlers
│   └── services/     # Application services (orchestration)
├── presentation/
│   ├── components/   # React components
│   ├── hooks/        # UI-specific hooks
│   └── store/        # UI state management
```

#### 1.2 Service Decomposition Strategy

Split SyncService into focused services:

**Domain Services**:

- `NoteSyncService` - Note-specific sync logic
- `CollectionSyncService` - Collection-specific sync logic
- `SettingsSyncService` - Settings-specific sync logic

**Infrastructure Services**:

- `RealtimeService` - SSE and WebSocket handling
- `NetworkService` - Network status and connectivity
- `QueueService` - Action queue processing
- `YDocService` - YDoc coordination and management

#### 1.3 Component Interaction Standardization

**Pattern**: Components → Hooks → Application Services → Domain Services → Infrastructure

```typescript
// Component
const CreateNoteButton = () => {
  const createNote = useCreateNote();

  const handleClick = () => {
    createNote.execute({
      collectionId,
      title: "Untitled Note"
    });
  };
};

// Hook
const useCreateNote = () => {
  return useMutation({
    mutationFn: (input) => noteCommandService.createNote(input)
  });
};

// Application Service
class NoteCommandService {
  async createNote(input) {
    const note = await this.noteDomainService.createNote(input);
    await this.syncQueue.enqueue({...});
    return note;
  }
}
```

### Solution Set 2: Modular Service Architecture

#### 2.1 Feature-Based Module Organization

```
src/
├── features/
│   ├── notes/
│   │   ├── services/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── store/
│   ├── collections/
│   │   ├── services/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── store/
│   └── sync/
│       ├── services/
│       ├── components/
│       └── store/
├── shared/
│   ├── services/
│   ├── components/
│   └── utils/
```

#### 2.2 Dependency Injection Container

Implement a simple DI container to manage service dependencies:

```typescript
// di-container.ts
class Container {
  private services = new Map();

  register<T>(token: string, factory: () => T): void {
    this.services.set(token, factory);
  }

  get<T>(token: string): T {
    const factory = this.services.get(token);
    return factory();
  }
}

// Setup
container.register("ApiService", () => new ApiService());
container.register(
  "NoteService",
  () =>
    new NoteService(
      container.get("ApiService"),
      container.get("NoteRepository")
    )
);
```

#### 2.3 Event-Driven Architecture

Replace direct coupling with events:

```typescript
// Event bus for decoupling
class EventBus {
  private handlers = new Map<string, Function[]>();

  emit(event: string, payload: any): void {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach((handler) => handler(payload));
  }

  on(event: string, handler: Function): void {
    const handlers = this.handlers.get(event) || [];
    handlers.push(handler);
    this.handlers.set(event, handlers);
  }
}

// Usage
noteService.emit("note:created", note);
searchService.on("note:created", (note) => this.indexNote(note));
```

### Solution Set 3: Layered Architecture with Clear Boundaries

#### 3.1 Three-Layer Architecture

```
┌─────────────────────────────────────┐
│        Presentation Layer           │
│   (Components, Hooks, Store)       │
├─────────────────────────────────────┤
│        Application Layer            │
│    (Services, Commands, Queries)   │
├─────────────────────────────────────┤
│       Infrastructure Layer         │
│  (Repositories, API, Storage)      │
└─────────────────────────────────────┘
```

#### 3.2 Service Interface Standardization

Define consistent interfaces for all services:

```typescript
interface IService {
  readonly name: string;
  initialize(): Promise<void>;
  dispose(): Promise<void>;
}

interface ICrudService<T, TId = string> extends IService {
  getAll(): Promise<T[]>;
  getById(id: TId): Promise<T | null>;
  create(entity: Omit<T, "id">): Promise<T>;
  update(id: TId, entity: Partial<T>): Promise<T>;
  delete(id: TId): Promise<void>;
}
```

#### 3.3 Consistent Error Handling

Implement standardized error handling across all layers:

```typescript
// Error types
abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
}

class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR";
  readonly statusCode = 400;
}

// Error boundary service
class ErrorService {
  static handle(error: unknown): AppError {
    if (error instanceof AppError) return error;

    // Transform known errors
    if (error instanceof ApiServiceError) {
      return new NetworkError(error.message);
    }

    return new UnknownError();
  }
}
```

## Recommended Approach: Hybrid Solution

After analyzing the codebase and considering the current state, I recommend a **hybrid approach** that combines elements from all three solutions:

### Phase 1: Service Decomposition (Immediate)

1. Split the fat SyncService into focused services
2. Establish clear service boundaries
3. Implement consistent error handling

### Phase 2: Clean Boundaries (Short-term)

1. Separate infrastructure from business logic
2. Standardize component-service interaction patterns
3. Implement dependency injection

### Phase 3: Domain Organization (Long-term)

1. Introduce domain-driven concepts
2. Implement event-driven architecture
3. Refactor toward clean architecture principles

This approach minimizes disruption while systematically improving the architecture.

## Implementation Progress

### ✅ Phase 1: Service Decomposition (IN PROGRESS)

#### Step 1.1: Create Error Handling Infrastructure ✅ COMPLETED

Created standardized error types and handling:

```typescript
// src/lib/errors/AppError.ts
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// src/lib/errors/NetworkError.ts
export class NetworkError extends AppError {
  readonly code = "NETWORK_ERROR";
  readonly statusCode = 500;
}

// src/lib/errors/ValidationError.ts
export class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR";
  readonly statusCode = 400;
}

// src/lib/errors/SyncError.ts
export class SyncError extends AppError {
  readonly code = "SYNC_ERROR";
  readonly statusCode = 500;
}

// src/lib/errors/index.ts
export * from "./AppError";
export * from "./NetworkError";
export * from "./SyncError";
export * from "./ValidationError";

import { AppError } from "./AppError";
import { NetworkError } from "./NetworkError";
import { ValidationError } from "./ValidationError";

interface ErrorWithStatus extends Error {
  status: number;
}

export class ErrorService {
  static handle(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // Check if error has status property (ApiServiceError-like)
    if (
      error instanceof Error &&
      "status" in error &&
      typeof (error as ErrorWithStatus).status === "number"
    ) {
      return new NetworkError(error.message, error);
    }

    if (error instanceof Error) {
      return new NetworkError("An unexpected error occurred", error);
    }

    return new NetworkError("An unknown error occurred");
  }

  static isNetworkError(error: unknown): boolean {
    return (
      error instanceof NetworkError ||
      (error instanceof Error &&
        "status" in error &&
        typeof (error as ErrorWithStatus).status === "number")
    );
  }

  static isValidationError(error: unknown): boolean {
    return error instanceof ValidationError;
  }
}
```

#### Step 1.2: Extract Sync Services by Domain ✅ COMPLETED

Split the SyncService into domain-specific services:

**NoteSyncService** ✅ COMPLETED - `src/services/sync/NoteSyncService.ts`

- Handles note-specific synchronization logic
- Manages note CRUD operations with queuing
- Processes note-related action queue items
- Uses existing API and repository patterns

**CollectionSyncService** ✅ COMPLETED - `src/services/sync/CollectionSyncService.ts`

- Handles collection-specific synchronization logic
- Manages collection CRUD operations with queuing
- Processes collection-related action queue items
- Includes leave collection functionality

#### Step 1.3: Create Infrastructure Services ✅ COMPLETED

Extract infrastructure concerns:

**RealtimeService** ✅ COMPLETED - `src/services/infrastructure/RealtimeService.ts`

- Handles SSE connections with automatic reconnection
- Exponential backoff retry logic
- Proper error handling and event dispatching
- Connection lifecycle management

**QueueService** ✅ COMPLETED - `src/services/infrastructure/QueueService.ts`

- Centralized action queue processing
- Delegates to appropriate domain sync services
- Error handling and retry functionality
- Status tracking and completed item cleanup

#### Step 1.4: Refactor the Original SyncService ✅ COMPLETED

Transformed the main SyncService into an orchestrator that coordinates the new services:

**Key Changes Made:**

- ✅ **Service Orchestration**: SyncService now initializes and coordinates the new domain and infrastructure services
- ✅ **Event-Driven Architecture**: All services communicate through events, reducing coupling
- ✅ **Backwards Compatibility**: Existing methods preserved to maintain compatibility with current codebase
- ✅ **Error Handling**: Standardized error handling throughout the sync flow
- ✅ **Real-time Integration**: RealtimeService now handles SSE connections with automatic reconnection

**Store Integration Flow** ✅ MAINTAINED:

The integration preserves the existing offline-first PWA flow:

1. **UI Operations**: Components call store methods (e.g., `store.notes.createNote()`)
2. **Store Layer**: Zustand slices update UI state + save to local DB + add action to queue
3. **Queue Processing**: QueueService processes queue changes and delegates to domain services
4. **Sync Coordination**: SyncService orchestrates the sync flow and handles SSE events
5. **Store Updates**: Results are merged back to store (e.g., swapping local IDs with server IDs)

**Current Architecture Flow**:

```
UI Component
    ↓
Zustand Store Slice (notes/collections)
    ↓ (writes to local DB + adds to queue)
Local IndexedDB + Action Queue
    ↓ (queue changes trigger)
QueueService
    ↓ (delegates by domain)
NoteSyncService / CollectionSyncService
    ↓ (API calls)
Remote Server
    ↓ (SSE notifications)
RealtimeService → SyncService → Store
```

### 📋 Phase 1 Completion Checklist:

- [x] ✅ Error handling infrastructure
- [x] ✅ NoteSyncService
- [x] ✅ CollectionSyncService
- [x] ✅ RealtimeService
- [x] ✅ QueueService
- [x] ✅ Refactor main SyncService
- [x] ✅ Maintain store integration
- [ ] ⏳ Update SyncProvider integration (if needed)
- [ ] ⏳ Test full sync flow
- [ ] ⏳ Performance validation

## Benefits Achieved So Far:

1. **Single Responsibility** - Each service now has a focused domain concern
2. **Better Testability** - Services can be unit tested independently
3. **Error Standardization** - Consistent error handling across all layers
4. **Event-Driven Communication** - Services communicate through events, reducing coupling
5. **Infrastructure Separation** - Clear separation between business logic and infrastructure concerns

The architecture is already much cleaner and more maintainable, with clear service boundaries and proper error handling. The next step is to integrate these services into the main SyncService orchestrator.
