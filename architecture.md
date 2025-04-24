# Libranote Web App Architecture Analysis & Improvement Plan

## 1. Analysis Summary

Based on an examination of the `apps/web/src` directory.

- **Core Functionality:** Collaborative, offline-first note-taking application featuring collections (notebooks/folders), rich-text editing, real-time collaboration, search, and user authentication.
- **Technology Stack:**
  - **Frontend Framework:** React, TypeScript, Vite
  - **Routing:** TanStack Router (file-based)
  - **Server State & Caching:** TanStack Query
  - **Client State:** Zustand (slice pattern)
  - **Rich Text Editor:** Tiptap / ProseMirror
  - **Real-time Collaboration:** Yjs / Hocuspocus (via WebSockets)
  - **Offline Persistence:** IndexedDB
  - **Styling:** TailwindCSS, Shadcn/ui (inferred from structure and component usage)
  - **Client-side Search:** FlexSearch
  - **Backend Communication:** Custom `ApiService` (likely REST/HTTP), Server-Sent Events (SSE), Hocuspocus WebSocket.
- **Key Architectural Components:**
  - **UI Layer (`components/`, `routes/`):** React components organized by feature (notes, collections, auth, etc.) and a shared UI library (`components/ui/`). Routes define pages and layouts.
  - **State Layer (`lib/store/`, `hooks/`):** Zustand manages global client state (cached data, UI state). TanStack Query manages server cache state. Yjs manages collaborative document state. Custom hooks abstract state access and logic.
  - **Service Layer (`lib/`, `hooks/`):** Contains core application logic.
    - `SyncService`: Central orchestrator for data synchronization between local cache (IndexedDB, Zustand), collaboration backend (Hocuspocus), and main API (via `ApiService`, SSE). Handles offline queue, conflict resolution (implicitly via Yjs/Hocuspocus), and state updates.
    - `ApiService`: Handles direct communication with the backend API.
    - `SearchService`: Integrates and manages client-side search with FlexSearch.
    - `NetworkStatusService`: Monitors and provides online/offline status.
    - Custom Hooks: Encapsulate data fetching (`*Query`, `*Mutation`), state access (`useStore`), context access (`useSyncContext`), and specific logic (`useColllaborativeNoteYDoc`).
  - **Persistence Layer (`lib/db/`):** IndexedDB repositories for storing notes, collections, Yjs state vectors/updates, and an offline action queue.
  - **Providers (`components/providers/`):** React context providers initialize and make available the Zustand store, `SyncService`, and other global concerns.

## 2. Strengths

- **Modern & Capable Tech Stack:** Leverages powerful libraries well-suited for a complex, interactive application (TanStack suite, Zustand, Yjs).
- **Rich Feature Set:** Implements challenging features like real-time collaboration and offline-first capabilities.
- **Clear Separation (Initial):** Good initial separation of concerns into UI, state, services, and persistence layers within the directory structure.
- **Modularity via Slices/Hooks:** Zustand slices and custom hooks help modularize state management and reusable logic.

## 3. Areas for Improvement & Suggestions

While the application works, the following areas could be refactored for better long-term maintainability, testability, and developer experience.

### 3.1. Service Layer Organization & Granularity (`lib/`, `SyncService`)

- **Observation:** The `lib` directory has become a catch-all for services, database logic, state management, configuration, and utilities. The `SyncService` class is particularly large (500+ lines) and handles numerous distinct synchronization responsibilities (SSE, action queue processing, local DB loading, remote API sync, Yjs state sync), making it hard to understand, test, and modify.
- **Suggestions:**
  - **Dedicated `src/services/` Directory:** Create a top-level `src/services/` directory. Move `SyncService`, `ApiService`, `SearchService`, `NetworkStatusService` into it.
  - **Refactor `SyncService`:** Break down `SyncService` into smaller, single-responsibility classes/modules within `src/services/sync/`. Potential components:
    - `ActionQueueProcessor`: Manages processing items in the `ActionQueueRepository`.
    - `SSEHandler`: Manages the SSE connection and processes incoming events.
    - `RemoteSyncManager`: Handles fetching data from and pushing data to the `ApiService`.
    - `LocalCacheManager`: Handles loading data from IndexedDB into Zustand.
    - `CollaborationConnector`: Manages the Hocuspocus connection and related Yjs logic (could potentially absorb `useColllaborativeNoteYDoc` logic).
      The main `SyncService` would then become an orchestrator, coordinating these smaller pieces. This significantly improves testability (mocking smaller units) and understandability.
  - **Dedicated `src/config/` Directory:** Group configuration files (`router.ts`, `queryClient.ts`, `authClient.ts`, `hocusPocusSocket.ts`, `clientId.ts`) into `src/config/`.
  - **Consolidate `src/lib/`:** After moving services and config, `src/lib/` could primarily contain the `db/` repositories and `store/` logic (or `store/` could move to `src/store/`). Keep truly generic utilities here or move to `src/utils/`. Domain-specific utils should live near their domain (e.g., `src/services/sync/utils.ts`).

