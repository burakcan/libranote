import { Collection } from "@/lib/db/prisma";
import { dexie } from "./dexie";
import { wrapDbOperation } from "./wrapDbOperation";

export class CollectionRepository {
  static async getAll(): Promise<Collection[]> {
    return wrapDbOperation(
      () => dexie.table<Collection>("collections").toArray(),
      "Failed to fetch all collections"
    );
  }

  static async getById(id: string): Promise<Collection | undefined> {
    return wrapDbOperation(
      () => dexie.table<Collection>("collections").get(id),
      `Failed to fetch collection with ID ${id}`
    );
  }

  static async create(collection: Collection): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.table<Collection>("collections").add(collection);
    }, `Failed to create collection with ID ${collection.id}`);
  }

  static async update(collection: Collection): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.table<Collection>("collections").put(collection);
    }, `Failed to update collection with ID ${collection.id}`);
  }

  static async delete(id: string): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.table<Collection>("collections").delete(id);
    }, `Failed to delete collection with ID ${id}`);
  }
}
