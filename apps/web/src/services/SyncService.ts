import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "@hocuspocus/provider";
import { debounce } from "es-toolkit";
import * as Y from "yjs";
import { UseBoundStore, StoreApi } from "zustand";
import { ApiService, ApiServiceError } from "@/services/ApiService";
import { ActionQueueRepository } from "@/services/db/ActionQueueRepository";
import { CollectionRepository } from "@/services/db/CollectionRepository";
import { NoteRepository } from "@/services/db/NoteRepository";
import { NoteYDocStateRepository } from "@/services/db/NoteYDocStateRepository";
import { IndexeddbPersistence } from "@/services/db/yIndexedDb";
import { SearchService } from "@/services/SearchService";
import { queryClient } from "@/lib/queryClient";
import { router } from "@/lib/router";
import { Store } from "@/lib/store";
import {
  NetworkStatusService,
  ONLINE_EVENT,
  OFFLINE_EVENT,
} from "./NetworkStatusService";
import { Route } from "@/routes/(authenticated)/notes.$noteId";
import { ActionQueueItem } from "@/types/ActionQueue";
import {
  ServerCollection,
  ServerNote,
  ServerNoteYDocState,
} from "@/types/Entities";
import { SSEEvent } from "@/types/SSE";

const syncSocket = new HocuspocusProviderWebsocket({
  url: import.meta.env.VITE_HOCUSPOCUS_URL || "",
});

export const SYNCING_EVENT = "syncing";
export const SYNCED_EVENT = "synced";

let instance: SyncService | null = null;

export class SyncService extends EventTarget {
  syncing = false;
  synced = false;
  eventSource: EventSource | null = null;
  unsubscribeQueue: (() => void) | null = null;

  constructor(
    private readonly store: UseBoundStore<StoreApi<Store>>,
    private readonly networkService: NetworkStatusService,
    private readonly repositories: {
      collection: CollectionRepository;
      note: NoteRepository;
      noteYDocState: NoteYDocStateRepository;
      actionQueue: ActionQueueRepository;
    }
  ) {
    super();

    if (instance) {
      return instance;
    }

    console.debug("SyncService: Constructor");
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    instance = this;

    this.syncAll();
    this.listenSSE();

    setTimeout(() => {
      this.watchOnlineStatus();
    }, 0);
  }

  watchOnlineStatus() {
    this.networkService.addEventListener(ONLINE_EVENT, () => {
      this.syncAll();
      this.listenSSE();
    });

    this.networkService.addEventListener(OFFLINE_EVENT, () => {
      this.stopSync();
    });
  }

  getCurrentNoteId() {
    const params = router.matchRoute(Route.fullPath) as
      | false
      | {
          noteId: string;
        };

    if (!params) {
      return null;
    }

    return params.noteId;
  }

