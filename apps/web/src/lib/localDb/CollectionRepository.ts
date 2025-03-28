import { dexie } from "./dexie";
import { wrapDbOperation } from "./wrapDbOperation";

export class CollectionRepository {
  static async getAll(): Promise<ClientCollection[]> {
    return wrapDbOperation(
      () => dexie.table<ClientCollection>("collections").toArray(),
      "Failed to fetch all collections"
    );
  }

  static async getById(id: string): Promise<ClientCollection | undefined> {
    return wrapDbOperation(
      () => dexie.table<ClientCollection>("collections").get(id),
      `Failed to fetch collection with ID ${id}`
    );
  }

  static async create(collection: ClientCollection): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.table<ClientCollection>("collections").add(collection);
    }, `Failed to create collection with ID ${collection.id}`);
  }

  static async update(collection: ClientCollection): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.table<ClientCollection>("collections").put(collection);
    }, `Failed to update collection with ID ${collection.id}`);
  }

  static async delete(id: string): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.table<ClientCollection>("collections").delete(id);
    }, `Failed to delete collection with ID ${id}`);
  }
}
