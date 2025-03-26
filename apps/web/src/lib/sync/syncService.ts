import {
  CollectionRepository,
  NoteRepository,
  ActionQueueRepository,
} from "@/lib/local-persistence/localDb";
import { Collection, Note } from "@/lib/prisma";
import { Store } from "@/lib/store";
import { getStoreInstance, StoreInstance } from "@/features/core/StoreProvider";

// API Layer: Handles communication with server API
export class ApiService {
  static async createCollection(collection: Collection): Promise<Collection> {
    const clientId = getStoreInstance()?.getState()?.clientId;

    if (!clientId) {
      throw new Error("Client ID not found");
    }

    const response = await fetch("/api/collections", {
      method: "POST",
      body: JSON.stringify({ collection, clientId }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create collection on server: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  static async deleteCollection(collectionId: string): Promise<void> {
    const clientId = getStoreInstance()?.getState()?.clientId;

    if (!clientId) {
      throw new Error("Client ID not found");
    }

    const response = await fetch(`/api/collections/${collectionId}`, {
      method: "DELETE",
      body: JSON.stringify({ clientId }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to delete collection on server: ${response.status} ${response.statusText}`
      );
    }
  }

  static async createNote(note: Note): Promise<Note> {
    const response = await fetch("/api/notes", {
      method: "POST",
      body: JSON.stringify(note),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create note on server: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  static async deleteNote(noteId: string): Promise<void> {
    const response = await fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to delete note on server: ${response.status} ${response.statusText}`
      );
    }
  }

  static async fetchAllCollections(): Promise<Collection[]> {
    const response = await fetch("/api/collections");

    if (!response.ok) {
      throw new Error(
        `Failed to fetch collections from server: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  static async fetchAllNotes(): Promise<Note[]> {
    const response = await fetch("/api/notes");

    if (!response.ok) {
      throw new Error(
        `Failed to fetch notes from server: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }
}

// Sync Service: Coordinates between API, local DB, and store
export class SyncService {
  private storeInstance: StoreInstance | null = null;

  constructor(storeInstance: StoreInstance | null = null) {
    this.storeInstance = storeInstance;
  }

  setStoreInstance(storeInstance: StoreInstance) {
    this.storeInstance = storeInstance;
  }

  // Helper to safely get the store state
  private getStore(): Store | null {
    // First try the injected store instance
    if (this.storeInstance) {
      try {
        return this.storeInstance.getState();
      } catch (error) {
        console.warn("Error accessing injected store instance:", error);
      }
    }

    // Fall back to global store as backup
    const globalStore = getStoreInstance();
    if (globalStore) {
      try {
        return globalStore.getState();
      } catch (error) {
        console.warn("Error accessing global store instance:", error);
      }
    }

    return null;
  }

  // Collection sync operations
  async syncCreateCollection(
    collectionId: string
  ): Promise<Collection | undefined> {
    try {
      // 1. Get the local collection from DB
      const localCollection = await CollectionRepository.getById(collectionId);
      if (!localCollection) {
        console.error(`SyncService: Collection ${collectionId} not found`);
        return;
      }

      // 2. Send to server via API
      const remoteCollection =
        await ApiService.createCollection(localCollection);

      // 3. Update store if needed
      const store = this.getStore();
      if (store) {
        const activeCollection = store.activeCollection;

        // If this was the active collection, update reference
        if (activeCollection === localCollection.id) {
          store.setActiveCollection(remoteCollection.id);
        }

        // Swap the collection in the store (updates both store and local DB)
        await store.swapCollection(localCollection.id, remoteCollection);
      } else {
        // If no store instance, just update local DB directly
        await CollectionRepository.swap(localCollection.id, remoteCollection);
      }

      return remoteCollection;
    } catch (error) {
      console.error(
        `SyncService: Error syncing collection ${collectionId}:`,
        error
      );
      throw error;
    }
  }

  async syncDeleteCollection(collectionId: string): Promise<void> {
    try {
      await ApiService.deleteCollection(collectionId);
    } catch (error) {
      console.error(
        `SyncService: Error deleting collection ${collectionId}:`,
        error
      );
      throw error;
    }
  }

  // Note sync operations
  async syncCreateNote(noteId: string): Promise<Note | undefined> {
    try {
      // 1. Get the note from local DB
      const localNote = await NoteRepository.getById(noteId);
      if (!localNote) {
        console.error(`SyncService: Note ${noteId} not found`);
        return;
      }

      // 2. Verify collection exists
      const collection = await CollectionRepository.getById(
        localNote.collectionId
      );
      if (!collection) {
        console.error(
          `SyncService: Collection ${localNote.collectionId} not found for note ${noteId}`
        );

        // Clean up orphaned note
        await NoteRepository.delete(noteId);

        // Update store if available
        const store = this.getStore();
        if (store) {
          const notesInStore = store.notes.data;
          const noteIndex = notesInStore.findIndex((n) => n.id === noteId);

          if (noteIndex !== -1) {
            const updatedNotes = [...notesInStore];
            updatedNotes.splice(noteIndex, 1);
            store.setNotesData(updatedNotes);
          }
        }

        return;
      }

      // 3. Send to server via API
      const remoteNote = await ApiService.createNote(localNote);

      // 4. Update local DB and store if needed
      const store = this.getStore();
      if (store) {
        // Find the note in the store
        const notesInStore = store.notes.data;
        const noteIndex = notesInStore.findIndex((n) => n.id === noteId);

        if (noteIndex !== -1) {
          // Update the note in the store
          const updatedNotes = [...notesInStore];
          updatedNotes[noteIndex] = remoteNote;
          store.setNotesData(updatedNotes);
        }
      }

      // 5. Update local DB
      await NoteRepository.swap(localNote.id, remoteNote);

      return remoteNote;
    } catch (error) {
      console.error(`SyncService: Error syncing note ${noteId}:`, error);
      throw error;
    }
  }

  async syncDeleteNote(noteId: string): Promise<void> {
    try {
      await ApiService.deleteNote(noteId);
    } catch (error) {
      console.error(`SyncService: Error deleting note ${noteId}:`, error);
      throw error;
    }
  }

  // Sync from remote to local
  async syncRemoteCollectionsToLocal(): Promise<Collection[]> {
    try {
      // 1. Fetch remote collections via API
      const remoteCollections = await ApiService.fetchAllCollections();

      // 2. Update local DB
      await Promise.all(
        remoteCollections.map((collection) =>
          CollectionRepository.update(collection)
        )
      );

      // 3. Update store if available
      const store = this.getStore();
      if (store) {
        store.setCollectionsData(remoteCollections);
      }

      return remoteCollections;
    } catch (error) {
      console.error(
        "SyncService: Error syncing remote collections to local:",
        error
      );
      throw error;
    }
  }

  async syncRemoteNotesToLocal(): Promise<Note[]> {
    try {
      // 1. Fetch remote notes via API
      const remoteNotes = await ApiService.fetchAllNotes();

      // 2. Update local DB
      await Promise.all(remoteNotes.map((note) => NoteRepository.update(note)));

      // 3. Update store if available
      const store = this.getStore();
      if (store) {
        store.setNotesData(remoteNotes);
      }

      return remoteNotes;
    } catch (error) {
      console.error("SyncService: Error syncing remote notes to local:", error);
      throw error;
    }
  }

  // Process action queue items
  async processActionQueueItem(item: ActionQueue.Item): Promise<void> {
    try {
      switch (item.type) {
        case "CREATE_COLLECTION":
          await this.syncCreateCollection(item.relatedEntityId);
          break;
        case "DELETE_COLLECTION":
          await this.syncDeleteCollection(item.relatedEntityId);
          break;
        case "CREATE_NOTE":
          await this.syncCreateNote(item.relatedEntityId);
          break;
        case "DELETE_NOTE":
          await this.syncDeleteNote(item.relatedEntityId);
          break;
        default:
          console.error(`SyncService: Unknown queue item type: ${item.type}`);
      }
    } catch (error) {
      console.error(
        `SyncService: Error processing queue item ${item.id}:`,
        error
      );
      throw error;
    }
  }

  // Action queue operations
  async getActionQueueItems(): Promise<ActionQueue.Item[]> {
    return ActionQueueRepository.getAll();
  }

  async removeActionQueueItem(actionId: string): Promise<void> {
    return ActionQueueRepository.delete(actionId);
  }

  // Process SSE events
  async processSSEEvent(eventString: string): Promise<void> {
    try {
      const event = JSON.parse(eventString) as SSE.Event;
      const storeState = this.storeInstance?.getState();

      switch (event.type) {
        case "INIT":
          storeState?.setClientId(event.clientId);
          break;
        case "COLLECTION_CREATED":
          await storeState?.remoteCreatedCollection(event.collection);
          break;
        case "COLLECTION_UPDATED":
          await storeState?.remoteUpdatedCollection(event.collection);
          break;
        case "COLLECTION_DELETED":
          await storeState?.remoteDeletedCollection(event.collectionId);
          break;
        case "NOTE_CREATED":
          await storeState?.remoteCreatedNote(event.note);
          break;
        case "NOTE_UPDATED":
          await storeState?.remoteUpdatedNote(event.note);
          break;
        case "NOTE_DELETED":
          await storeState?.remoteDeletedNote(event.noteId);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("SyncService: Error processing SSE event:", error);
      throw error;
    }
  }
}

// Create a singleton instance
export const syncService = new SyncService();
