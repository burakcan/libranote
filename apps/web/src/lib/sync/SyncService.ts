import { getStoreInstance } from "@/components/providers/StoreProvider";
import { ApiService } from "@/lib/ApiService";
import { Collection, Note } from "@/lib/db/prisma";
import { ActionQueueRepository } from "@/lib/localDb/ActionQueueRepository";
import { CollectionRepository } from "@/lib/localDb/CollectionRepository";
import { NoteRepository } from "@/lib/localDb/NoteRepository";
import { TransactionService } from "@/lib/localDb/TransactionService";

export class SyncService {
  // Collection sync operations
  static async syncCreateCollection(
    collectionId: string
  ): Promise<Collection | undefined> {
    const localCollection = await CollectionRepository.getById(collectionId);
    if (!localCollection) {
      console.error(`SyncService: Collection ${collectionId} not found`);
      return;
    }

    const remoteCollection = await ApiService.createCollection(localCollection);
    const store = getStoreInstance()?.getState();

    if (!store) {
      return;
    }

    await store.swapCollection(localCollection.id, remoteCollection);
    return remoteCollection;
  }

  static async syncUpdateCollection(
    collectionId: string
  ): Promise<Collection | undefined> {
    const localCollection = await CollectionRepository.getById(collectionId);
    if (!localCollection) {
      console.error(`SyncService: Collection ${collectionId} not found`);
      return;
    }

    const remoteCollection = await ApiService.updateCollection(localCollection);
    const store = getStoreInstance()?.getState();
    if (!store) {
      return;
    }

    await store.swapCollection(localCollection.id, remoteCollection);
    return remoteCollection;
  }

  static async syncDeleteCollection(collectionId: string): Promise<void> {
    await ApiService.deleteCollection(collectionId);
  }

  // Note sync operations
  static async syncCreateNote(noteId: string): Promise<Note | undefined> {
    const localNote = await NoteRepository.getById(noteId);
    if (!localNote) {
      console.error(`SyncService: Note ${noteId} not found`);
      return;
    }

    // Verify the associated collection exists
    const collection = await CollectionRepository.getById(
      localNote.collectionId
    );
    if (!collection) {
      console.error(
        `SyncService: Collection ${localNote.collectionId} not found for note ${noteId}`
      );
      // Clean up orphaned note
      await NoteRepository.delete(noteId);
      const store = getStoreInstance()?.getState();
      if (store) {
        store.setNotesData(store.notes.data.filter((n) => n.id !== noteId));
      }
      return;
    }

    const remoteNote = await ApiService.createNote(localNote);
    const store = getStoreInstance()?.getState();
    if (store) {
      const noteIndex = store.notes.data.findIndex((n) => n.id === noteId);
      if (noteIndex !== -1) {
        const updatedNotes = [...store.notes.data];
        updatedNotes[noteIndex] = remoteNote;
        store.setNotesData(updatedNotes);
      }
    }
    await NoteRepository.swap(localNote.id, remoteNote);
    return remoteNote;
  }

  static async syncDeleteNote(noteId: string): Promise<void> {
    await ApiService.deleteNote(noteId);
  }

  // Sync remote data to local
  static async syncRemoteCollectionsToLocal(): Promise<Collection[]> {
    const remoteCollections = await ApiService.fetchAllCollections();

    getStoreInstance()?.getState().setCollectionsData(remoteCollections);
    await TransactionService.syncRemoteCollectionsToLocal(remoteCollections);

    return remoteCollections;
  }

  static async syncRemoteNotesToLocal(): Promise<Note[]> {
    const remoteNotes = await ApiService.fetchAllNotes();

    getStoreInstance()?.getState().setNotesData(remoteNotes);
    await TransactionService.syncRemoteNotesToLocal(remoteNotes);

    return remoteNotes;
  }

  // Process an action queue item
  static async processActionQueueItem(item: ActionQueue.Item): Promise<void> {
    try {
      switch (item.type) {
        case "CREATE_COLLECTION":
          await this.syncCreateCollection(item.relatedEntityId);
          break;
        case "UPDATE_COLLECTION":
          await this.syncUpdateCollection(item.relatedEntityId);
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
  static async getActionQueueItems(): Promise<ActionQueue.Item[]> {
    return ActionQueueRepository.getAll();
  }

  static async removeActionQueueItem(actionId: string): Promise<void> {
    return ActionQueueRepository.delete(actionId);
  }

  // Process Server-Sent Events (SSE)
  static async processSSEEvent(eventString: string): Promise<void> {
    try {
      const event = JSON.parse(eventString) as SSE.Event;
      const store = getStoreInstance()?.getState();

      if (!store) return;
      switch (event.type) {
        case "INIT":
          store.setClientId(event.clientId);
          break;
        case "COLLECTION_CREATED":
          await store.remoteCreatedCollection(event.collection);
          break;
        case "COLLECTION_UPDATED":
          await store.remoteUpdatedCollection(event.collection);
          break;
        case "COLLECTION_DELETED":
          await store.remoteDeletedCollection(event.collectionId);
          break;
        case "NOTE_CREATED":
          await store.remoteCreatedNote(event.note);
          break;
        case "NOTE_UPDATED":
          await store.remoteUpdatedNote(event.note);
          break;
        case "NOTE_DELETED":
          await store.remoteDeletedNote(event.noteId);
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
