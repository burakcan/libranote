import { UseBoundStore, StoreApi } from "zustand";
import { ErrorService, SyncError } from "@/lib/errors";
import { Store } from "@/lib/store";
import { CollectionSyncService } from "./CollectionSyncService";
import { NoteSyncService } from "./NoteSyncService";
import { SettingsSyncService } from "./SettingsSyncService";
import { ActionQueueItem } from "@/types/ActionQueue";
import { IActionQueueRepository } from "@/types/Repositories";

export const QUEUE_PROCESSING_STARTED_EVENT = "queue:processing-started";
export const QUEUE_PROCESSING_COMPLETED_EVENT = "queue:processing-completed";
export const QUEUE_PROCESSING_ERROR_EVENT = "queue:processing-error";
export const QUEUE_ITEM_PROCESSED_EVENT = "queue:item-processed";

export class QueueService extends EventTarget {
  private isProcessing = false;

  constructor(
    private actionQueueRepository: IActionQueueRepository,
    private noteSyncService: NoteSyncService,
    private collectionSyncService: CollectionSyncService,
    private settingsSyncService: SettingsSyncService,
    private store: UseBoundStore<StoreApi<Store>>
  ) {
    super();
  }

  async loadLocalActionQueueToStore(): Promise<void> {
    const localQueueItems = await this.actionQueueRepository.getAll();
    await this.store
      .getState()
      .actionQueue.setActionQueueItems(localQueueItems);
    console.debug(
      "QueueService: Loaded local action queue to store",
      localQueueItems
    );
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log("QueueService: Already processing queue");
      return;
    }

    this.isProcessing = true;
    this.dispatchEvent(new CustomEvent(QUEUE_PROCESSING_STARTED_EVENT));

    try {
      const items = await this.actionQueueRepository.getAll();
      const pendingItems = items.filter((item) => item.status === "pending");
      const sortedItems = pendingItems.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      console.log(
        `QueueService: Processing ${sortedItems.length} pending items`
      );

      for (const item of sortedItems) {
        try {
          await this.processItem(item);
          this.dispatchEvent(
            new CustomEvent(QUEUE_ITEM_PROCESSED_EVENT, { detail: { item } })
          );
        } catch (error) {
          console.error(
            `QueueService: Failed to process item ${item.id}:`,
            error
          );
          await this.markItemAsError(item, error);
        }
      }

      this.dispatchEvent(new CustomEvent(QUEUE_PROCESSING_COMPLETED_EVENT));
    } catch (error) {
      const appError = ErrorService.handle(error);
      const queueError = new SyncError("Failed to process queue", appError);

      this.dispatchEvent(
        new CustomEvent(QUEUE_PROCESSING_ERROR_EVENT, { detail: queueError })
      );

      throw queueError;
    } finally {
      this.isProcessing = false;
    }
  }

  async addToQueue(
    item: Omit<ActionQueueItem, "id" | "createdAt" | "status">
  ): Promise<void> {
    const queueItem: ActionQueueItem = {
      id: crypto.randomUUID(),
      status: "pending",
      createdAt: new Date(),
      ...item,
    };

    await this.actionQueueRepository.put(queueItem);
  }

  async retryFailedItems(): Promise<void> {
    try {
      const items = await this.actionQueueRepository.getAll();
      const failedItems = items.filter((item) => item.status === "error");

      for (const item of failedItems) {
        await this.actionQueueRepository.update(item.id, {
          status: "pending",
          error: undefined,
        });
      }

      if (failedItems.length > 0) {
        await this.processQueue();
      }
    } catch (error) {
      const appError = ErrorService.handle(error);
      throw new SyncError("Failed to retry failed items", appError);
    }
  }

  async clearCompletedItems(): Promise<void> {
    try {
      const items = await this.actionQueueRepository.getAll();
      const completedItems = items.filter(
        (item) => item.status === "completed"
      );

      for (const item of completedItems) {
        await this.actionQueueRepository.delete(item.id);
      }
    } catch (error) {
      const appError = ErrorService.handle(error);
      throw new SyncError("Failed to clear completed items", appError);
    }
  }

  getProcessingStatus(): { isProcessing: boolean } {
    return { isProcessing: this.isProcessing };
  }

  private async processItem(item: ActionQueueItem): Promise<void> {
    // Mark item as processing in store
    await this.store
      .getState()
      .actionQueue.setActionQueueItemStatus(item.id, "processing");

    switch (item.type) {
      case "CREATE_NOTE":
      case "UPDATE_NOTE":
      case "DELETE_NOTE":
        await this.noteSyncService.processQueueItem(item);
        break;
      case "CREATE_COLLECTION":
      case "UPDATE_COLLECTION":
      case "DELETE_COLLECTION":
      case "LEAVE_COLLECTION":
        await this.collectionSyncService.processQueueItem(item);
        break;
      case "UPDATE_SETTING":
      case "SYNC_SETTINGS":
        await this.settingsSyncService.processQueueItem(item);
        break;
      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }

    await this.store.getState().actionQueue.removeActionFromQueue(item.id);
  }

  private async markItemAsError(
    item: ActionQueueItem,
    error: unknown
  ): Promise<void> {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await this.actionQueueRepository.update(item.id, {
      status: "error",
      error: errorMessage,
    });
  }
}
