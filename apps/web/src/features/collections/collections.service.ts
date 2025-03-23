import {
  CollectionRepository,
  LocalDataService,
} from "@/lib/local-persistence/localDb";
import { Collection } from "@/lib/prisma";

/**
 * Service for collection-related operations.
 * This acts as a facade over the local data service.
 */
export class CollectionsService {
  /**
   * Create a new collection locally
   */
  static async createCollection(
    title: string,
    ownerId: string
  ): Promise<Collection> {
    const collectionId = crypto.randomUUID();

    // Create the action in local DB
    await LocalDataService.createCollection(collectionId, title, ownerId);

    const collection = {
      id: collectionId,
      title,
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return collection;
  }

  /**
   * Delete a collection locally
   */
  static async deleteCollection(collectionId: string): Promise<void> {
    await CollectionRepository.delete(collectionId);
  }

  /**
   * Update a collection locally
   */
  static async updateCollection(collection: Collection): Promise<void> {
    await CollectionRepository.update(collection);
  }

  /**
   * Get all collections
   */
  static async getCollections(): Promise<Collection[]> {
    return await CollectionRepository.getAll();
  }

  /**
   * Get a collection by ID
   */
  static async getCollection(id: string): Promise<Collection | undefined> {
    return await CollectionRepository.getById(id);
  }
}
