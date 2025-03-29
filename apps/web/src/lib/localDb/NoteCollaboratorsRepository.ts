import { NoteCollaborator } from "@repo/db";
import { dexie } from "./dexie";
import { wrapDbOperation } from "./wrapDbOperation";

export class NoteCollaboratorsRepository {
  static async getAll(): Promise<NoteCollaborator[]> {
    return wrapDbOperation(
      () => dexie.table<NoteCollaborator>("noteCollaborators").toArray(),
      `Failed to fetch all note collaborators`
    );
  }

  static async getAllByNoteId(noteId: string): Promise<NoteCollaborator[]> {
    return wrapDbOperation(
      () =>
        dexie
          .table<NoteCollaborator>("noteCollaborators")
          .where("noteId")
          .equals(noteId)
          .toArray(),
      `Failed to fetch all note collaborators for note ${noteId}`
    );
  }

  static async getAllByUserId(userId: string): Promise<NoteCollaborator[]> {
    return wrapDbOperation(
      () =>
        dexie
          .table<NoteCollaborator>("noteCollaborators")
          .where("userId")
          .equals(userId)
          .toArray(),
      `Failed to fetch all note collaborators for user ${userId}`
    );
  }

  static async put(noteCollaborator: NoteCollaborator): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie
        .table<NoteCollaborator>("noteCollaborators")
        .put(noteCollaborator);
    }, `Failed to create note collaborator`);
  }

  static async delete(noteCollaborator: NoteCollaborator): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie
        .table<NoteCollaborator>("noteCollaborators")
        .delete(noteCollaborator.id);
    }, `Failed to delete note collaborator`);
  }
}
