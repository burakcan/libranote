import { Collection, Note } from "@/lib/db/prisma";
import { dexie } from "./dexie";
import { wrapDbOperation } from "./wrapDbOperation";

export class TransactionService {
  static async createCollectionWithAction(
    collection: ClientCollection,
    actionId: string
  ): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.transaction(
        "rw",
        [dexie.table("collections"), dexie.table("actionQueue")],
        async (tx) => {
          await tx.table<ClientCollection>("collections").add(collection);
          await tx.table<ActionQueue.Item>("actionQueue").add({
            id: actionId,
            type: "CREATE_COLLECTION",
            relatedEntityId: collection.id,
            status: "pending",
            createdAt: new Date(),
          });
        }
      );
    }, `Failed to create collection with ID ${collection.id} and action queue item`);
  }

  static async createNoteWithAction(
    note: ClientNote,
    actionId: string
  ): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.transaction(
        "rw",
        [dexie.table("notes"), dexie.table("actionQueue")],
        async (tx) => {
          await tx.table<ClientNote>("notes").add(note);
          await tx.table<ActionQueue.Item>("actionQueue").add({
            id: actionId,
            type: "CREATE_NOTE",
            relatedEntityId: note.id,
            status: "pending",
            createdAt: new Date(),
          });
        }
      );
    }, `Failed to create note with ID ${note.id} and action queue item`);
  }

  static async updateCollectionWithAction(
    collection: ClientCollection,
    actionId: string
  ): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.transaction(
        "rw",
        [dexie.table("collections"), dexie.table("actionQueue")],
        async (tx) => {
          await tx.table<ClientCollection>("collections").put(collection);
          await tx.table<ActionQueue.Item>("actionQueue").add({
            id: actionId,
            type: "UPDATE_COLLECTION",
            relatedEntityId: collection.id,
            status: "pending",
            createdAt: new Date(),
          });
        }
      );
    }, `Failed to update collection with ID ${collection.id} and action queue item`);
  }

  static async deleteEntityWithAction(
    entityType: "collection" | "note",
    entityId: string,
    actionId: string
  ): Promise<void> {
    const tableName = entityType === "collection" ? "collections" : "notes";
    const actionType =
      entityType === "collection" ? "DELETE_COLLECTION" : "DELETE_NOTE";

    return wrapDbOperation(async () => {
      await dexie.transaction(
        "rw",
        [dexie.table(tableName), dexie.table("actionQueue")],
        async (tx) => {
          await tx.table(tableName).delete(entityId);
          await tx.table<ActionQueue.Item>("actionQueue").add({
            id: actionId,
            type: actionType,
            relatedEntityId: entityId,
            status: "pending",
            createdAt: new Date(),
          });
        }
      );
    }, `Failed to delete ${entityType} with ID ${entityId} and create action queue item`);
  }

  static async deleteCollectionWithoutAction(id: string): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.transaction(
        "rw",
        [dexie.table("collections"), dexie.table("notes")],
        async (tx) => {
          await tx.table<ClientCollection>("collections").delete(id);
          await tx
            .table<ClientNote>("notes")
            .where({ collectionId: id })
            .delete();
        }
      );
    }, `Failed to delete collection with ID ${id}`);
  }

  static async swapCollectionWithRemote(
    localId: string,
    remoteCollection: Collection
  ): Promise<void> {
    return wrapDbOperation(async () => {
      if (localId === remoteCollection.id) {
        // If IDs are the same, just update the collection
        await dexie
          .table<ClientCollection>("collections")
          .put(remoteCollection);
        return;
      }

      // Otherwise, we need to update references in notes and replace the collection
      await dexie.transaction(
        "rw",
        [dexie.table("collections"), dexie.table("notes")],
        async (tx) => {
          // 1. Update each note to reference the new collection ID
          await tx
            .table<ClientNote>("notes")
            .where({ collectionId: localId })
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

  static async syncRemoteCollectionsToLocal(
    remoteCollections: Collection[]
  ): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.transaction(
        "rw",
        [dexie.table("collections")],
        async (tx) => {
          /* 1. Update existing collections
             2. Add new collections
             3. Delete collections that are no longer in the remote data */

          // Upsert existing collections / create new ones
          for (const remoteCollection of remoteCollections) {
            tx.table<ClientCollection>("collections").put(remoteCollection);
          }

          // Delete collections that are no longer in the remote data
          tx.table<ClientCollection>("collections")
            .where("id")
            .noneOf(remoteCollections.map((collection) => collection.id))
            .delete();
        }
      );
    }, "Failed to sync remote collections to local");
  }

  static async syncRemoteNotesToLocal(remoteNotes: Note[]): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.transaction("rw", [dexie.table("notes")], async (tx) => {
        /* 1. Update existing notes
             2. Add new notes
             3. Delete notes that are no longer in the remote data */

        // Upsert existing notes / create new ones
        for (const remoteNote of remoteNotes) {
          tx.table<ClientNote>("notes").put(remoteNote);
        }

        // Delete notes that are no longer in the remote data
        tx.table<ClientNote>("notes")
          .where("id")
          .noneOf(remoteNotes.map((note) => note.id))
          .delete();
      });
    }, "Failed to sync remote notes to local");
  }
}
