import { userDatabaseService } from "./userDatabaseService";
import { wrapDbOperation } from "./wrapDbOperation";
import { ActionQueueItem } from "@/types/ActionQueue";
import {
  ClientCollection,
  ClientNote,
  ServerCollection,
  ServerNote,
} from "@/types/Entities";

export class TransactionService {
  static async createCollection(
    collection: ClientCollection,
    actionId?: string
  ): Promise<void> {
    return wrapDbOperation(
      async () => {
        const db = userDatabaseService.getDatabase();
        await db.transaction(
          "rw",
          [db.table("collections"), db.table("actionQueue")],
          async (tx) => {
            await tx.table<ClientCollection>("collections").add(collection);

            if (actionId) {
              await tx.table<ActionQueueItem>("actionQueue").add({
                id: actionId,
                type: "CREATE_COLLECTION",
                relatedEntityId: collection.id,
                status: "pending",
                createdAt: new Date(),
              });
            }
          }
        );
      },
      `Failed to create collection with ID ${collection.id} ${
        actionId ? `and action queue item ${actionId}` : ""
      }`
    );
  }

  static async createNote(note: ClientNote, actionId?: string): Promise<void> {
    return wrapDbOperation(
      async () => {
        const db = userDatabaseService.getDatabase();
        await db.transaction(
          "rw",
          [db.table("notes"), db.table("actionQueue")],
          async (tx) => {
            await tx.table<ClientNote>("notes").add(note);

            if (actionId) {
              await tx.table<ActionQueueItem>("actionQueue").add({
                id: actionId,
                type: "CREATE_NOTE",
                relatedEntityId: note.id,
                status: "pending",
                createdAt: new Date(),
              });
            }
          }
        );
      },
      `Failed to create note with ID ${note.id} ${
        actionId ? `and action queue item ${actionId}` : ""
      }`
    );
  }

  static async updateNote(note: ClientNote, actionId?: string): Promise<void> {
    return wrapDbOperation(
      async () => {
        const db = userDatabaseService.getDatabase();
        await db.transaction(
          "rw",
          [db.table("notes"), db.table("actionQueue")],
          async (tx) => {
            await tx.table<ClientNote>("notes").put(note);

            if (actionId) {
              await tx.table<ActionQueueItem>("actionQueue").add({
                id: actionId,
                type: "UPDATE_NOTE",
                relatedEntityId: note.id,
                status: "pending",
                createdAt: new Date(),
              });
            }
          }
        );
      },
      `Failed to update note with ID ${note.id} ${
        actionId ? `and action queue item ${actionId}` : ""
      }`
    );
  }

  static async updateCollection(
    collection: ClientCollection,
    actionId?: string
  ): Promise<void> {
    return wrapDbOperation(
      async () => {
        const db = userDatabaseService.getDatabase();
        await db.transaction(
          "rw",
          [db.table("collections"), db.table("actionQueue")],
          async (tx) => {
            await tx.table<ClientCollection>("collections").put(collection);

            if (actionId) {
              await tx.table<ActionQueueItem>("actionQueue").add({
                id: actionId,
                type: "UPDATE_COLLECTION",
                relatedEntityId: collection.id,
                status: "pending",
                createdAt: new Date(),
              });
            }
          }
        );
      },
      `Failed to update collection with ID ${collection.id} ${
        actionId ? `and action queue item ${actionId}` : ""
      }`
    );
  }

  static async deleteCollection(
    collectionId: string,
    actionId?: string
  ): Promise<void> {
    return wrapDbOperation(
      async () => {
        const db = userDatabaseService.getDatabase();
        await db.transaction(
          "rw",
          [db.table("collections"), db.table("notes"), db.table("actionQueue")],
          async (tx) => {
            await tx
              .table<ClientCollection>("collections")
              .delete(collectionId);
            await tx
              .table<ClientNote>("notes")
              .where("collectionId")
              .equals(collectionId)
              .delete();

            if (actionId) {
              await tx.table<ActionQueueItem>("actionQueue").add({
                id: actionId,
                type: "DELETE_COLLECTION",
                relatedEntityId: collectionId,
                status: "pending",
                createdAt: new Date(),
              });
            }
          }
        );
      },
      `Failed to delete collection with ID ${collectionId} ${
        actionId ? `and action queue item ${actionId}` : ""
      }`
    );
  }

  static async deleteNote(noteId: string, actionId?: string): Promise<void> {
    return wrapDbOperation(
      async () => {
        const db = userDatabaseService.getDatabase();
        await db.transaction(
          "rw",
          [db.table("notes"), db.table("actionQueue")],
          async (tx) => {
            await tx.table<ClientNote>("notes").delete(noteId);

            if (actionId) {
              await tx.table<ActionQueueItem>("actionQueue").add({
                id: actionId,
                type: "DELETE_NOTE",
                relatedEntityId: noteId,
                status: "pending",
                createdAt: new Date(),
              });
            }
          }
        );
      },
      `Failed to delete note with ID ${noteId} ${
        actionId ? `and action queue item ${actionId}` : ""
      }`
    );
  }

  static async swapCollectionWithRemote(
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

  static async swapNoteWithRemote(
    localId: string,
    remoteNote: ServerNote
  ): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      if (localId === remoteNote.id) {
        // If IDs are the same, just update the note
        await db.table<ClientNote>("notes").put(remoteNote);
        return;
      }

      // Otherwise, we need to update references in notes and replace the note
      await db.transaction("rw", [db.table("notes")], async (tx) => {
        // 1. Add the remote note
        await tx.table<ClientNote>("notes").put(remoteNote);

        // 2. Delete the local note
        await tx.table<ClientNote>("notes").delete(localId);
      });
    }, `Failed to swap note with ID ${localId} for remote note ${remoteNote.id}`);
  }

  static async syncRemoteCollectionsToLocal(
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

  static async syncRemoteNotesToLocal(
    remoteNotes: ServerNote[]
  ): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.transaction("rw", [db.table("notes")], async (tx) => {
        // Upsert existing notes / create new ones
        for (const remoteNote of remoteNotes) {
          await tx.table<ClientNote>("notes").put(remoteNote);
        }

        // Delete notes that are no longer in the remote data
        await tx
          .table<ClientNote>("notes")
          .where("id")
          .noneOf(remoteNotes.map((note) => note.id))
          .delete();
      });
    }, "Failed to sync remote notes to local");
  }
}
