import Dexie from "dexie";
import { Collection, Note } from "@/lib/prisma";

// Setup database
export const db = new Dexie("libra-local-db");

db.version(1).stores({
  collections: "id, title, ownerId, createdAt, updatedAt",
  notes: "id, title, description, ownerId, collectionId, createdAt, updatedAt",
  actionQueue: "id, relatedEntityId, type, status, createdAt",
});

// Error handling utils
const wrapDbOperation = async <T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw new Error(`${errorMessage}: ${(error as Error).message}`);
  }
};

// Repository classes
export class CollectionRepository {
  static async getAll(): Promise<Collection[]> {
    return wrapDbOperation(
      () => db.table<Collection>("collections").toArray(),
      "Failed to fetch all collections"
    );
  }

  static async getById(id: string): Promise<Collection | undefined> {
    return wrapDbOperation(
      () => db.table<Collection>("collections").get(id),
      `Failed to fetch collection with ID ${id}`
    );
  }

  static async create(collection: Collection): Promise<void> {
    return wrapDbOperation(async () => {
      await db.table<Collection>("collections").add(collection);
    }, `Failed to create collection with ID ${collection.id}`);
  }

  static async update(collection: Collection): Promise<void> {
    return wrapDbOperation(async () => {
      await db.table<Collection>("collections").put(collection);
    }, `Failed to update collection with ID ${collection.id}`);
  }

  static async delete(id: string): Promise<void> {
    return wrapDbOperation(async () => {
      await db.table<Collection>("collections").delete(id);
    }, `Failed to delete collection with ID ${id}`);
  }

  static async swap(
    localId: string,
    remoteCollection: Collection
  ): Promise<void> {
    return wrapDbOperation(async () => {
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
          await tx
            .table<Note>("notes")
            .where({ collectionId: localId })
            .modify({
              collectionId: remoteCollection.id,
            });

          // 2. Add the remote collection
          await tx.table<Collection>("collections").put(remoteCollection);

          // 3. Delete the local collection
          await tx.table<Collection>("collections").delete(localId);
        }
      );
    }, `Failed to swap collection with ID ${localId} for remote collection ${remoteCollection.id}`);
  }
}

export class NoteRepository {
  static async getAll(collectionId?: string): Promise<Note[]> {
    return wrapDbOperation(
      async () => {
        if (collectionId) {
          return await db
            .table<Note>("notes")
            .where({ collectionId })
            .toArray();
        }
        return await db.table<Note>("notes").toArray();
      },
      `Failed to fetch all notes${collectionId ? ` for collection ${collectionId}` : ""}`
    );
  }

  static async getById(id: string): Promise<Note | undefined> {
    return wrapDbOperation(
      () => db.table<Note>("notes").get(id),
      `Failed to fetch note with ID ${id}`
    );
  }

  static async create(note: Note): Promise<void> {
    return wrapDbOperation(async () => {
      await db.table<Note>("notes").add(note);
    }, `Failed to create note with ID ${note.id}`);
  }

  static async update(note: Note): Promise<void> {
    return wrapDbOperation(async () => {
      await db.table<Note>("notes").put(note);
    }, `Failed to update note with ID ${note.id}`);
  }

  static async delete(id: string): Promise<void> {
    return wrapDbOperation(async () => {
      await db.table<Note>("notes").delete(id);
    }, `Failed to delete note with ID ${id}`);
  }

  static async swap(localId: string, remoteNote: Note): Promise<void> {
    return wrapDbOperation(async () => {
      await db.transaction("rw", db.table("notes"), async (tx) => {
        await tx.table<Note>("notes").put(remoteNote);
        await tx.table<Note>("notes").delete(localId);
      });
    }, `Failed to swap note with ID ${localId} for remote note ${remoteNote.id}`);
  }
}

export class ActionQueueRepository {
  static async getAll(): Promise<ActionQueue.Item[]> {
    return wrapDbOperation(
      () => db.table<ActionQueue.Item>("actionQueue").toArray(),
      "Failed to fetch action queue items"
    );
  }

  static async getById(id: string): Promise<ActionQueue.Item | undefined> {
    return wrapDbOperation(
      () => db.table<ActionQueue.Item>("actionQueue").get(id),
      `Failed to fetch action queue item with ID ${id}`
    );
  }

  static async create(action: ActionQueue.Item): Promise<void> {
    return wrapDbOperation(async () => {
      await db.table<ActionQueue.Item>("actionQueue").add(action);
    }, `Failed to create action queue item with ID ${action.id}`);
  }

  static async update(action: ActionQueue.Item): Promise<void> {
    return wrapDbOperation(async () => {
      await db.table<ActionQueue.Item>("actionQueue").put(action);
    }, `Failed to update action queue item with ID ${action.id}`);
  }

  static async delete(id: string): Promise<void> {
    return wrapDbOperation(async () => {
      await db.table<ActionQueue.Item>("actionQueue").delete(id);
    }, `Failed to delete action queue item with ID ${id}`);
  }
}

// Specialized transaction service
export class TransactionService {
  static async createCollectionWithAction(
    collection: Collection,
    actionId: string
  ): Promise<void> {
    return wrapDbOperation(async () => {
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
    }, `Failed to create collection with ID ${collection.id} and action queue item`);
  }

  static async createNoteWithAction(
    note: Note,
    actionId: string
  ): Promise<void> {
    return wrapDbOperation(async () => {
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
    }, `Failed to create note with ID ${note.id} and action queue item`);
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
      await db.transaction(
        "rw",
        [db.table(tableName), db.table("actionQueue")],
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

    await TransactionService.createCollectionWithAction(collection, actionId);
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

    await TransactionService.createNoteWithAction(note, actionId);
    return actionId;
  }

  static async addActionToQueue(
    actionType: ActionQueue.ItemType,
    relatedEntityId: string
  ): Promise<string> {
    const actionId = crypto.randomUUID();
    const action: ActionQueue.Item = {
      id: actionId,
      type: actionType,
      relatedEntityId,
      status: "pending",
      createdAt: new Date(),
    };

    await ActionQueueRepository.create(action);
    return actionId;
  }
}
