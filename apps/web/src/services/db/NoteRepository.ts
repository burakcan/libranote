import { userDatabaseService } from "./userDatabaseService";
import { wrapDbOperation } from "./wrapDbOperation";
import { ClientNote, ServerNote } from "@/types/Entities";
import { INoteRepository } from "@/types/Repositories";

export const NoteRepository = new (class implements INoteRepository {
  async getAll(): Promise<ClientNote[]> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      return await db.table<ClientNote>("notes").toArray();
    }, "Failed to fetch all notes");
  }

  // async getAllByCollectionId(collectionId?: string): Promise<ClientNote[]> {
  //   return wrapDbOperation(
  //     async () => {
  //       const db = userDatabaseService.getDatabase();
  //       if (collectionId) {
  //         return await db
  //           .table<ClientNote>("notes")
  //           .where({ collectionId })
  //           .toArray();
  //       }
  //       return await db.table<ClientNote>("notes").toArray();
  //     },
  //     `Failed to fetch all notes${collectionId ? ` for collection ${collectionId}` : ""}`
  //   );
  // }

  async getById(id: string): Promise<ClientNote | undefined> {
    return wrapDbOperation(() => {
      const db = userDatabaseService.getDatabase();
      return db.table<ClientNote>("notes").get(id);
    }, `Failed to fetch note with ID ${id}`);
  }

  async put(note: ClientNote): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.table<ClientNote>("notes").put(note);
    }, `Failed to put note with ID ${note.id}`);
  }

  async update(id: string, note: Partial<ClientNote>): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.table<ClientNote>("notes").update(id, note);
    }, `Failed to update note with ID ${id}`);
  }

  async delete(id: string): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.table<ClientNote>("notes").delete(id);
    }, `Failed to delete note with ID ${id}`);
  }

  async swap(localId: string, remoteNote: ServerNote): Promise<void> {
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

  async syncRemoteToLocal(remoteNotes: ServerNote[]): Promise<void> {
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
})();
