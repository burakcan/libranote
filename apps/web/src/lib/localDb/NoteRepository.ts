import { Note } from "@repo/db";
import { dexie } from "./dexie";
import { wrapDbOperation } from "./wrapDbOperation";

export class NoteRepository {
  static async getAll(collectionId?: string): Promise<Note[]> {
    return wrapDbOperation(
      async () => {
        if (collectionId) {
          return await dexie
            .table<Note>("notes")
            .where({ collectionId })
            .toArray();
        }
        return await dexie.table<Note>("notes").toArray();
      },
      `Failed to fetch all notes${collectionId ? ` for collection ${collectionId}` : ""}`
    );
  }

  static async getById(id: string): Promise<Note | undefined> {
    return wrapDbOperation(
      () => dexie.table<Note>("notes").get(id),
      `Failed to fetch note with ID ${id}`
    );
  }

  static async create(note: Note): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.table<Note>("notes").add(note);
    }, `Failed to create note with ID ${note.id}`);
  }

  static async update(note: Note): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.table<Note>("notes").put(note);
    }, `Failed to update note with ID ${note.id}`);
  }

  static async delete(id: string): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.table<Note>("notes").delete(id);
    }, `Failed to delete note with ID ${id}`);
  }

  static async swap(localId: string, remoteNote: Note): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.transaction("rw", dexie.table("notes"), async (tx) => {
        await tx.table<Note>("notes").put(remoteNote);
        await tx.table<Note>("notes").delete(localId);
      });
    }, `Failed to swap note with ID ${localId} for remote note ${remoteNote.id}`);
  }
}
