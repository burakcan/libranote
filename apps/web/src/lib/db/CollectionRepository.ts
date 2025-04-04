import { databaseService } from "./db";
import { wrapDbOperation } from "./wrapDbOperation";
import { ClientCollection } from "@/types/Entities";

export class CollectionRepository {
  static async getAll(): Promise<ClientCollection[]> {
    return wrapDbOperation(() => {
      const db = databaseService.getDatabase();
      return db.table<ClientCollection>("collections").toArray();
    }, "Failed to fetch all collections");
  }

  static async getById(id: string): Promise<ClientCollection | undefined> {
    return wrapDbOperation(() => {
      const db = databaseService.getDatabase();
      return db.table<ClientCollection>("collections").get(id);
    }, `Failed to fetch collection with ID ${id}`);
  }

  static async put(collection: ClientCollection): Promise<void> {
    return wrapDbOperation(async () => {
      const db = databaseService.getDatabase();
      await db.table<ClientCollection>("collections").put(collection);
    }, `Failed to put collection with ID ${collection.id}`);
  }

  static async update(
    id: string,
    collection: Partial<ClientCollection>
  ): Promise<void> {
    return wrapDbOperation(async () => {
      const db = databaseService.getDatabase();
      await db.table<ClientCollection>("collections").update(id, collection);
    }, `Failed to update collection with ID ${id}`);
  }

  static async delete(id: string): Promise<void> {
    return wrapDbOperation(async () => {
      const db = databaseService.getDatabase();
      await db.table<ClientCollection>("collections").delete(id);
    }, `Failed to delete collection with ID ${id}`);
  }
}
