import { produce } from "immer";
import { Draft } from "immer";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  LocalDataService,
  CollectionRepository,
  NoteRepository,
  ActionQueueRepository,
  TransactionService,
} from "@/lib/local-persistence/localDb";
import { Collection, Note } from "@/lib/prisma";

type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface StoreState {
  clientId: string;
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
  setClientId: (clientId: string) => void;
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

  // Sync actions that are triggered by SSE events
  remoteCreatedCollection: (collection: Collection) => Promise<void>;
  remoteDeletedCollection: (collectionId: Collection["id"]) => Promise<void>;
  remoteUpdatedCollection: (collection: Collection) => Promise<void>;

  setNotesData: (notes: Note[]) => void;
  setNotesSyncStatus: (syncStatus: SyncStatus) => void;
  createNote: (
    collectionId: string,
    title: string,
    content?: string
  ) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;

  // Sync actions that are triggered by SSE events
  remoteCreatedNote: (note: Note) => Promise<void>;
  remoteDeletedNote: (noteId: string) => Promise<void>;
  remoteUpdatedNote: (note: Note) => Promise<void>;

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
  return create<Store, [["zustand/devtools", never]]>(
    devtools((set, get) => ({
      ...initialData,
      clientId: "",
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
      setClientId: (clientId) => set({ clientId }),
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

        // Create collection object
        const collection: Collection = {
          id: collectionId,
          title,
          ownerId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Add to collections data immediately (optimistic update)
        P(set, (draft) => {
          draft.collections.data.push(collection);
        });

        try {
          // Create in local DB with action - single transaction
          const actionId = await LocalDataService.createCollection(
            collectionId,
            title,
            ownerId
          );

          // Add to action queue in the store state
          get().addActionToQueue({
            id: actionId,
            type: "CREATE_COLLECTION",
            status: "pending",
            createdAt: new Date(),
            relatedEntityId: collectionId,
          });
        } catch (error) {
          console.error("Failed to create collection locally", error);

          // Rollback optimistic update on error
          P(set, (draft) => {
            draft.collections.data = draft.collections.data.filter(
              (c) => c.id !== collectionId
            );
          });
        }
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

        // Find notes that belong to this collection (for optimistic UI update)
        const notesToDelete = state.notes.data.filter(
          (note) => note.collectionId === collectionId
        );

        // Remove from collections data (optimistic update)
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

        try {
          if (pendingCreateIndex !== -1) {
            // If collection was just created but not synced, remove the create action
            const actionId = state.actionQueue[pendingCreateIndex].id;

            // Remove from action queue in store state
            P(set, (draft) => {
              draft.actionQueue.splice(pendingCreateIndex, 1);
            });

            // Remove from local DB
            await ActionQueueRepository.delete(actionId);
            await CollectionRepository.delete(collectionId);
          } else {
            // Add delete action to queue and delete from local DB
            const actionId = crypto.randomUUID();
            await TransactionService.deleteEntityWithAction(
              "collection",
              collectionId,
              actionId
            );

            // Add to action queue in store state
            get().addActionToQueue({
              id: actionId,
              type: "DELETE_COLLECTION",
              status: "pending",
              createdAt: new Date(),
              relatedEntityId: collectionId,
            });
          }

          // If this was the active collection, clear the selection
          if (state.activeCollection === collectionId) {
            set({ activeCollection: null });
          }

          // Delete associated notes from local DB
          for (const note of notesToDelete) {
            await NoteRepository.delete(note.id);
          }
        } catch (error) {
          console.error("Failed to delete collection locally", error);

          // Rollback optimistic update on error
          const originalCollection =
            await CollectionRepository.getById(collectionId);
          if (originalCollection) {
            P(set, (draft) => {
              draft.collections.data.push(originalCollection);
              // Restore deleted notes
              draft.notes.data = [...draft.notes.data, ...notesToDelete];
            });
          }
        }
      },

      updateCollection: async (collection) => {
        // Get current state synchronously
        const state = get();
        const index = state.collections.data.findIndex(
          (c) => c.id === collection.id
        );

        // Update in state (optimistic)
        if (index !== -1) {
          P(set, (draft) => {
            draft.collections.data[index] = collection;
          });
        }

        try {
          // Update in local DB
          await CollectionRepository.update(collection);
        } catch (error) {
          console.error("Failed to update collection locally", error);

          // Rollback optimistic update on error
          const originalCollection = await CollectionRepository.getById(
            collection.id
          );
          if (originalCollection && index !== -1) {
            P(set, (draft) => {
              draft.collections.data[index] = originalCollection;
            });
          }
        }
      },

      swapCollection: async (localId, remoteCollection) => {
        // Get current state synchronously
        const state = get();

        // Find the index of the local collection
        const localIndex = state.collections.data.findIndex(
          (c) => c.id === localId
        );

        // Update in state (optimistic)
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

        try {
          // Update in local DB
          await CollectionRepository.swap(localId, remoteCollection);
        } catch (error) {
          console.error("Failed to swap collection locally", error);

          // Rollback is complex for this operation, might need manual recovery
          console.error(
            "Collection swap failed, manual recovery may be needed",
            {
              localId,
              remoteCollection,
            }
          );
        }
      },

      remoteCreatedCollection: async (collection) => {
        P(set, (draft) => {
          draft.collections.data.push(collection);
        });

        // Update uses "put" which will create if it doesn't exist, so we don't need to check if it exists first
        await CollectionRepository.update(collection);
      },

      remoteDeletedCollection: async (collectionId) => {
        P(set, (draft) => {
          draft.collections.data = draft.collections.data.filter(
            (c) => c.id !== collectionId
          );
        });

        await CollectionRepository.delete(collectionId);
      },

      remoteUpdatedCollection: async (collection) => {
        P(set, (draft) => {
          const index = draft.collections.data.findIndex(
            (c) => c.id === collection.id
          );
          if (index !== -1) {
            draft.collections.data[index] = collection;
          }
        });

        await CollectionRepository.update(collection);
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
        const ownerId = state.user.id;

        // Create note object
        const note: Note = {
          id: noteId,
          title,
          description: content,
          ownerId,
          collectionId,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Add to notes data immediately (optimistic update)
        P(set, (draft) => {
          draft.notes.data.push(note);
        });

        try {
          // Create in local DB with action - single transaction
          const actionId = await LocalDataService.createNote(
            noteId,
            title,
            content,
            ownerId,
            collectionId
          );

          // Add to action queue in the store state
          get().addActionToQueue({
            id: actionId,
            type: "CREATE_NOTE",
            status: "pending",
            createdAt: new Date(),
            relatedEntityId: noteId,
          });
        } catch (error) {
          console.error("Failed to create note locally", error);

          // Rollback optimistic update on error
          P(set, (draft) => {
            draft.notes.data = draft.notes.data.filter((n) => n.id !== noteId);
          });
        }
      },

      deleteNote: async (noteId) => {
        // Get current state synchronously
        const state = get();

        // Find the note to delete (for rollback if needed)
        const noteToDelete = state.notes.data.find(
          (note) => note.id === noteId
        );
        if (!noteToDelete) return;

        // Check for pending create action
        const pendingCreateIndex = state.actionQueue.findIndex(
          (action) =>
            action.type === "CREATE_NOTE" &&
            action.status === "pending" &&
            action.relatedEntityId === noteId
        );

        // Remove from notes data (optimistic update)
        P(set, (draft) => {
          draft.notes.data = draft.notes.data.filter(
            (note) => note.id !== noteId
          );
        });

        try {
          if (pendingCreateIndex !== -1) {
            // If note was just created but not synced, remove the create action
            const actionId = state.actionQueue[pendingCreateIndex].id;

            // Remove from action queue in store state
            P(set, (draft) => {
              draft.actionQueue.splice(pendingCreateIndex, 1);
            });

            // Remove from local DB
            await ActionQueueRepository.delete(actionId);
            await NoteRepository.delete(noteId);
          } else {
            // Add delete action to queue and delete from local DB
            const actionId = crypto.randomUUID();
            await TransactionService.deleteEntityWithAction(
              "note",
              noteId,
              actionId
            );

            // Add to action queue in store state
            get().addActionToQueue({
              id: actionId,
              type: "DELETE_NOTE",
              status: "pending",
              createdAt: new Date(),
              relatedEntityId: noteId,
            });
          }
        } catch (error) {
          console.error("Failed to delete note locally", error);

          // Rollback optimistic update on error
          if (noteToDelete) {
            P(set, (draft) => {
              draft.notes.data.push(noteToDelete);
            });
          }
        }
      },

      updateNote: async (note) => {
        // Get current state synchronously
        const state = get();
        const index = state.notes.data.findIndex((n) => n.id === note.id);

        // Store original note for potential rollback
        const originalNote = index !== -1 ? state.notes.data[index] : null;

        // Update in state (optimistic)
        if (index !== -1) {
          P(set, (draft) => {
            draft.notes.data[index] = note;
          });
        }

        try {
          // Update in local DB
          await NoteRepository.update(note);
        } catch (error) {
          console.error("Failed to update note locally", error);

          // Rollback optimistic update on error
          if (originalNote && index !== -1) {
            P(set, (draft) => {
              draft.notes.data[index] = originalNote;
            });
          }
        }
      },

      remoteCreatedNote: async (note) => {
        P(set, (draft) => {
          draft.notes.data.push(note);
        });

        // Update uses "put" which will create if it doesn't exist, so we don't need to check if it exists first
        await NoteRepository.update(note);
      },

      remoteDeletedNote: async (noteId) => {
        P(set, (draft) => {
          draft.notes.data = draft.notes.data.filter((n) => n.id !== noteId);
        });

        await NoteRepository.delete(noteId);
      },

      remoteUpdatedNote: async (note) => {
        P(set, (draft) => {
          const index = draft.notes.data.findIndex((n) => n.id === note.id);
          if (index !== -1) {
            draft.notes.data[index] = note;
          }
        });

        await NoteRepository.update(note);
      },

      removeActionFromQueue: async (actionId) => {
        P(set, (draft) => {
          draft.actionQueue = draft.actionQueue.filter(
            (action) => action.id !== actionId
          );
        });

        try {
          // Remove from local DB
          await ActionQueueRepository.delete(actionId);
        } catch (error) {
          console.error("Failed to remove action from queue in DB", error);
        }
      },
    }))
  );
};
