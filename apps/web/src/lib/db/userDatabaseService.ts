import Dexie from "dexie";

export interface DatabaseService {
  getDatabase(): Dexie;
  initialize(userId: string): Promise<void>;
  cleanup(): Promise<void>;
}

export class UserDatabaseService implements DatabaseService {
  private db: Dexie | null = null;
  private userId: string | null = null;

  async initialize(userId: string): Promise<void> {
    if (this.userId === userId && this.db) {
      return;
    }

    // Cleanup existing database if any
    await this.cleanup();

    const dbName = `libra-db-${userId}`;
    this.db = new Dexie(dbName);

    this.db.version(1).stores({
      collections:
        "id, title, ownerId, createdAt, updatedAt, serverCreatedAt, serverUpdatedAt",
      notes:
        "id, title, description, createdById, collectionId, createdAt, updatedAt, serverCreatedAt, serverUpdatedAt, noteYDocState",
      actionQueue: "id, relatedEntityId, type, status, createdAt",
    });

    await this.db.open();
    this.userId = userId;
  }

  getDatabase(): Dexie {
    if (!this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.db;
  }

  async cleanup(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.userId = null;
    }
  }
}

// Create a singleton instance
export const userDatabaseService = new UserDatabaseService();