### 3.2. State Management Complexity & Data Flow

- **Observation:** State is distributed across Zustand, TanStack Query, Yjs documents, and IndexedDB. `SyncService` acts as the complex intermediary. Large Zustand slices (`notesSlice`, `collectionsSlice` > 300 lines) add to the complexity. Understanding the exact flow of data and which system is the source of truth can be difficult.
- **Suggestions:**
  - **Explicit State Ownership & Flow Documentation:** Clearly document which system "owns" which piece of data (e.g., "Zustand caches the list of note metadata", "Yjs document holds the real-time note content", "IndexedDB is the persistent offline source"). Create a data flow diagram (e.g., using Mermaid) in the documentation showing interactions between UI -> Hooks -> Zustand/TanStackQ -> Services -> DB/API/WebSockets.
  - **Refine Zustand Slices:**
    - Break down large slices if logical sub-domains exist within them.
    - Extract complex update logic or calculations into standalone utility functions imported by the slice, keeping the slice definition focused on state description and simple updates.
    - Ensure components use memoized / specific selectors (`useStore(state => state.notes.items.find(...))` or `useStore(useShallow)`) to prevent unnecessary re-renders caused by unrelated state changes.
  - **Minimize State Duplication:** Review if any state in Zustand is purely a cached copy of TanStack Query data or IndexedDB data. Can selectors directly compute derived state from TanStack Query/DB reads when needed, reducing synchronization complexity? (Balance with performance needs).

### 3.3. Component & Feature Structure

- **Observation:** Components are grouped by feature (`components/notes/`, `components/collections/`), which is good. However, as the app grows, mixing UI components, hooks, potentially feature-specific types/services within these folders or having them spread across top-level `hooks/`, `lib/`, `types/` can become less organized. Route components (`notes.$noteId.tsx`) can become large.
- **Suggestions:**
  - **Feature-Based Modules (Optional but Recommended):** Consider structuring the application around features/modules at the top level.
    ```
    src/
    ├── features/
    │   ├── notes/
    │   │   ├── api/       # Feature-specific API hooks/functions
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── routes/    # Route definitions related to notes
    │   │   └── types.ts
    │   ├── collections/
    │   └── auth/
    ├── components/        # Shared UI components (using ui/)
    │   └── ui/
    ├── hooks/             # Shared hooks
    ├── services/          # Core services (Sync, Api, etc.)
    ├── store/             # Zustand store slices
    ├── lib/               # Core libs (DB, generic utils)
    ├── types/             # Global/shared types
    ├── config/            # Configuration
    └── main.tsx
    ```
    This co-locates code related to a specific domain, improving discoverability and encapsulation.
  - **Container/Presentational Pattern:** For complex route components (`notes.$noteId.tsx`), ensure a clear separation between data fetching/logic (often handled by hooks or a "container" component) and pure rendering ("presentational" components). This improves reusability and testability of the UI parts.

### 3.4. Type Safety & Consistency

- **Observation:** TypeScript is used effectively in many places. Separate `types/` and `lib/store/types.ts` exist. Server types (`ServerCollection`) are defined.
- **Suggestions:**
  - **Single Source of Truth for Domain Entities:** Define core domain types (Note, Collection, User, etc.) in a central place (e.g., `src/types/entities.ts` or `src/domain/types.ts`). Minimize subtle variations between API responses (`ServerNote`), DB representations, and Zustand state. Use explicit mapping functions where differences are necessary.
  - **API Type Safety:** Explore using tools like tRPC (if backend is Node.js/TS) or generating types from an OpenAPI/Swagger specification for `ApiService`. This eliminates manual type definitions for API responses and ensures frontend and backend types stay synchronized.

### 3.5. Testing Strategy

