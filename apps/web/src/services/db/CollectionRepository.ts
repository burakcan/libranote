import { userDatabaseService } from "./userDatabaseService";
import { wrapDbOperation } from "./wrapDbOperation";
import {
  ClientCollection,
  ClientNote,
  ServerCollection,
} from "@/types/Entities";
import { ICollectionRepository } from "@/types/Repositories";

export const CollectionRepository = new (class
  implements ICollectionRepository
{
  async getAll(): Promise<ClientCollection[]> {
    return wrapDbOperation(() => {
      const db = userDatabaseService.getDatabase();
      return db.table<ClientCollection>("collections").toArray();
    }, "Failed to fetch all collections");
  }

  async getById(id: string): Promise<ClientCollection | undefined> {
    return wrapDbOperation(() => {
      const db = userDatabaseService.getDatabase();
      return db.table<ClientCollection>("collections").get(id);
    }, `Failed to fetch collection with ID ${id}`);
  }

  async put(collection: ClientCollection): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.table<ClientCollection>("collections").put(collection);
    }, `Failed to put collection with ID ${collection.id}`);
  }

  async update(
    id: string,
    collection: Partial<ClientCollection>
  ): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.table<ClientCollection>("collections").update(id, collection);
    }, `Failed to update collection with ID ${id}`);
  }

  async delete(id: string): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.table<ClientCollection>("collections").delete(id);
    }, `Failed to delete collection with ID ${id}`);
  }

  async swap(
    localId: string,
    remoteCollection: ServerCollection
  ): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      if (localId === remoteCollection.id) {
        // If IDs are the same, just update the collection
        await db.table<ClientCollection>("collections").put(remoteCollection);
        return;
      }

      // Otherwise, we need to update references in notes and replace the collection
      await db.transaction(
        "rw",
        [db.table("collections"), db.table("notes")],
        async (tx) => {
          // 1. Update each note to reference the new collection ID
          await tx
            .table<ClientNote>("notes")
            .where("collectionId")
            .equals(localId)
            .modify({
              collectionId: remoteCollection.id,
            });

          // 2. Add the remote collection
          await tx.table<ClientCollection>("collections").put(remoteCollection);

          // 3. Delete the local collection
          await tx.table<ClientCollection>("collections").delete(localId);
        }
      );
    }, `Failed to swap collection with ID ${localId} for remote collection ${remoteCollection.id}`);
  }

  async syncRemoteToLocal(
    remoteCollections: ServerCollection[]
  ): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.transaction("rw", [db.table("collections")], async (tx) => {
        // Upsert existing collections / create new ones
        for (const remoteCollection of remoteCollections) {
          await tx.table<ClientCollection>("collections").put(remoteCollection);
        }

        // Delete collections that are no longer in the remote data
        await tx
          .table<ClientCollection>("collections")
          .where("id")
          .noneOf(remoteCollections.map((collection) => collection.id))
          .delete();
      });
    }, "Failed to sync remote collections to local");
  }
})();
