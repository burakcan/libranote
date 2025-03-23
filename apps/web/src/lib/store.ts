import { produce } from "immer";
import { Draft } from "immer";
import { create } from "zustand";
import {
  LocalDataService,
  CollectionRepository,
  NoteRepository,
  ActionQueueRepository,
} from "@/lib/local-persistence/localDb";
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
  createCollection: (title: string) => Promise<void>;
  deleteCollection: (collectionId: Collection["id"]) => Promise<void>;
  updateCollection: (collection: Collection) => Promise<void>;
  swapCollection: (
    localId: Collection["id"],
    remoteCollection: Collection
  ) => Promise<void>;

  setNotesData: (notes: Note[]) => void;
  setNotesSyncStatus: (syncStatus: SyncStatus) => void;
  createNote: (
    collectionId: string,
    title: string,
    content?: string
  ) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;

  removeActionFromQueue: (actionId: string) => Promise<void>;
  addActionToQueue: (action: ActionQueue.Item) => void;
}

export type Store = StoreState & StoreActions;

// Type-safe produce utility
const P = <T extends object>(
  set: (fn: (state: T) => T | Partial<T>) => void,
  fn: (draft: Draft<T>) => void
) => set(produce<T>(fn));

export const createStore = (initialData: { user: StoreState["user"] }) => {
  return create<Store, []>((set, get) => ({
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

    // Add action to queue (helper method)
    addActionToQueue: (action) =>
      P(set, (draft) => {
        draft.actionQueue.push(action);
      }),

    createCollection: async (title) => {
      // Get current state synchronously
      const state = get();
      const ownerId = state.user.id;
      const collectionId = crypto.randomUUID();

      // Add to collections data immediately
      P(set, (draft) => {
        draft.collections.data.push({
          id: collectionId,
          title,
          ownerId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // Create in local DB and get action ID (don't use draft in async operations)
      await LocalDataService.createCollection(collectionId, title, ownerId)
        .then((actionId) => {
          // Use the helper method to add to queue
          get().addActionToQueue({
            id: actionId,
            type: "CREATE_COLLECTION",
            status: "pending",
            createdAt: new Date(),
            relatedEntityId: collectionId,
          });
        })
        .catch((error) => {
          console.error("Failed to create collection locally", error);
        });
    },

    deleteCollection: async (collectionId) => {
      // Get current state synchronously
      const state = get();

      // Check for pending create action
      const pendingCreateIndex = state.actionQueue.findIndex(
        (action) =>
          action.type === "CREATE_COLLECTION" &&
          action.status === "pending" &&
          action.relatedEntityId === collectionId
      );

      if (pendingCreateIndex !== -1) {
        // If collection was just created but not synced, remove the create action
        const actionId = state.actionQueue[pendingCreateIndex].id;

        P(set, (draft) => {
          draft.actionQueue.splice(pendingCreateIndex, 1);
        });

        await ActionQueueRepository.remove(actionId);
      } else {
        // Add delete action to queue
        await LocalDataService.addActionToQueue(
          "DELETE_COLLECTION",
          collectionId
        ).then((actionId) => {
          get().addActionToQueue({
            id: actionId,
            type: "DELETE_COLLECTION",
            status: "pending",
            createdAt: new Date(),
            relatedEntityId: collectionId,
          });
        });
      }

      // If this was the active collection, clear the selection
      if (state.activeCollection === collectionId) {
        set({ activeCollection: null });
      }

      // Find notes that belong to this collection
      const notesToDelete = state.notes.data.filter(
        (note) => note.collectionId === collectionId
      );

      // Remove from collections data
      P(set, (draft) => {
        // Remove the collection
        draft.collections.data = draft.collections.data.filter(
          (collection) => collection.id !== collectionId
        );

        // Also remove all notes that belonged to this collection
        draft.notes.data = draft.notes.data.filter(
          (note) => note.collectionId !== collectionId
        );
      });

      // Remove from local DB
      await CollectionRepository.delete(collectionId);

      // Delete all associated notes from local DB
      notesToDelete.forEach(async (note) => {
        await NoteRepository.delete(note.id);
      });
    },

    updateCollection: async (collection) => {
      // Get current state synchronously
      const state = get();

      const index = state.collections.data.findIndex(
        (c) => c.id === collection.id
      );

      if (index !== -1) {
        P(set, (draft) => {
          draft.collections.data[index] = collection;
        });
      }

      // Update in local DB
      await CollectionRepository.update(collection);
    },

    swapCollection: async (localId, remoteCollection) => {
      // Get current state synchronously
      const state = get();

      // Find the index of the local collection
      const localIndex = state.collections.data.findIndex(
        (c) => c.id === localId
      );

      if (localIndex !== -1) {
        P(set, (draft) => {
          draft.collections.data[localIndex] = remoteCollection;

          // Update the notes that belong to this collection
          draft.notes.data = draft.notes.data.map((note) => {
            if (note.collectionId === localId) {
              return { ...note, collectionId: remoteCollection.id };
            }
            return note;
          });
        });
      }

      // Update in local DB
      await CollectionRepository.swap(localId, remoteCollection);
    },

    // Note actions
    setNotesData: (notes) =>
      P(set, (draft) => {
        draft.notes.data = notes;
      }),

    setNotesSyncStatus: (syncStatus) =>
      P(set, (draft) => {
        draft.notes.syncStatus = syncStatus;
      }),

    createNote: async (collectionId, title, content = "") => {
      // Get current state synchronously
      const state = get();
      const noteId = crypto.randomUUID();

      // Add to notes data immediately
      P(set, (draft) => {
        draft.notes.data.push({
          id: noteId,
          title,
          description: content,
          ownerId: state.user.id,
          collectionId,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // Create in local DB and get action ID
      await LocalDataService.createNote(
        noteId,
        title,
        content,
        state.user.id,
        collectionId
      ).then((actionId) => {
        get().addActionToQueue({
          id: actionId,
          type: "CREATE_NOTE",
          status: "pending",
          createdAt: new Date(),
          relatedEntityId: noteId,
        });
      });
    },

    deleteNote: async (noteId) => {
      // Get current state synchronously
      const state = get();

      // Check for pending create action
      const pendingCreateIndex = state.actionQueue.findIndex(
        (action) =>
          action.type === "CREATE_NOTE" &&
          action.status === "pending" &&
          action.relatedEntityId === noteId
      );

      if (pendingCreateIndex !== -1) {
        // If note was just created but not synced, remove the create action
        const actionId = state.actionQueue[pendingCreateIndex].id;

        P(set, (draft) => {
          draft.actionQueue.splice(pendingCreateIndex, 1);
        });

        await ActionQueueRepository.remove(actionId);
      } else {
        // Add delete action to queue
        await LocalDataService.addActionToQueue("DELETE_NOTE", noteId).then(
          (actionId) => {
            get().addActionToQueue({
              id: actionId,
              type: "DELETE_NOTE",
              status: "pending",
              createdAt: new Date(),
              relatedEntityId: noteId,
            });
          }
        );
      }

      // Remove from notes data
      P(set, (draft) => {
        draft.notes.data = draft.notes.data.filter(
          (note) => note.id !== noteId
        );
      });

      // Remove from local DB
      await NoteRepository.delete(noteId);
    },

    updateNote: async (note) => {
      // Get current state synchronously
      const state = get();

      const index = state.notes.data.findIndex((n) => n.id === note.id);
      if (index !== -1) {
        P(set, (draft) => {
          draft.notes.data[index] = note;
        });
      }

      // Update in local DB
      await NoteRepository.update(note);
    },

    removeActionFromQueue: async (actionId) => {
      P(set, (draft) => {
        draft.actionQueue = draft.actionQueue.filter(
          (action) => action.id !== actionId
        );
      });

      // Remove from local DB
      await ActionQueueRepository.remove(actionId);
    },
  }));
};
