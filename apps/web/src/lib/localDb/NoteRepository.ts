import { Note } from "@repo/db";
import { dexie } from "./dexie";
import { wrapDbOperation } from "./wrapDbOperation";

export class NoteRepository {
  static async getAll(collectionId?: string): Promise<ClientNote[]> {
    return wrapDbOperation(
      async () => {
        if (collectionId) {
          return await dexie
            .table<ClientNote>("notes")
            .where({ collectionId })
            .toArray();
        }
        return await dexie.table<ClientNote>("notes").toArray();
      },
      `Failed to fetch all notes${collectionId ? ` for collection ${collectionId}` : ""}`
    );
  }

  static async getById(id: string): Promise<ClientNote | undefined> {
    return wrapDbOperation(
      () => dexie.table<ClientNote>("notes").get(id),
      `Failed to fetch note with ID ${id}`
    );
  }

  static async create(note: ClientNote): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.table<ClientNote>("notes").add(note);
    }, `Failed to create note with ID ${note.id}`);
  }

  static async update(note: ClientNote): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.table<ClientNote>("notes").put(note);
    }, `Failed to update note with ID ${note.id}`);
  }

  static async delete(id: string): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.table<ClientNote>("notes").delete(id);
    }, `Failed to delete note with ID ${id}`);
  }

  static async swap(localId: string, remoteNote: Note): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.transaction("rw", dexie.table("notes"), async (tx) => {
        await tx.table<ClientNote>("notes").put(remoteNote);
        await tx.table<ClientNote>("notes").delete(localId);
      });
    }, `Failed to swap note with ID ${localId} for remote note ${remoteNote.id}`);
  }
}
