import { Collection, Note } from "@/lib/prisma";
import * as localDb from "./localDb";

/**
 * LocalDataService provides an interface for all local data operations,
 * separating business logic from database operations.
 */
export class LocalDataService {
  /**
   * Collections
   */
  static async getCollections(): Promise<Collection[]> {
    return await localDb.getCollections();
  }

  static async getCollection(id: string): Promise<Collection | undefined> {
    return await localDb.getCollection(id);
  }

  static async createCollection(
    id: string,
    title: string,
    ownerId: string
  ): Promise<string> {
    const actionId = crypto.randomUUID();
    await localDb.createCollection(id, title, ownerId, actionId);
    return actionId;
  }

  static async updateCollection(collection: Collection): Promise<void> {
    await localDb.upsertCollection(collection);
  }

  static async deleteCollection(id: string): Promise<void> {
    await localDb.deleteCollection(id);
  }

  static async swapCollection(
    localCollection: Collection,
    remoteCollection: Collection
  ): Promise<void> {
    await localDb.swapCollection(localCollection, remoteCollection);
  }

  /**
   * Notes
   */
  static async getNotes(collectionId?: string): Promise<Note[]> {
    return await localDb.getNotes(collectionId);
  }

  static async getNote(id: string): Promise<Note | undefined> {
    return await localDb.getNote(id);
  }

  static async createNote(
    id: string,
    title: string,
    description: string,
    ownerId: string,
    collectionId: string
  ): Promise<string> {
    const actionId = crypto.randomUUID();
    await localDb.createNote(
      id,
      title,
      description,
      ownerId,
      collectionId,
      actionId
    );
    return actionId;
  }

  static async updateNote(note: Note): Promise<void> {
    await localDb.upsertNote(note);
  }

  static async deleteNote(id: string): Promise<void> {
    await localDb.deleteNote(id);
  }

  static async swapNote(localNote: Note, remoteNote: Note): Promise<void> {
    await localDb.swapNote(localNote, remoteNote);
  }

  /**
   * Action Queue
   */
  static async getActionQueue(): Promise<ActionQueue.Item[]> {
    return await localDb.getActionQueue();
  }

  static async addActionToQueue(
    actionType: ActionQueue.ItemType,
    relatedEntityId: string
  ): Promise<string> {
    const actionId = crypto.randomUUID();

    await localDb.addActionToQueue({
      id: actionId,
      type: actionType,
      relatedEntityId,
      status: "pending",
      createdAt: new Date(),
    });

    return actionId;
  }

  static async removeActionFromQueue(id: string): Promise<void> {
    await localDb.removeActionFromQueue(id);
  }
}
