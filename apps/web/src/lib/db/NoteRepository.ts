import { userDatabaseService } from "./userDatabaseService";
import { wrapDbOperation } from "./wrapDbOperation";
import { ClientNote, ServerNote } from "@/types/Entities";

export class NoteRepository {
  static async getAllByCollectionId(
    collectionId?: string
  ): Promise<ClientNote[]> {
    return wrapDbOperation(
      async () => {
        const db = userDatabaseService.getDatabase();
        if (collectionId) {
          return await db
            .table<ClientNote>("notes")
            .where({ collectionId })
            .toArray();
        }
        return await db.table<ClientNote>("notes").toArray();
      },
      `Failed to fetch all notes${collectionId ? ` for collection ${collectionId}` : ""}`
    );
  }

  static async getById(id: string): Promise<ClientNote | undefined> {
    return wrapDbOperation(() => {
      const db = userDatabaseService.getDatabase();
      return db.table<ClientNote>("notes").get(id);
    }, `Failed to fetch note with ID ${id}`);
  }

  static async put(note: ClientNote): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.table<ClientNote>("notes").put(note);
    }, `Failed to put note with ID ${note.id}`);
  }

  static async update(id: string, note: Partial<ClientNote>): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.table<ClientNote>("notes").update(id, note);
    }, `Failed to update note with ID ${id}`);
  }

  static async delete(id: string): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.table<ClientNote>("notes").delete(id);
    }, `Failed to delete note with ID ${id}`);
  }

  static async swap(localId: string, remoteNote: ServerNote): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.transaction("rw", db.table("notes"), async (tx) => {
        await tx.table<ClientNote>("notes").put(remoteNote);
        await tx.table<ClientNote>("notes").delete(localId);
      });
    }, `Failed to swap note with ID ${localId} for remote note ${remoteNote.id}`);
  }
}
