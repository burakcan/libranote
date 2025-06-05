import { userDatabaseService } from "./userDatabaseService";
import { wrapDbOperation } from "./wrapDbOperation";
import {
  ClientCollection,
  ClientNote,
  ServerCollection,
  ServerNote,
} from "@/types/Entities";
import { ClientUserSetting, ServerUserSetting } from "@/types/Settings";

export class TransactionService {
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

  static async syncRemoteSettingsToLocal(
    remoteSettings: ServerUserSetting[]
  ): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.transaction("rw", [db.table("settings")], async (tx) => {
        for (const remoteSetting of remoteSettings) {
          const localSetting = {
            key: remoteSetting.key as ClientUserSetting["key"],
            value: remoteSetting.value as ClientUserSetting["value"],
            updatedAt: remoteSetting.updatedAt,
          } as ClientUserSetting;

          await tx.table<ClientUserSetting>("settings").put(localSetting);
        }
      });
    }, "Failed to sync remote settings to local");
  }
}
