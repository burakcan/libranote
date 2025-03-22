"use client";

import { useEffect } from "react";
import { LocalDataService } from "@/lib/local-persistence/localDataService";
import {
  processActionQueueItem,
  syncRemoteToLocal,
} from "@/lib/sync/syncService";
import { useStore } from "@/features/core/StoreProvider";

export function SyncManager() {
  const actionQueue = useStore((state) => state.actionQueue);
  const removeActionFromQueue = useStore(
    (state) => state.removeActionFromQueue
  );
  const collectionsSyncStatus = useStore(
    (state) => state.collections.syncStatus
  );
  const setCollectionsData = useStore((state) => state.setCollectionsData);
  const setCollectionsSyncStatus = useStore(
    (state) => state.setCollectionsSyncStatus
  );

  // Initial sync effect
  useEffect(() => {
    const syncData = async () => {
      if (collectionsSyncStatus !== "idle") {
        return;
      }

      console.debug("SyncManager: Starting sync process");
      setCollectionsSyncStatus("syncing");

      try {
        // Step 1: Load local data
        const [localCollections, queueItems] = await Promise.all([
          LocalDataService.getCollections(),
          LocalDataService.getActionQueue(),
        ]);

        // Step 2: Set local data to store
        setCollectionsData(localCollections);

        // Step 3: Process action queue
        for (const item of queueItems) {
          try {
            await processActionQueueItem(item);
            await removeActionFromQueue(item.id);
          } catch (error) {
            console.error(
              `SyncManager: Failed to process queue item ${item.id}`,
              error
            );
            // Continue with next item even if one fails
          }
        }

        // Step 4: Fetch and sync remote collections
        const remoteCollections = await syncRemoteToLocal();

        // Step 5: Update store with synced data
        setCollectionsData(remoteCollections);
        setCollectionsSyncStatus("synced");

        console.debug("SyncManager: Sync completed successfully");
      } catch (error) {
        console.error("SyncManager: Error during sync process", error);
        setCollectionsSyncStatus("error");
      }
    };

    syncData();
  }, [
    setCollectionsData,
    setCollectionsSyncStatus,
    collectionsSyncStatus,
    removeActionFromQueue,
  ]);

  // Process new queue items as they are added
  useEffect(() => {
    const processNewQueueItems = async () => {
      for (const item of actionQueue) {
        if (item.status === "pending") {
          try {
            await processActionQueueItem(item);
            await removeActionFromQueue(item.id);
          } catch (error) {
            console.error(
              `SyncManager: Failed to process queue item ${item.id}`,
              error
            );
          }
        }
      }
    };

    processNewQueueItems();
  }, [actionQueue, removeActionFromQueue]);

  return null;
}
