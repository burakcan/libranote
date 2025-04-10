import { UseBoundStore, StoreApi } from "zustand";
import { ApiService, ApiServiceError } from "@/lib/ApiService";
import { ActionQueueRepository } from "@/lib/db/ActionQueueRepository";
import { CollectionRepository } from "@/lib/db/CollectionRepository";
import { NoteRepository } from "@/lib/db/NoteRepository";
import { router } from "@/lib/router";
import { Store } from "@/lib/store";
import { Route } from "@/routes/(authenticated)/notes.$noteId";
import { ActionQueueItem } from "@/types/ActionQueue";
import { ServerCollection, ServerNote } from "@/types/Entities";
import { SSEEvent } from "@/types/SSE";

export const SYNCING_EVENT = "syncing";
export const SYNCED_EVENT = "synced";

let instance: SyncService | null = null;

export class SyncService extends EventTarget {
  syncing = false;
  synced = false;
  eventSource: EventSource | null = null;
  unsubscribeQueue: (() => void) | null = null;

  constructor(private readonly store: UseBoundStore<StoreApi<Store>>) {
    super();

    if (instance) {
      return instance;
    }

    console.debug("SyncService: Constructor");
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    instance = this;

    this.sync();

    setTimeout(() => {
      this.watchOnlineStatus();
    }, 0);
  }

  watchOnlineStatus() {
    window.addEventListener("online", () => {
      this.sync();
    });

    window.addEventListener("offline", () => {
      this.stopSync();
    });
  }

  async sync() {
    if (this.syncing) {
      console.debug("SyncService: Already syncing");
      return;
    }

    this.syncing = true;

    this.dispatchEvent(new CustomEvent(SYNCING_EVENT));

    console.debug("SyncService: Syncing");

    await this.loadLocalDataToStore();
    await this.processActionQueue();

    try {
      await Promise.all([
        this.syncRemoteCollectionsToLocal(),
        this.syncRemoteNotesToLocal(),
      ]);
    } catch (error) {
      console.error("SyncService: Error syncing", error);
    }

    console.debug("SyncService: Initial sync completed successfully");

    this.syncing = false;
    this.synced = true;

    this.dispatchEvent(new CustomEvent(SYNCED_EVENT));

    this.listenQueue();
    this.listenSSE();
  }

  async listenQueue() {
    this.unsubscribeQueue = this.store.subscribe(async (state, prevState) => {
      const prevIds = prevState.actionQueue.items.map((item) => item.id);
      const currentIds = state.actionQueue.items.map((item) => item.id);

      // Check if any IDs are different between the two arrays
      const hasChanges =
        prevIds.some((id) => !currentIds.includes(id)) ||
        currentIds.some((id) => !prevIds.includes(id));

      if (hasChanges) {
        this.dispatchEvent(new CustomEvent(SYNCING_EVENT));

        await this.processActionQueue();

        this.dispatchEvent(new CustomEvent(SYNCED_EVENT));
      }
    });
  }

