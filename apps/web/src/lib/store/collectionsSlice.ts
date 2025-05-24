import { nanoid } from "nanoid";
import type { StateCreator } from "zustand";
import { CollectionRepository } from "@/services/db/CollectionRepository";
import { TransactionService } from "@/services/db/TransactionService";
import type { Store, InitialStoreState } from "./types";
import { ALL_NOTES_COLLECTION_ID } from "./useCollectionNotes";
import { P } from "./utils";
import { ClientCollection } from "@/types/Entities";

const initialCollectionsState: InitialStoreState["collections"] = {
  activeCollectionId: ALL_NOTES_COLLECTION_ID,
  renamingCollectionId: null,
  data: [],
};

export const createCollectionsSlice: StateCreator<
  Store,
  [],
  [],
  Pick<Store, "collections">
> = (set, get) => ({
  collections: {
    ...initialCollectionsState,

    setActiveCollectionId: (collectionId) =>
      P(set, (draft) => {
        draft.collections.activeCollectionId = collectionId;
      }),

    setRenamingCollectionId: (collectionId) =>
      P(set, (draft) => {
        draft.collections.renamingCollectionId = collectionId;
      }),

    setCollectionsData: (collections) =>
      P(set, (draft) => {
        draft.collections.data = collections;
      }),

    syncRemoteCollectionsToLocal: async (remoteCollections) => {
      for (const remoteCollection of remoteCollections) {
        const existingCollectionIndex = get().collections.data.findIndex(
          (collection) => collection.id === remoteCollection.id
        );

        if (existingCollectionIndex !== -1) {
          // If the collection already exists, update it
          P(set, (draft) => {
            draft.collections.data[existingCollectionIndex] = remoteCollection;
          });
        } else {
          // If the collection does not exist, add it
          P(set, (draft) => {
            draft.collections.data.push(remoteCollection);
          });
        }

        // Defer so the ui can update and not block the main thread
        await Promise.resolve();
      }

      // Delete collections that are no longer in the remote data
      P(set, (draft) => {
        draft.collections.data = draft.collections.data.filter((collection) =>
          remoteCollections.some(
            (remoteCollection) => remoteCollection.id === collection.id
          )
        );
      });

      await TransactionService.syncRemoteCollectionsToLocal(remoteCollections);
    },

    createCollection: async (title, createdById) => {
      const collectionId = nanoid(10);
      const collection: ClientCollection = {
        id: collectionId,
        title,
        createdById,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [
          {
            id: nanoid(10),
            userId: createdById,
            role: "OWNER",
            color: null,
            createdAt: new Date(),
            collectionId,
          },
        ],
      };

      P(set, (draft) => {
        draft.collections.data.push(collection);
        draft.collections.activeCollectionId = collectionId;
        draft.collections.renamingCollectionId = collectionId;
      });

      await CollectionRepository.put(collection);

      await get().actionQueue.addActionToQueue({
        id: nanoid(3),
        type: "CREATE_COLLECTION",
        status: "pending",
        createdAt: new Date(),
        relatedEntityId: collectionId,
      });

      return collection;
    },

    deleteCollection: async (collectionId) => {
      const state = get();

      const collectionToDelete = state.collections.data.find(
        (collection) => collection.id === collectionId
      );

      if (!collectionToDelete) {
        console.error(`Collection ${collectionId} not found`);
        return;
      }

      const actionsToDelete = state.actionQueue.items.filter(
        (action) =>
          action.status === "pending" && action.relatedEntityId === collectionId
      );

      const notesToDelete = state.notes.data.filter(
        (note) => note.collectionId === collectionId
      );

      // Delete collection from local state
      P(set, (draft) => {
        draft.collections.data = draft.collections.data.filter(
          (collection) => collection.id !== collectionId
        );

        if (state.collections.activeCollectionId === collectionId) {
          draft.collections.activeCollectionId = ALL_NOTES_COLLECTION_ID;
        }
      });

      // Delete collection from local DB
      await CollectionRepository.delete(collectionId);

      // Delete notes
      for (const note of notesToDelete) {
        await state.notes.deleteNote(note.id, true);
      }

      // Delete actions
      for (const action of actionsToDelete) {
        await state.actionQueue.removeActionFromQueue(action.id);
      }

      // If the collection was created remotely, we need to add a delete action to the queue
      if (collectionToDelete.serverCreatedAt) {
        await state.actionQueue.addActionToQueue({
          id: nanoid(3),
          type: "DELETE_COLLECTION",
          status: "pending",
          createdAt: new Date(),
          relatedEntityId: collectionId,
        });
      }
    },

    updateCollection: async (update) => {
      const state = get();
      const index = state.collections.data.findIndex((c) => c.id === update.id);
      const collection = state.collections.data[index];

      if (index === -1) {
        console.error(`Collection ${update.id} not found`);
        return;
      }

      const pendingRelatedActionIndex = state.actionQueue.items.findIndex(
        (action) =>
          (action.type === "CREATE_COLLECTION" ||
            action.type === "UPDATE_COLLECTION") &&
          action.status === "pending" &&
          action.relatedEntityId === collection.id
      );

      const updatedCollection = {
        ...collection,
        ...update,
        updatedAt: new Date(),
      };

      if (index !== -1) {
        P(set, (draft) => {
          draft.collections.data[index] = updatedCollection;
        });
      }

      await CollectionRepository.update(update.id, update);

      // If there is a pending create or update action, we don't need to add an update action to the queue
      // we can just update the collection in the local DB and the updated collection will be synced to the remote DB
      if (pendingRelatedActionIndex === -1) {
        await state.actionQueue.addActionToQueue({
          id: nanoid(3),
          type: "UPDATE_COLLECTION",
          status: "pending",
          createdAt: new Date(),
          relatedEntityId: collection.id,
        });
      }
    },

    swapCollection: async (localId, remoteCollection) => {
      const state = get();
      const localIndex = state.collections.data.findIndex(
        (c) => c.id === localId
      );

      if (localIndex !== -1) {
        P(set, (draft) => {
          draft.collections.data[localIndex] = remoteCollection;
          if (state.collections.renamingCollectionId === localId) {
            draft.collections.renamingCollectionId = remoteCollection.id;
          }
          if (state.collections.activeCollectionId === localId) {
            draft.collections.activeCollectionId = remoteCollection.id;
          }
          // Update collectionId for notes in the notes slice
          draft.notes.data = draft.notes.data.map((note) => {
            if (note.collectionId === localId) {
              return { ...note, collectionId: remoteCollection.id };
            }
            return note;
          });
        });
      }

      await TransactionService.swapCollectionWithRemote(
        localId,
        remoteCollection
      );
    },

    leaveCollection: async (collectionId) => {
      const state = get();

      const collectionToLeave = state.collections.data.find(
        (collection) => collection.id === collectionId
      );

      if (!collectionToLeave) {
        console.error(`Collection ${collectionId} not found`);
        return;
      }

      const actionsToDelete = state.actionQueue.items.filter(
        (action) =>
          action.status === "pending" && action.relatedEntityId === collectionId
      );

      const notesToDelete = state.notes.data.filter(
        (note) => note.collectionId === collectionId
      );

      // Delete collection from local state
      P(set, (draft) => {
        draft.collections.data = draft.collections.data.filter(
          (collection) => collection.id !== collectionId
        );

        if (state.collections.activeCollectionId === collectionId) {
          draft.collections.activeCollectionId = ALL_NOTES_COLLECTION_ID;
        }
      });

      // Delete collection from local DB
      await CollectionRepository.delete(collectionId);

      // Delete notes
      for (const note of notesToDelete) {
        await state.notes.deleteNote(note.id, true);
      }

      // Delete actions
      for (const action of actionsToDelete) {
        await state.actionQueue.removeActionFromQueue(action.id);
      }

      await state.actionQueue.addActionToQueue({
        id: nanoid(3),
        type: "LEAVE_COLLECTION",
        status: "pending",
        createdAt: new Date(),
        relatedEntityId: collectionId,
      });
    },

    remoteCreatedCollection: async (collection) => {
      P(set, (draft) => {
        if (!draft.collections.data.some((c) => c.id === collection.id)) {
          draft.collections.data.push(collection);
        }
      });

      await CollectionRepository.put(collection);
    },

    remoteDeletedCollection: async (collectionId) => {
      const state = get();

      const notesToDelete = state.notes.data.filter(
        (note) => note.collectionId === collectionId
      );

      P(set, (draft) => {
        draft.collections.data = draft.collections.data.filter(
          (c) => c.id !== collectionId
        );

        if (get().collections.activeCollectionId === collectionId) {
          draft.collections.activeCollectionId = ALL_NOTES_COLLECTION_ID;
        }
      });

      await CollectionRepository.delete(collectionId);

      for (const note of notesToDelete) {
        await state.notes.deleteNote(note.id, true);
      }
    },

    remoteUpdatedCollection: async (update) => {
      const state = get();
      const index = state.collections.data.findIndex((c) => c.id === update.id);
      const collection = state.collections.data[index];

      if (index === -1) {
        console.error(`Collection ${update.id} not found`);
        return;
      }

      P(set, (draft) => {
        draft.collections.data[index] = {
          ...collection,
          ...update,
        };
      });

      await CollectionRepository.update(update.id, update);
    },

    remoteJoinedCollection: async (userId, collection) => {
      const state = get();

      if (state.userId !== userId) {
        return;
      }

      await state.collections.remoteCreatedCollection(collection);
    },

    remoteLeftCollection: async (userId, collection) => {
      const state = get();

      if (state.userId !== userId) {
        return;
      }

      await state.collections.remoteDeletedCollection(collection.id);
    },
  },
});
