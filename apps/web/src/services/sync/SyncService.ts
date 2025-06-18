import { UseBoundStore, StoreApi } from "zustand";
import { invalidateSessionQuery } from "@/hooks/useSessionQuery";
import { ErrorService } from "@/lib/errors";
import { queryClient } from "@/lib/queryClient";
import { router } from "@/lib/router";
import { Store } from "@/lib/store";
import {
  NetworkStatusService,
  ONLINE_EVENT,
  OFFLINE_EVENT,
} from "../NetworkStatusService";
import { CollectionSyncService } from "./CollectionSyncService";
import { NoteSyncService } from "./NoteSyncService";
import { QueueService } from "./QueueService";
import {
  RealtimeService,
  REALTIME_MESSAGE_EVENT,
  REALTIME_CONNECTED_EVENT,
  REALTIME_DISCONNECTED_EVENT,
} from "./RealtimeService";
import { SettingsSyncService } from "./SettingsSyncService";
import { SyncStatusManager, SyncStatus } from "./SyncStatusManager";
import { Route } from "@/routes/(authenticated)/notes/$noteId";
import {
  ICollectionRepository,
  INoteRepository,
  INoteYDocStateRepository,
  IActionQueueRepository,
  ISettingRepository,
} from "@/types/Repositories";
import { SSEEvent } from "@/types/SSE";

let instance: SyncService | null = null;

export class SyncService extends EventTarget {
  private statusManager = new SyncStatusManager();

  // Focused services
  private realtimeService!: RealtimeService;
  private queueService!: QueueService;
  private noteSyncService!: NoteSyncService;
  private collectionSyncService!: CollectionSyncService;
  private settingsSyncService!: SettingsSyncService;

  unsubscribeQueue: (() => void) | null = null;
  private statusSubscription: (() => void) | null = null;

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

  /**
   * Get the current sync status
   */
  getStatus(): SyncStatus {
    return this.statusManager.getStatus();
  }

  /**
   * Subscribe to sync status changes
   */
  subscribeToStatus(listener: (status: SyncStatus) => void): () => void {
    return this.statusManager.subscribe(listener);
  }

  /**
   * Get the status manager for advanced usage
   */
  getStatusManager(): SyncStatusManager {
    return this.statusManager;
  }

  private initializeServices(): void {
    console.debug("SyncService: Initializing services...");

    try {
      // Initialize domain sync services with store access
      this.noteSyncService = new NoteSyncService(
        this.repositories.note,
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
  }

  watchOnlineStatus() {
    this.networkService.addEventListener(ONLINE_EVENT, async () => {
      // Process any pending queue items (offline changes)
      await this.executeWithStatusTracking(
        () => this.queueService.processQueue(),
        "queue-processing",
        "Processing queue"
      );

      this.syncAll();
      this.realtimeService.connect();
    });

    this.networkService.addEventListener(OFFLINE_EVENT, () => {
      this.realtimeService.disconnect();
    });
  }

  async syncAll() {
    const operationId = this.statusManager.startOperation(
      "initial-sync",
      "Full sync"
    );

    console.debug("SyncService: Starting full sync");

    try {
      // PRIORITY 1: Load settings immediately - nothing should block this
      const settingsOpId = this.statusManager.startOperation(
        "settings-sync",
        "Loading settings"
      );
      try {
        await this.settingsSyncService.loadLocalSettingsToStore();
        console.debug("SyncService: ✅ Settings loaded (priority)");
        this.statusManager.completeOperation(settingsOpId);
      } catch (error) {
        this.statusManager.failOperation(settingsOpId, error as Error);
        throw error;
      }

      // PRIORITY 2: Start YDoc sync and load other local data in parallel
      const localDataPromises = [
        this.executeWithStatusTracking(
          () => this.noteSyncService.loadLocalNotesToStore(),
          "note-sync",
          "Loading local notes"
        ),
        this.executeWithStatusTracking(
          () => this.collectionSyncService.loadLocalCollectionsToStore(),
          "collection-sync",
          "Loading local collections"
        ),
        this.executeWithStatusTracking(
          () => this.queueService.loadLocalActionQueueToStore(),
          "queue-processing",
          "Loading action queue"
        ),
      ];

      await Promise.all(localDataPromises);
      console.debug("SyncService: ✅ Local data loaded");

      // Process any pending queue items (offline changes)
      await this.executeWithStatusTracking(
        () => this.queueService.processQueue(),
        "queue-processing",
        "Processing queue"
      );

      // Sync remote data to local in parallel
      await Promise.all([
        this.executeWithStatusTracking(
          () => this.settingsSyncService.syncAllSettingsToLocal(),
          "settings-sync",
          "Syncing settings"
        ),
        this.executeWithStatusTracking(
          () => this.collectionSyncService.syncAllCollectionsToLocal(),
          "collection-sync",
          "Syncing collections"
        ),
        this.executeWithStatusTracking(
          () => this.noteSyncService.syncAllNotesToLocal(),
          "note-sync",
          "Syncing notes"
        ),
      ]);

      // Non-blocking background sync
      this.noteSyncService.syncAllNoteYDocStates();

      console.debug("SyncService: Initial sync completed successfully");

      // Start listening to queue changes
      this.listenQueue();

      // Connect to real-time updates
      this.realtimeService.connect();

      this.statusManager.completeOperation(operationId);
      this.statusManager.setIsSynced();
    } catch (error) {
      const appError = ErrorService.handle(error);
      console.error("SyncService: Error syncing", appError);

      this.statusManager.failOperation(operationId, appError);
      this.dispatchEvent(new CustomEvent("sync-error", { detail: appError }));
      throw appError;
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

      if (
        hasChanges &&
        !this.statusManager.isOperationTypeRunning("queue-processing")
      ) {
        await this.executeWithStatusTracking(
          () => this.queueService.processQueue(),
          "queue-processing",
          "Processing queue changes"
        );
      }
    });
  }

  private async handleSSEEvent(event: SSEEvent): Promise<void> {
    const operationId = this.statusManager.startOperation(
      "realtime-event",
      `Processing ${event.type} event`
    );

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
        case "SESSION_REFRESH": {
          invalidateSessionQuery(queryClient);
          break;
        }
        // Other events are handled by domain services
      }

      this.statusManager.completeOperation(operationId);
    } catch (error) {
      const appError = ErrorService.handle(error);
      console.error("SyncService: Error processing SSE event:", appError);
      this.statusManager.failOperation(operationId, appError);
      throw appError;
    }
  }

  /**
   * Execute an async operation with status tracking
   */
  private async executeWithStatusTracking<T>(
    operation: () => Promise<T>,
    type: Parameters<SyncStatusManager["startOperation"]>[0],
    description?: string
  ): Promise<T> {
    const operationId = this.statusManager.startOperation(type, description);

    try {
      const result = await operation();
      this.statusManager.completeOperation(operationId);
      return result;
    } catch (error) {
      this.statusManager.failOperation(operationId, error as Error);
      throw error;
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

    // Stop status subscription
    if (this.statusSubscription) {
      this.statusSubscription();
      this.statusSubscription = null;
    }

    // Clean up status manager
    this.statusManager.destroy();
  }
}