  async listenSSE() {
    const clientId = this.store.getState().clientId;

    this.eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/sse?clientId=${clientId}`,
      { withCredentials: true }
    );

    this.eventSource.onmessage = async (event) => {
      this.dispatchEvent(new CustomEvent(SYNCING_EVENT));

      await this.processSSEEvent(event.data);

      this.dispatchEvent(new CustomEvent(SYNCED_EVENT));
    };
  }

  async processSSEEvent(eventString: string): Promise<void> {
    try {
      const event = JSON.parse(eventString) as SSEEvent;
      const store = this.store.getState();

      if (!store) return;

      console.debug("SyncService: Processing SSE event", event);

      switch (event.type) {
        case "INIT":
          break;
        case "COLLECTION_CREATED":
          await store.collections.remoteCreatedCollection(event.collection);
          break;
        case "COLLECTION_UPDATED":
          await store.collections.remoteUpdatedCollection(event.collection);
          break;
        case "COLLECTION_DELETED":
          await store.collections.remoteDeletedCollection(event.collectionId);
          break;
        case "NOTE_CREATED":
          await store.notes.remoteCreatedNote(event.note);
          break;
        case "NOTE_UPDATED":
          await store.notes.remoteUpdatedNote(event.note);
          break;
        case "NOTE_DELETED":
          await store.notes.remoteDeletedNote(event.noteId);
          break;
        default:
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          (function (_: never) {})(event);
          break;
      }
    } catch (error) {
      console.error("SyncService: Error processing SSE event:", error);
      throw error;
    }
  }

  async loadLocalDataToStore() {
    const [localCollections, localNotes, localQueueItems] = await Promise.all([
      CollectionRepository.getAll(),
      NoteRepository.getAllByCollectionId(),
      ActionQueueRepository.getAll(),
    ]);

    const { collections, notes, actionQueue } = this.store.getState();

    collections.setCollectionsData(localCollections);
    notes.setNotesData(localNotes);
    actionQueue.setActionQueueItems(localQueueItems);

    console.debug(
      "SyncService: Loaded local data to store",
      localCollections,
      localNotes,
      localQueueItems
    );
  }

  async processActionQueue() {
    const { actionQueue } = this.store.getState();

    console.debug("SyncService: Processing action queue", actionQueue.items);

    // sort items so that the oldest items are processed first
    const sortedItems = [...actionQueue.items].sort((a, b) => {
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    for (const item of sortedItems) {
      if (item.status === "pending") {
        try {
          await this.processActionQueueItem(item);
        } catch (error) {
          console.error(
            `SyncService: Error processing action queue item ${item.id}:`,
            error
          );
        }
      }
    }

    console.debug("SyncService: Processed action queue");
  }

  async processActionQueueItem(item: ActionQueueItem): Promise<void> {
    try {
      this.store
        .getState()
        .actionQueue.setActionQueueItemStatus(item.id, "processing");

      switch (item.type) {
        case "CREATE_COLLECTION":
          await this.syncCreateCollection(item.relatedEntityId);
          break;
        case "UPDATE_COLLECTION":
          await this.syncUpdateCollection(item.relatedEntityId);
          break;
        case "DELETE_COLLECTION":
          await ApiService.deleteCollection(item.relatedEntityId);
          break;
        case "CREATE_NOTE":
          await this.syncCreateNote(item.relatedEntityId);
          break;
        case "DELETE_NOTE":
          await ApiService.deleteNote(item.relatedEntityId);
          break;
        default:
          console.error(`SyncService: Unknown queue item type: ${item.type}`);
      }

      await this.store.getState().actionQueue.removeActionFromQueue(item.id);
    } catch (error) {
      if ((error as ApiServiceError).status === 404) {
        await this.store.getState().actionQueue.removeActionFromQueue(item.id);
        return;
      }

      this.store
        .getState()
        .actionQueue.setActionQueueItemStatus(item.id, "pending");

      console.error(
        `SyncService: Error processing queue item ${item.id}:`,
        error
      );
      throw error;
    }
  }

  async syncCreateCollection(
    collectionId: string
  ): Promise<ServerCollection | undefined> {
    const localCollection = await CollectionRepository.getById(collectionId);

    if (!localCollection) {
      console.error(`SyncService: Collection ${collectionId} not found`);
      return;
    }

    const remoteCollection = await ApiService.createCollection(localCollection);

    await this.store
      .getState()
      .collections.swapCollection(localCollection.id, remoteCollection);

    return remoteCollection;
  }

  async syncUpdateCollection(
    collectionId: string
  ): Promise<ServerCollection | undefined> {
    const localCollection = await CollectionRepository.getById(collectionId);

    if (!localCollection) {
      console.error(`SyncService: Collection ${collectionId} not found`);
      return;
    }

    const remoteCollection = await ApiService.updateCollection(localCollection);

    await this.store
      .getState()
      .collections.swapCollection(localCollection.id, remoteCollection);

    return remoteCollection;
  }

  async syncCreateNote(noteId: string): Promise<ServerNote | undefined> {
    const localNote = await NoteRepository.getById(noteId);

    if (!localNote) {
      console.error(`SyncService: Note ${noteId} not found`);
      return;
    }

    const remoteNote = await ApiService.createNote(localNote);

    await this.store.getState().notes.swapNote(localNote.id, remoteNote);

    const params = router.matchRoute(Route.fullPath) as
      | false
      | {
          noteId: string;
        };

    if (params && params.noteId === noteId) {
      router.navigate({
        to: "/notes/$noteId",
        params: { noteId: remoteNote.id },
      });
    }

    return remoteNote;
  }

  // Sync remote data to local
  async syncRemoteCollectionsToLocal(): Promise<ServerCollection[]> {
    const remoteCollections = await ApiService.fetchAllCollections();

    await this.store
      .getState()
      .collections.syncRemoteCollectionsToLocal(remoteCollections);

    console.debug(
      "SyncService: Synced remote collections to local",
      remoteCollections
    );

    return remoteCollections;
  }

  async syncRemoteNotesToLocal(): Promise<ServerNote[]> {
    const remoteNotes = await ApiService.fetchAllNotes();

    await this.store.getState().notes.syncRemoteNotesToLocal(remoteNotes);

    console.debug("SyncService: Synced remote notes to local", remoteNotes);

    return remoteNotes;
  }

  stopSync() {
    if (this.unsubscribeQueue) {
      this.unsubscribeQueue();
    }

    if (this.eventSource) {
      this.eventSource.close();
    }

    this.unsubscribeQueue = null;
    this.eventSource = null;
  }
}