  async syncAll() {
    if (this.syncing) {
      console.debug("SyncService: Already syncing");
      return;
    }

    this.syncing = true;

    this.dispatchEvent(new CustomEvent(SYNCING_EVENT));

    console.debug("SyncService: Syncing");

    this.syncNoteYDocStates();

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
        this.syncing = true;
        this.dispatchEvent(new CustomEvent(SYNCING_EVENT));

        await this.processActionQueue();

        this.syncing = false;
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
      const callback = async () => {
        this.syncing = true;
        this.dispatchEvent(new CustomEvent(SYNCING_EVENT));

        await this.processSSEEvent(event.data);

        this.syncing = false;
        this.dispatchEvent(new CustomEvent(SYNCED_EVENT));
      };

      if (this.syncing) {
        this.addEventListener(
          SYNCED_EVENT,
          () => {
            callback();
          },
          { once: true }
        );

        return;
      }

      callback();
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
          this.syncNoteYDocStates(event.note.noteYDocState);
          await store.notes.remoteCreatedNote(event.note);
          break;
        case "NOTE_UPDATED":
          await store.notes.remoteUpdatedNote(event.note);
          break;
        case "NOTE_DELETED": {
          if (this.getCurrentNoteId() === event.noteId) {
            router.navigate({ to: "/notes" });
          }

          await store.notes.remoteDeletedNote(event.noteId);
          break;
        }
        case "NOTE_YDOC_STATE_UPDATED": {
          const note = await store.notes.data.find(
            (note) => note.id === event.ydocState.noteId
          );

          if (!note) {
            console.error(
              "SyncService: Note not found",
              event.ydocState.noteId
            );
            return;
          }

          await store.notes.remoteUpdatedNote({
            ...note,
            serverCreatedAt: note.serverCreatedAt || new Date(),
            serverUpdatedAt: note.serverUpdatedAt || new Date(),
            noteYDocState: event.ydocState,
          });

          await this.syncNoteYDocStates(event.ydocState);
          break;
        }
        case "COLLECTION_MEMBER_JOINED": {
          const remoteCollection = await ApiService.fetchCollection(
            event.collection.id
          );

          await store.collections.remoteJoinedCollection(
            event.userId,
            remoteCollection
          );
          break;
        }
        case "COLLECTION_MEMBER_LEFT": {
          queryClient.invalidateQueries({
            queryKey: ["collection-members", event.collection.id],
          });

          await store.collections.remoteLeftCollection(
            event.userId,
            event.collection
          );
          break;
        }
        case "COLLECTION_MEMBER_ROLE_UPDATED":
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

  async syncNoteYDocStates(remoteYDocState?: ServerNoteYDocState) {
    const remoteYDocStates = remoteYDocState
      ? [remoteYDocState]
      : await ApiService.fetchAllYDocStates();

    console.debug("SyncService: Syncing YDoc states", remoteYDocStates);

    for (const remoteYDocState of remoteYDocStates) {
      await this.syncNoteYDocState(remoteYDocState);
    }
  }

  async syncNoteYDocState(remoteYDocState: ServerNoteYDocState) {
    const localYDocState = await NoteYDocStateRepository.getById(
      remoteYDocState.id
    );

    if (!localYDocState) {
      console.log(
        "SyncService: YDoc state not found, creating",
        remoteYDocState.id
      );
      await NoteYDocStateRepository.put(remoteYDocState);
    }

    if (localYDocState?.updatedAt === remoteYDocState.updatedAt) {
      return;
    }

    if (remoteYDocState.noteId === this.getCurrentNoteId()) {
      NoteYDocStateRepository.update(remoteYDocState.id, remoteYDocState);
      return;
    }

    console.debug("SyncService: Syncing YDoc", remoteYDocState.id);

    const doc = new Y.Doc();
    const persistence = new IndexeddbPersistence(remoteYDocState.id, doc);

    return new Promise((resolve) => {
      persistence.whenSynced.then(() => {
        const provider = new HocuspocusProvider({
          websocketProvider: syncSocket,
          document: doc,
          name: remoteYDocState.id,
          token: "123",
        });

        provider.on("synced", () => {
          console.debug("SyncService: YDoc synced", remoteYDocState.id);

          NoteYDocStateRepository.update(remoteYDocState.id, remoteYDocState);

          provider.destroy();
          persistence.destroy();
          doc.destroy();

          SearchService.updateNoteFromYDoc(remoteYDocState.noteId);

          resolve(doc);
        });
      });
    });
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
        case "LEAVE_COLLECTION":
          await ApiService.removeCollectionMember(
            item.relatedEntityId,
            this.store.getState().userId
          );
          break;
        case "CREATE_NOTE":
          await this.syncCreateNote(item.relatedEntityId);
          break;
        case "DELETE_NOTE":
          await ApiService.deleteNote(item.relatedEntityId);
          break;
        case "UPDATE_NOTE":
          await this.syncUpdateNoteDebounced(item.relatedEntityId);
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
      .collections.remoteUpdatedCollection(remoteCollection);

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

    return remoteNote;
  }

  syncUpdateNoteDebounced = debounce(this.syncUpdateNote.bind(this), 1000);

  async syncUpdateNote(noteId: string): Promise<ServerNote | undefined> {
    const localNote = await NoteRepository.getById(noteId);

    if (!localNote) {
      console.error(`SyncService: Note ${noteId} not found`);
      return;
    }

    const remoteNote = await ApiService.updateNote(localNote);

    await this.store.getState().notes.swapNote(localNote.id, remoteNote);

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
