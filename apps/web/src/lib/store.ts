import { produce } from "immer";
import { Draft } from "immer";
import { create } from "zustand";
import * as localDb from "@/lib/local-persistence/localDb";
import { Collection, Note } from "@/lib/prisma";

type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface StoreState {
  activeCollection: Collection["id"] | null;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null | undefined;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  collections: {
    data: Collection[];
    syncStatus: SyncStatus;
  };
  notes: {
    data: Note[];
    syncStatus: SyncStatus;
  };
  actionQueue: ActionQueue.Item[];
}

interface StoreActions {
  setActiveCollection: (collectionId: Collection["id"]) => void;
  setCollectionsData: (collections: Collection[]) => void;
  setCollectionsSyncStatus: (syncStatus: SyncStatus) => void;
  createCollection: (title: string) => void;
  deleteCollection: (collectionId: Collection["id"]) => void;
  updateCollection: (collection: Collection) => void;

  setNotesData: (notes: Note[]) => void;
  setNotesSyncStatus: (syncStatus: SyncStatus) => void;
  createNote: (collectionId: string, title: string, content?: string) => void;
  deleteNote: (noteId: string, collectionId: string) => void;
  updateNote: (note: Note) => void;

  removeActionFromQueue: (actionId: string) => void;
}

export type Store = StoreState & StoreActions;

// Queue utilities
const queueCreate = (
  queue: Draft<ActionQueue.Item[]>,
  type: "CREATE_COLLECTION" | "CREATE_NOTE",
  relatedEntityId: string
) => {
  const actionId = crypto.randomUUID();

  queue.push({
    type,
    id: actionId,
    status: "pending",
    createdAt: new Date(),
    relatedEntityId,
  });

  return actionId;
};

const queueDelete = (
  queue: Draft<ActionQueue.Item[]>,
  type: "DELETE_COLLECTION" | "DELETE_NOTE",
  relatedEntityId: string
): boolean => {
  // Check for pending create
  const pendingCreateType =
    type === "DELETE_COLLECTION" ? "CREATE_COLLECTION" : "CREATE_NOTE";
  const pendingCreateIndex = queue.findIndex(
    (action) =>
      action.type === pendingCreateType &&
      action.status === "pending" &&
      action.relatedEntityId === relatedEntityId
  );

  if (pendingCreateIndex !== -1) {
    // If item was just created but not synced, remove the create action
    queue.splice(pendingCreateIndex, 1);
    return true;
  }

  // Add delete action to queue
  queue.push({
    type,
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date(),
    relatedEntityId,
  });
  return false;
};

// Type-safe produce utility
const P = <T extends object>(
  set: (fn: (state: T) => T | Partial<T>) => void,
  fn: (draft: Draft<T>) => void
) => set(produce<T>(fn));

export const createStore = (initialData: { user: StoreState["user"] }) => {
  return create<Store, []>((set) => ({
    ...initialData,
    // State
    activeCollection: null,
    collections: {
      data: [],
      syncStatus: "idle" as SyncStatus,
    },
    notes: {
      data: [],
      syncStatus: "idle" as SyncStatus,
    },
    actionQueue: [],

    // Actions
    setActiveCollection: (collectionId) =>
      set({ activeCollection: collectionId }),

    setCollectionsData: (collections) =>
      P(set, (draft) => {
        draft.collections.data = collections;
      }),

    setCollectionsSyncStatus: (syncStatus) =>
      P(set, (draft) => {
        draft.collections.syncStatus = syncStatus;
      }),

    createCollection: (title) =>
      P(set, (draft) => {
        const ownerId = draft.user.id;
        const collectionId = crypto.randomUUID();

        draft.collections.data.push({
          id: collectionId,
          title,
          ownerId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const queueItemId = queueCreate(
          draft.actionQueue,
          "CREATE_COLLECTION",
          collectionId
        );

        localDb.createCollection(collectionId, title, ownerId, queueItemId);
      }),

    deleteCollection: (collectionId) =>
      P(set, (draft) => {
        queueDelete(draft.actionQueue, "DELETE_COLLECTION", collectionId);

        // Remove from collections data
        draft.collections.data = draft.collections.data.filter(
          (collection) => collection.id !== collectionId
        );
      }),

    updateCollection: (collection) =>
      P(set, (draft) => {
        const index = draft.collections.data.findIndex(
          (c) => c.id === collection.id
        );
        if (index !== -1) {
          draft.collections.data[index] = collection;
        }
      }),

    // Note actions
    setNotesData: (notes) =>
      P(set, (draft) => {
        draft.notes.data = notes;
      }),

    setNotesSyncStatus: (syncStatus) =>
      P(set, (draft) => {
        draft.notes.syncStatus = syncStatus;
      }),

    createNote: (collectionId, title, content = "") =>
      P(set, (draft) => {
        const noteId = crypto.randomUUID();
        draft.notes.data.push({
          id: noteId,
          title,
          description: content,
          ownerId: draft.user.id,
          collectionId,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        queueCreate(draft.actionQueue, "CREATE_NOTE", noteId);
      }),

    deleteNote: (noteId) =>
      P(set, (draft) => {
        queueDelete(draft.actionQueue, "DELETE_NOTE", noteId);

        // Remove from notes data
        draft.notes.data = draft.notes.data.filter(
          (note) => note.id !== noteId
        );
      }),

    updateNote: (note) =>
      P(set, (draft) => {
        const index = draft.notes.data.findIndex((n) => n.id === note.id);
        if (index !== -1) {
          draft.notes.data[index] = {
            ...note,
            updatedAt: new Date(),
          };
        }
      }),

    removeActionFromQueue: (actionId) =>
      P(set, (draft) => {
        draft.actionQueue = draft.actionQueue.filter(
          (action) => action.id !== actionId
        );

        localDb.removeActionFromQueue(actionId);
      }),
  }));
};
