import { produce } from "immer";
import { Draft } from "immer";
import { create } from "zustand";
import { LocalDataService } from "@/lib/local-persistence/localDataService";
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
  deleteNote: (noteId: string) => void;
  updateNote: (note: Note) => void;

  removeActionFromQueue: (actionId: string) => void;
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

    createCollection: (title) => {
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
      LocalDataService.createCollection(collectionId, title, ownerId)
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

    deleteCollection: (collectionId) => {
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

        LocalDataService.removeActionFromQueue(actionId);
      } else {
        // Add delete action to queue
        LocalDataService.addActionToQueue(
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

      // Remove from collections data
      P(set, (draft) => {
        draft.collections.data = draft.collections.data.filter(
          (collection) => collection.id !== collectionId
        );
      });

      // Remove from local DB
      LocalDataService.deleteCollection(collectionId);
    },

    updateCollection: (collection) =>
      P(set, (draft) => {
        const index = draft.collections.data.findIndex(
          (c) => c.id === collection.id
        );
        if (index !== -1) {
          draft.collections.data[index] = collection;

          // Update in local DB
          LocalDataService.updateCollection(collection);
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

    createNote: (collectionId, title, content = "") => {
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
      LocalDataService.createNote(
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

    deleteNote: (noteId) => {
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

        LocalDataService.removeActionFromQueue(actionId);
      } else {
        // Add delete action to queue
        LocalDataService.addActionToQueue("DELETE_NOTE", noteId).then(
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
      LocalDataService.deleteNote(noteId);
    },

    updateNote: (note) =>
      P(set, (draft) => {
        const index = draft.notes.data.findIndex((n) => n.id === note.id);
        if (index !== -1) {
          const updatedNote = {
            ...note,
            updatedAt: new Date(),
          };
          draft.notes.data[index] = updatedNote;

          // Update in local DB
          LocalDataService.updateNote(updatedNote);
        }
      }),

    removeActionFromQueue: (actionId) =>
      P(set, (draft) => {
        draft.actionQueue = draft.actionQueue.filter(
          (action) => action.id !== actionId
        );

        LocalDataService.removeActionFromQueue(actionId);
      }),
  }));
};
