# Database Architecture Analysis

## Current Architecture

- Single Dexie database named "libra-local-db"
- Three tables: collections, notes, actionQueue
- Database is initialized in `db.ts` and used by repositories and services
- SyncService orchestrates syncing between local and remote data
- Store manages application state and uses repositories for persistence

## Requirements for Per-User Databases

1. Each user should have their own database
2. Database name should be based on user ID
3. Database connection should be injected into services and repositories
4. Maintain data isolation between users
5. Handle user switching gracefully

## Alternative Solutions

### Solution 1: Database Factory Pattern

```typescript
class DatabaseFactory {
  private static instances: Map<string, Dexie> = new Map();

  static getDatabase(userId: string): Dexie {
    const dbName = `libra-db-${userId}`;
    if (!this.instances.has(dbName)) {
      const db = new Dexie(dbName);
      db.version(1).stores({...}); // Same schema
      this.instances.set(dbName, db);
    }
    return this.instances.get(dbName)!;
  }
}
```

Pros:

- Simple implementation
- Easy to manage multiple database instances
- Clear separation of user data

Cons:

- Need to modify all repositories to accept database instance
- More memory usage with multiple database instances
- No built-in cleanup mechanism

### Solution 2: Context-Based Database Provider

```typescript
class DatabaseProvider {
  private static currentDb: Dexie | null = null;
  private static currentUserId: string | null = null;

  static switchUser(userId: string): void {
    if (this.currentUserId === userId) return;
    this.currentDb?.close();
    this.currentDb = new Dexie(`libra-db-${userId}`);
    this.currentDb.version(1).stores({...}); // Same schema
    this.currentUserId = userId;
  }

  static getDatabase(): Dexie {
    if (!this.currentDb) throw new Error('No active database');
    return this.currentDb;
  }
}
```

Pros:

- Single active database at a time
- Lower memory footprint
- No need to modify repository interfaces

Cons:

- Global state management
- Need to handle database switching carefully
- Potential race conditions during user switching

### Solution 3: Database Service with Dependency Injection

```typescript
interface DatabaseService {
  getDatabase(): Dexie;
  initialize(userId: string): Promise<void>;
  cleanup(): Promise<void>;
}

class UserDatabaseService implements DatabaseService {
  private db: Dexie | null = null;

  async initialize(userId: string): Promise<void> {
    this.db = new Dexie(`libra-db-${userId}`);
    this.db.version(1).stores({...}); // Same schema
    await this.db.open();
  }

  getDatabase(): Dexie {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  async cleanup(): Promise<void> {
    await this.db?.close();
    this.db = null;
  }
}
```

Pros:

- Clean dependency injection
- Explicit lifecycle management
- Testable and maintainable

Cons:

- More complex implementation
- Requires significant refactoring of existing code
- Need to manage service lifecycle

## Recommended Solution

After analyzing the alternatives, Solution 3 (Database Service with DI) is recommended for the following reasons:

1. **Clean Architecture**: It follows solid principles and provides clear separation of concerns
2. **Explicit Lifecycle**: Database initialization and cleanup are explicit and controllable
3. **Testability**: Easy to mock and test in isolation
4. **Future-proof**: Easier to extend with additional features (e.g., migration, backup)
5. **Type Safety**: Strong typing and compile-time checks

## Implementation Plan

1. Create DatabaseService interface and implementation
2. Modify db.ts to export DatabaseService instead of direct Dexie instance
3. Update repositories to use DatabaseService
4. Inject DatabaseService into SyncService and other consumers
5. Initialize DatabaseService in the authentication flow
6. Add cleanup on user logout

The implementation will maintain the current functionality while adding proper user isolation and improved architecture.
