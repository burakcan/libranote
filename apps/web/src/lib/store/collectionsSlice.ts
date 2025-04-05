import type { StateCreator } from "zustand";
import { CollectionRepository } from "@/lib/db/CollectionRepository";
import { TransactionService } from "@/lib/db/TransactionService";
import type { Store, InitialStoreState } from "./types";
import { P } from "./utils";
import { ClientCollection } from "@/types/Entities";

const initialCollectionsState: InitialStoreState["collections"] = {
  activeCollectionId: null,
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
      P(set, (draft) => {
        for (const remoteCollection of remoteCollections) {
          const existingCollectionIndex = draft.collections.data.findIndex(
            (collection) => collection.id === remoteCollection.id
          );

          if (existingCollectionIndex !== -1) {
            // If the collection already exists, update it
            draft.collections.data[existingCollectionIndex] = remoteCollection;
          } else {
            // If the collection does not exist, add it
            draft.collections.data.push(remoteCollection);
          }
        }

        // Delete collections that are no longer in the remote data
        draft.collections.data = draft.collections.data.filter((collection) =>
          remoteCollections.some(
            (remoteCollection) => remoteCollection.id === collection.id
          )
        );
      });

      await TransactionService.syncRemoteCollectionsToLocal(remoteCollections);
    },

    createCollection: async (title, ownerId) => {
      const collectionId = crypto.randomUUID();
      const collection: ClientCollection = {
        id: collectionId,
        title,
        ownerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      P(set, (draft) => {
        draft.collections.data.push(collection);
        draft.collections.activeCollectionId = collectionId;
        draft.collections.renamingCollectionId = collectionId;
      });

      await CollectionRepository.put(collection);

      await get().actionQueue.addActionToQueue({
        id: crypto.randomUUID(),
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
          draft.collections.activeCollectionId = null;
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
          id: crypto.randomUUID(),
          type: "DELETE_COLLECTION",
          status: "pending",
          createdAt: new Date(),
          relatedEntityId: collectionId,
        });
      }
    },

    updateCollection: async (collection) => {
      const state = get();

      const pendingRelatedActionIndex = state.actionQueue.items.findIndex(
        (action) =>
          (action.type === "CREATE_COLLECTION" ||
            action.type === "UPDATE_COLLECTION") &&
          action.status === "pending" &&
          action.relatedEntityId === collection.id
      );

      const index = state.collections.data.findIndex(
        (c) => c.id === collection.id
      );

      const updatedCollection = {
        ...collection,
        updatedAt: new Date(),
      };

      if (index !== -1) {
        P(set, (draft) => {
          draft.collections.data[index] = updatedCollection;
        });
      }

      await CollectionRepository.update(collection.id, updatedCollection);

      console.log("pendingRelatedActionIndex", pendingRelatedActionIndex);

      // If there is a pending create or update action, we don't need to add an update action to the queue
      // we can just update the collection in the local DB and the updated collection will be synced to the remote DB
      if (pendingRelatedActionIndex === -1) {
        console.log("adding update action to queue");
        await state.actionQueue.addActionToQueue({
          id: crypto.randomUUID(),
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
          draft.collections.activeCollectionId = null;
        }
      });

      await CollectionRepository.delete(collectionId);

      for (const note of notesToDelete) {
        await state.notes.deleteNote(note.id);
      }
    },

    remoteUpdatedCollection: async (collection) => {
      console.log("remoteUpdatedCollection", collection);
      P(set, (draft) => {
        const index = draft.collections.data.findIndex(
          (c) => c.id === collection.id
        );
        if (index !== -1) {
          draft.collections.data[index] = collection;
        } else {
          // If collection not found, add it (could happen due to sync race conditions)
          draft.collections.data.push(collection);
        }
      });

      await CollectionRepository.put(collection);
    },
  },
});
