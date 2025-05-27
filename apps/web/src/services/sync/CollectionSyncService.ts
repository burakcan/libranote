import { UseBoundStore, StoreApi } from "zustand";
import { ApiService } from "@/services/ApiService";
import { ErrorService, SyncError } from "@/lib/errors";
import { queryClient } from "@/lib/queryClient";
import { Store } from "@/lib/store";
import { ActionQueueItem } from "@/types/ActionQueue";
import { ServerCollection } from "@/types/Entities";
import { ICollectionRepository } from "@/types/Repositories";
import { SSEEvent } from "@/types/SSE";

export class CollectionSyncService extends EventTarget {
  constructor(
    private collectionRepository: ICollectionRepository,
    private store: UseBoundStore<StoreApi<Store>>
  ) {
    super();
  }

  async loadLocalCollectionsToStore(): Promise<void> {
    const localCollections = await this.collectionRepository.getAll();
    await this.store
      .getState()
      .collections.setCollectionsData(localCollections);
    console.debug(
      "CollectionSyncService: Loaded local collections to store",
      localCollections
    );
  }

  async syncAllCollectionsToLocal(): Promise<ServerCollection[]> {
    try {
      const remoteCollections = await ApiService.fetchAllCollections();

      // Sync remote collections to local DB and store
      await this.store
        .getState()
        .collections.syncRemoteCollectionsToLocal(remoteCollections);

      return remoteCollections;
    } catch (error) {
      const appError = ErrorService.handle(error);
      throw new SyncError("Failed to sync all collections to local", appError);
    }
  }

  async processQueueItem(item: ActionQueueItem): Promise<void> {
    // Set status to processing
    this.store
      .getState()
      .actionQueue.setActionQueueItemStatus(item.id, "processing");

    switch (item.type) {
      case "CREATE_COLLECTION":
        await this.processCreateCollection(item.relatedEntityId);
        break;
      case "UPDATE_COLLECTION":
        await this.processUpdateCollection(item.relatedEntityId);
        break;
      case "DELETE_COLLECTION":
        await this.processDeleteCollection(item.relatedEntityId);
        break;
      case "LEAVE_COLLECTION":
        await this.processLeaveCollection(item.relatedEntityId);
        break;
    }

    // Remove from queue
    await this.store.getState().actionQueue.removeActionFromQueue(item.id);
  }

  private async processCreateCollection(
    collectionId: string
  ): Promise<ServerCollection | undefined> {
    const localCollection =
      await this.collectionRepository.getById(collectionId);

    if (!localCollection) {
      console.error(
        `CollectionSyncService: Collection ${collectionId} not found`
      );
      return;
    }

    const remoteCollection = await ApiService.createCollection(localCollection);

    // Use store to swap local collection with remote collection (handles ID swapping, etc.)
    await this.store
      .getState()
      .collections.swapCollection(localCollection.id, remoteCollection);

    return remoteCollection;
  }

  private async processUpdateCollection(
    collectionId: string
  ): Promise<ServerCollection | undefined> {
    const localCollection =
      await this.collectionRepository.getById(collectionId);

    if (!localCollection) {
      console.error(
        `CollectionSyncService: Collection ${collectionId} not found`
      );
      return;
    }

    const remoteCollection = await ApiService.updateCollection(localCollection);

    // Use store to update with remote collection
    await this.store
      .getState()
      .collections.remoteUpdatedCollection(remoteCollection);

    return remoteCollection;
  }

  private async processDeleteCollection(collectionId: string): Promise<void> {
    await ApiService.deleteCollection(collectionId);
    // Note: Local deletion already happened when action was queued
  }

  private async processLeaveCollection(collectionId: string): Promise<void> {
    await ApiService.removeCollectionMember(
      collectionId,
      this.store.getState().userId
    );
    // Note: Local removal already happened when action was queued
  }

  // Handle remote events
  async handleRemoteCollectionCreated(
    collection: ServerCollection
  ): Promise<void> {
    await this.store.getState().collections.remoteCreatedCollection(collection);
  }

  async handleRemoteCollectionUpdated(
    collection: ServerCollection
  ): Promise<void> {
    await this.store.getState().collections.remoteUpdatedCollection(collection);
  }

  async handleRemoteCollectionDeleted(collectionId: string): Promise<void> {
    await this.store
      .getState()
      .collections.remoteDeletedCollection(collectionId);
  }

  async handleRemoteCollectionJoined(
    userId: string,
    collection: ServerCollection
  ): Promise<void> {
    await this.store
      .getState()
      .collections.remoteJoinedCollection(userId, collection);
  }

  async handleRemoteCollectionLeft(
    userId: string,
    collection: ServerCollection
  ): Promise<void> {
    await this.store
      .getState()
      .collections.remoteLeftCollection(userId, collection);
  }

  // Handle SSE events (Redux-style dispatch to all services)
  async handleSSEEvent(event: SSEEvent): Promise<void> {
    switch (event.type) {
      case "COLLECTION_CREATED":
        await this.handleRemoteCollectionCreated(event.collection);
        break;
      case "COLLECTION_UPDATED": {
        await this.handleRemoteCollectionUpdated(event.collection);
        break;
      }
      case "COLLECTION_DELETED":
        await this.handleRemoteCollectionDeleted(event.collectionId);
        break;
      case "COLLECTION_MEMBER_JOINED": {
        await this.handleRemoteCollectionJoined(event.userId, event.collection);

        queryClient.invalidateQueries({
          queryKey: ["collection-members", event.collection.id],
        });
        break;
      }
      case "COLLECTION_MEMBER_LEFT": {
        await this.handleRemoteCollectionLeft(event.userId, event.collection);
        break;
      }
      // Ignore all other events
    }
  }
}
