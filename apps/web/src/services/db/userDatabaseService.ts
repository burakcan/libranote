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
        "id, title, ownerId, createdAt, members, updatedAt, serverCreatedAt, serverUpdatedAt",
      notes:
        "id, title, description, createdById, collectionId, createdAt, updatedAt, serverCreatedAt, serverUpdatedAt, noteYDocState",
      actionQueue: "id, relatedEntityId, type, status, createdAt",
      noteYDocState: "id, noteId, updatedAt",
      settings: "key, value, updatedAt",
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

  async destroy(deleteOptions?: { disableAutoOpen: boolean }): Promise<void> {
    if (this.db) {
      await this.db.delete(deleteOptions || { disableAutoOpen: true });
      this.db = null;
      this.userId = null;
    }
  }
}

// Create a singleton instance
export const userDatabaseService = new UserDatabaseService();