- **Observation:** Lack of visible test files (though they might exist elsewhere). The complexity, especially around `SyncService` and state interactions, necessitates a robust testing strategy.
- **Suggestions:**
  - **Unit Tests:** Target pure functions (utils, selectors, simple UI components). Mock dependencies heavily. Refactoring `SyncService` (Suggestion 3.1) makes unit testing its individual parts feasible.
  - **Integration Tests (React Testing Library):** Test interactions between components, hooks, and state management (Zustand, TanStack Query). Verify user flows within specific features (e.g., creating a note updates the list). Mock services (`ApiService`, `SyncService`) at the boundaries.
  - **Service Integration Tests:** Test the refactored `SyncService` orchestrator and its components by mocking external dependencies (API, DB, WebSockets). Test critical synchronization scenarios (offline -> online, SSE updates, action queue processing).
  - **End-to-End Tests (Playwright/Cypress):** Cover critical user paths like login, creating/editing/deleting notes and collections, basic collaboration checks (if feasible in E2E).

### 3.6. Service Instantiation and Usage Consistency

- **Observation:** There are significant inconsistencies in how services are defined, instantiated, and used:
  - **`SyncService` & `NetworkStatusService`:** Defined as classes requiring instantiation (with dependencies like the store for `SyncService`). They attempt singleton behavior via a manual check in the constructor and rely on being instantiated once by a Provider. `NetworkStatusService` also confusingly mixes a `static` property (`isOnline`) with instance logic.
  - **`ApiService` & `SearchService`:** Defined as classes using only `static` methods and properties. They are used directly without instantiation (`ApiService.method()`). `SearchService` manages internal state (FlexSearch index, mutex) statically and runs a static `init()` at the module level.
  - **`authClient` & `hocuspocusSocket`:** These are instances created directly at the module level (using a factory or `new`) and exported as singletons.
- **Problems:** This mix of patterns (manual singletons, static classes, static state, exported instances) makes the service layer harder to understand, maintain, and test. Static state (`SearchService`, `NetworkStatusService`) is particularly problematic for testing and potential race conditions.
- **Suggestions:** Standardize on using **regular classes with dependency injection, instantiated once and provided via React Context**.
  1.  **Define as Instance Classes:** Refactor `ApiService`, `SearchService`, and `NetworkStatusService` to use instance methods and properties instead of static ones. State managed by `SearchService` (index, mutex) and `NetworkStatusService` (`isOnline`) should become instance properties.
  2.  **Explicit Dependencies via Constructor:** Declare all external dependencies (like the store for `SyncService`, or potentially `ApiService` for `SearchService`) as arguments in the class constructor.
  3.  **Remove Manual Singletons:** Remove the `instance` variable checks from the constructors of `SyncService` and `NetworkStatusService`. Singleton behavior will be ensured by instantiating only once.
  4.  **Centralized Instantiation:** Create instances of all core services (`SyncService`, `ApiService`, `SearchService`, `NetworkStatusService`) together in one central place, likely near the application root where providers are composed (e.g., potentially enhancing `StoreProvider` or creating a new top-level setup component/hook).
  5.  **Provide via Context:** Ensure each service instance is made available to the component tree via a dedicated React Context Provider (e.g., `ApiServiceProvider`, `SearchServiceProvider`, potentially keeping/enhancing `SyncProvider`, `NetworkStatusProvider`). Create corresponding consumer hooks (`useApiService()`, `useSearchService()`, etc.).
  6.  **Handle Initialization:** Manage any necessary asynchronous initialization (like `SearchService`'s index mounting) within the central instantiation logic or the relevant provider, potentially exposing a loading state via the context.
  7.  **Keep Client Instances:** For library clients like `authClient` and `hocuspocusSocket`, exporting the module-level instance is acceptable, though they could optionally be wrapped in contexts for maximum consistency.
- **Benefits:** This approach leads to a consistent, highly testable service layer where dependencies are explicit and lifecycle management is clearer. It avoids the pitfalls of static state and manual singleton implementations.

## 4. Conclusion

The application demonstrates sophisticated functionality with a modern tech stack. The primary area for improvement lies in refactoring the `lib` directory and the large `SyncService` to enhance modularity, testability, and maintainability. Refining state management clarity and potentially adopting a more feature-centric folder structure will also contribute to a more scalable and understandable codebase. Implementing a comprehensive testing strategy is crucial given the application's complexity.
