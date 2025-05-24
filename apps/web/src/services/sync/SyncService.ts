import { UseBoundStore, StoreApi } from "zustand";
import { ErrorService } from "@/lib/errors";
import { router } from "@/lib/router";
import { Store } from "@/lib/store";
import {
  NetworkStatusService,
  ONLINE_EVENT,
  OFFLINE_EVENT,
} from "../NetworkStatusService";
import {
  CollectionSyncService,
  COLLECTION_SYNCING_EVENT,
  COLLECTION_SYNCED_EVENT,
} from "./CollectionSyncService";
import {
  NoteSyncService,
  NOTE_SYNCING_EVENT,
  NOTE_SYNCED_EVENT,
} from "./NoteSyncService";
import {
  QueueService,
  QUEUE_PROCESSING_STARTED_EVENT,
  QUEUE_PROCESSING_COMPLETED_EVENT,
} from "./QueueService";
import {
  RealtimeService,
  REALTIME_MESSAGE_EVENT,
  REALTIME_CONNECTED_EVENT,
  REALTIME_DISCONNECTED_EVENT,
} from "./RealtimeService";
import {
  SettingsSyncService,
  SETTING_SYNCING_EVENT,
  SETTING_SYNCED_EVENT,
} from "./SettingsSyncService";
import { Route } from "@/routes/(authenticated)/notes.$noteId";
import {
  ICollectionRepository,
  INoteRepository,
  INoteYDocStateRepository,
  IActionQueueRepository,
  ISettingRepository,
} from "@/types/Repositories";
import { SSEEvent } from "@/types/SSE";

export const SYNCING_EVENT = "syncing";
export const SYNCED_EVENT = "synced";

let instance: SyncService | null = null;

export class SyncService extends EventTarget {
  syncing = false;
  synced = false;

  // Focused services
  private realtimeService!: RealtimeService;
  private queueService!: QueueService;
  private noteSyncService!: NoteSyncService;
  private collectionSyncService!: CollectionSyncService;
  private settingsSyncService!: SettingsSyncService;

  unsubscribeQueue: (() => void) | null = null;

  constructor(
    private readonly store: UseBoundStore<StoreApi<Store>>,
    private readonly networkService: NetworkStatusService,
    private readonly repositories: {
      collection: ICollectionRepository;
      note: INoteRepository;
      noteYDocState: INoteYDocStateRepository;
      actionQueue: IActionQueueRepository;
      setting: ISettingRepository;
    }
  ) {
    super();

    if (instance) {
      return instance;
    }

    console.debug("SyncService: Constructor");
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    instance = this;

    this.initializeServices();
    this.setupEventHandlers();

    try {
      this.syncAll();
      this.watchOnlineStatus();
    } catch (error) {
      console.error("SyncService: Error during initialization sync:", error);
    }
  }

  private initializeServices(): void {
    console.debug("SyncService: Initializing services...");

    try {
      // Initialize domain sync services with store access
      this.noteSyncService = new NoteSyncService(
        this.repositories.note,
        this.repositories.actionQueue,
        this.repositories.noteYDocState,
        this.store
      );
      console.debug("SyncService: ✅ NoteSyncService initialized");
    } catch (error) {
      console.error(
        "SyncService: ❌ Failed to initialize NoteSyncService:",
        error
      );
      throw error;
    }

    try {
      this.collectionSyncService = new CollectionSyncService(
        this.repositories.collection,
        this.repositories.actionQueue,
        this.store
      );
      console.debug("SyncService: ✅ CollectionSyncService initialized");
    } catch (error) {
      console.error(
        "SyncService: ❌ Failed to initialize CollectionSyncService:",
        error
      );
      throw error;
    }

    try {
      this.settingsSyncService = new SettingsSyncService(
        this.repositories.setting,
        this.repositories.actionQueue,
        this.store
      );
      console.debug("SyncService: ✅ SettingsSyncService initialized");
    } catch (error) {
      console.error(
        "SyncService: ❌ Failed to initialize SettingsSyncService:",
        error
      );
      throw error;
    }

    try {
      // Initialize infrastructure services
      this.queueService = new QueueService(
        this.repositories.actionQueue,
        this.noteSyncService,
        this.collectionSyncService,
        this.settingsSyncService,
        this.store
      );
      console.debug("SyncService: ✅ QueueService initialized");
    } catch (error) {
      console.error(
        "SyncService: ❌ Failed to initialize QueueService:",
        error
      );
      throw error;
    }

    try {
      this.realtimeService = new RealtimeService(
        this.store.getState().clientId
      );
      console.debug("SyncService: ✅ RealtimeService initialized");
    } catch (error) {
      console.error(
        "SyncService: ❌ Failed to initialize RealtimeService:",
        error
      );
      throw error;
    }

    console.debug("SyncService: All services initialized successfully");
  }

