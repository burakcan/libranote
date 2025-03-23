import Dexie from "dexie";
import { Collection, Note } from "@/lib/prisma";

// Setup database
export const db = new Dexie("libra-local-db");

db.version(1).stores({
  collections: "id, title, ownerId, createdAt, updatedAt",
  notes: "id, title, description, ownerId, collectionId, createdAt, updatedAt",
  actionQueue: "id, relatedEntityId, type, status, createdAt",
});

// Repository classes
export class CollectionRepository {
  static async getAll(): Promise<Collection[]> {
    return await db.table<Collection>("collections").toArray();
  }

  static async getById(id: string): Promise<Collection | undefined> {
    return await db.table<Collection>("collections").get(id);
  }

  static async create(collection: Collection, actionId: string): Promise<void> {
    await db.transaction(
      "rw",
      [db.table("collections"), db.table("actionQueue")],
      async (tx) => {
        await tx.table<Collection>("collections").add(collection);
        await tx.table<ActionQueue.Item>("actionQueue").add({
          id: actionId,
          type: "CREATE_COLLECTION",
          relatedEntityId: collection.id,
          status: "pending",
          createdAt: new Date(),
        });
      }
    );
  }

  static async update(collection: Collection): Promise<void> {
    await db.table<Collection>("collections").put(collection);
  }

  static async delete(id: string): Promise<void> {
    await db.table<Collection>("collections").delete(id);
  }

  static async swap(
    localId: string,
    remoteCollection: Collection
  ): Promise<void> {
    if (localId === remoteCollection.id) {
      // If IDs are the same, just update the collection
      await db.table<Collection>("collections").put(remoteCollection);
      return;
    }

    // Otherwise, we need to update references in notes and replace the collection
    await db.transaction(
      "rw",
      [db.table("collections"), db.table("notes")],
      async (tx) => {
        // 1. Update each note to reference the new collection ID
        await tx.table<Note>("notes").where({ collectionId: localId }).modify({
          collectionId: remoteCollection.id,
        });

        // 3. Add the remote collection
        await tx.table<Collection>("collections").put(remoteCollection);

        // 4. Delete the local collection
        await tx.table<Collection>("collections").delete(localId);
      }
    );
  }
}

export class NoteRepository {
  static async getAll(collectionId?: string): Promise<Note[]> {
    if (collectionId) {
      return await db.table<Note>("notes").where({ collectionId }).toArray();
    }
    return await db.table<Note>("notes").toArray();
  }

  static async getById(id: string): Promise<Note | undefined> {
    return await db.table<Note>("notes").get(id);
  }

  static async create(note: Note, actionId: string): Promise<void> {
    await db.transaction(
      "rw",
      [db.table("notes"), db.table("actionQueue")],
      async (tx) => {
        await tx.table<Note>("notes").add(note);
        await tx.table<ActionQueue.Item>("actionQueue").add({
          id: actionId,
          type: "CREATE_NOTE",
          relatedEntityId: note.id,
          status: "pending",
          createdAt: new Date(),
        });
      }
    );
  }

  static async update(note: Note): Promise<void> {
    await db.table<Note>("notes").put(note);
  }

  static async delete(id: string): Promise<void> {
    await db.table<Note>("notes").delete(id);
  }

  static async swap(localId: string, remoteNote: Note): Promise<void> {
    await db.transaction("rw", db.table("notes"), async (tx) => {
      await tx.table<Note>("notes").put(remoteNote);
      await tx.table<Note>("notes").delete(localId);
    });
  }
}

export class ActionQueueRepository {
  static async getAll(): Promise<ActionQueue.Item[]> {
    return await db.table<ActionQueue.Item>("actionQueue").toArray();
  }

  static async add(action: ActionQueue.Item): Promise<void> {
    await db.table<ActionQueue.Item>("actionQueue").add(action);
  }

  static async remove(id: string): Promise<void> {
    await db.table<ActionQueue.Item>("actionQueue").delete(id);
  }
}

// Service layer for coordinating between repositories when needed
export class LocalDataService {
  static async createCollection(
    id: string,
    title: string,
    ownerId: string
  ): Promise<string> {
    const actionId = crypto.randomUUID();
    const collection: Collection = {
      id,
      title,
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await CollectionRepository.create(collection, actionId);
    return actionId;
  }

  static async createNote(
    id: string,
    title: string,
    description: string,
    ownerId: string,
    collectionId: string
  ): Promise<string> {
    const actionId = crypto.randomUUID();
    const note: Note = {
      id,
      title,
      description,
      ownerId,
      collectionId,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await NoteRepository.create(note, actionId);
    return actionId;
  }

  static async addActionToQueue(
    actionType: ActionQueue.ItemType,
    relatedEntityId: string
  ): Promise<string> {
    const actionId = crypto.randomUUID();

    await ActionQueueRepository.add({
      id: actionId,
      type: actionType,
      relatedEntityId,
      status: "pending",
      createdAt: new Date(),
    });

    return actionId;
  }
}