  private setupEventHandlers(): void {
    // Handle realtime events
    this.realtimeService.addEventListener(REALTIME_MESSAGE_EVENT, (event) => {
      const sseEvent = (event as CustomEvent).detail as SSEEvent;
      this.handleSSEEvent(sseEvent);
    });

    this.realtimeService.addEventListener(REALTIME_CONNECTED_EVENT, () => {
      console.log("SyncService: Real-time connection established");
    });

    this.realtimeService.addEventListener(REALTIME_DISCONNECTED_EVENT, () => {
      console.log("SyncService: Real-time connection lost");
    });

    // Handle queue processing events
    this.queueService.addEventListener(QUEUE_PROCESSING_STARTED_EVENT, () => {
      this.syncing = true;
      this.dispatchEvent(new CustomEvent(SYNCING_EVENT));
    });

    this.queueService.addEventListener(QUEUE_PROCESSING_COMPLETED_EVENT, () => {
      this.syncing = false;
      this.dispatchEvent(new CustomEvent(SYNCED_EVENT));
    });

    // Handle individual sync events
    this.noteSyncService.addEventListener(NOTE_SYNCING_EVENT, () => {
      this.syncing = true;
      this.dispatchEvent(new CustomEvent(SYNCING_EVENT));
    });

    this.noteSyncService.addEventListener(NOTE_SYNCED_EVENT, () => {
      this.syncing = false;
      this.dispatchEvent(new CustomEvent(SYNCED_EVENT));
    });

    this.collectionSyncService.addEventListener(
      COLLECTION_SYNCING_EVENT,
      () => {
        this.syncing = true;
        this.dispatchEvent(new CustomEvent(SYNCING_EVENT));
      }
    );

    this.collectionSyncService.addEventListener(COLLECTION_SYNCED_EVENT, () => {
      this.syncing = false;
      this.dispatchEvent(new CustomEvent(SYNCED_EVENT));
    });

    this.settingsSyncService.addEventListener(SETTING_SYNCING_EVENT, () => {
      this.syncing = true;
      this.dispatchEvent(new CustomEvent(SYNCING_EVENT));
    });

    this.settingsSyncService.addEventListener(SETTING_SYNCED_EVENT, () => {
      this.syncing = false;
      this.dispatchEvent(new CustomEvent(SYNCED_EVENT));
    });
  }

  watchOnlineStatus() {
    this.networkService.addEventListener(ONLINE_EVENT, () => {
      this.syncAll();
      this.realtimeService.connect();
    });

    this.networkService.addEventListener(OFFLINE_EVENT, () => {
      this.realtimeService.disconnect();
    });
  }

  async syncAll() {
    if (this.syncing) {
      console.debug("SyncService: Already syncing");
      return;
    }

    this.syncing = true;
    this.dispatchEvent(new CustomEvent(SYNCING_EVENT));

    console.debug("SyncService: Syncing");

    try {
      // PRIORITY 1: Load settings immediately - nothing should block this
      await this.settingsSyncService.loadLocalSettingsToStore();
      console.debug("SyncService: ✅ Settings loaded (priority)");

      // PRIORITY 2: Start YDoc sync and load other local data in parallel
      const localDataPromises = [
        this.noteSyncService.loadLocalNotesToStore(),
        this.collectionSyncService.loadLocalCollectionsToStore(),
        this.queueService.loadLocalActionQueueToStore(),
      ];

      await Promise.all(localDataPromises);
      console.debug("SyncService: ✅ Local data loaded");

      // Process any pending queue items (offline changes)
      await this.queueService.processQueue();

      // Sync remote data to local in parallel
      await Promise.all([
        this.settingsSyncService.syncAllSettingsToLocal(),
        this.collectionSyncService.syncAllCollectionsToLocal(),
        this.noteSyncService.syncAllNotesToLocal(),
      ]);

      this.noteSyncService.syncNoteYDocStates(); // Non-blocking background sync

      console.debug("SyncService: Initial sync completed successfully");

      this.synced = true;
      this.dispatchEvent(new CustomEvent(SYNCED_EVENT));

      // Start listening to queue changes
      this.listenQueue();

      // Connect to real-time updates
      this.realtimeService.connect();
    } catch (error) {
      const appError = ErrorService.handle(error);
      console.error("SyncService: Error syncing", appError);

      this.syncing = false;
      this.dispatchEvent(new CustomEvent("sync-error", { detail: appError }));
    } finally {
      this.syncing = false;
    }
  }

  async listenQueue() {
    this.unsubscribeQueue = this.store.subscribe(async (state, prevState) => {
      const prevIds = prevState.actionQueue.items.map((item) => item.id);
      const currentIds = state.actionQueue.items.map((item) => item.id);

      // Check if any IDs are different between the two arrays
      const hasChanges =
        prevIds.some((id) => !currentIds.includes(id)) ||
        currentIds.some((id) => !prevIds.includes(id));

      if (hasChanges && !this.syncing) {
        // Use the new QueueService to process changes
        await this.queueService.processQueue();
      }
    });
  }

  private async handleSSEEvent(event: SSEEvent): Promise<void> {
    try {
      const store = this.store.getState();

      if (!store) return;

      console.debug("SyncService: Processing SSE event", event);

      // Redux-style: Dispatch to all domain services
      await Promise.all([
        this.noteSyncService.handleSSEEvent(event),
        this.collectionSyncService.handleSSEEvent(event),
        this.settingsSyncService.handleSSEEvent(event),
      ]);

      // Handle cross-cutting concerns in main service
      switch (event.type) {
        case "NOTE_DELETED": {
          const params = router.matchRoute(Route.fullPath) as
            | false
            | { noteId: string };
          const currentNoteId = params ? params.noteId : null;

          if (currentNoteId === event.noteId) {
            router.navigate({ to: "/notes" });
          }
          break;
        }
        // Other events are handled by domain services
      }
    } catch (error) {
      const appError = ErrorService.handle(error);
      console.error("SyncService: Error processing SSE event:", appError);
      throw appError;
    }
  }

  stopSync() {
    console.debug("SyncService: Stopping sync");

    // Stop real-time service
    this.realtimeService.disconnect();

    // Stop queue listener
    if (this.unsubscribeQueue) {
      this.unsubscribeQueue();
      this.unsubscribeQueue = null;
    }

    this.syncing = false;
    this.synced = false;
  }
}
