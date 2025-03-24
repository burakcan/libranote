"use client";

import { useEffect } from "react";
import {
  CollectionRepository,
  NoteRepository,
} from "@/lib/local-persistence/localDb";
import { syncService } from "@/lib/sync/syncService";
import { useStore, getStoreInstance } from "@/features/core/StoreProvider";

export function SyncManager() {
  // Get store state and actions
  const actionQueue = useStore((state) => state.actionQueue);
  const removeActionFromQueue = useStore(
    (state) => state.removeActionFromQueue
  );
  const setCollectionsData = useStore((state) => state.setCollectionsData);
  const setNotesData = useStore((state) => state.setNotesData);

  // Collections state
  const collectionsSyncStatus = useStore(
    (state) => state.collections.syncStatus
  );
  const setCollectionsSyncStatus = useStore(
    (state) => state.setCollectionsSyncStatus
  );

  // Notes state
  const notesSyncStatus = useStore((state) => state.notes.syncStatus);
  const setNotesSyncStatus = useStore((state) => state.setNotesSyncStatus);

  // Initialize sync service with store on component mount
  useEffect(() => {
    // Get the store instance using the exported helper
    const store = getStoreInstance();

    if (store) {
      // Provide the store instance to the sync service
      syncService.setStoreInstance(store);
    }
  }, []);

  // Initial sync effect
  useEffect(() => {
    const syncData = async () => {
      // Only start sync if both collections and notes are idle
      if (collectionsSyncStatus !== "idle" || notesSyncStatus !== "idle") {
        return;
      }

      console.debug("SyncManager: Starting sync process");
      setCollectionsSyncStatus("syncing");
      setNotesSyncStatus("syncing");

      try {
        // Step 1: Load local data
        const [localCollections, localNotes, queueItems] = await Promise.all([
          CollectionRepository.getAll(),
          NoteRepository.getAll(),
          syncService.getActionQueueItems(),
        ]);

        // Step 2: Set local data to store
        setCollectionsData(localCollections);
        setNotesData(localNotes);

        // Step 3: Process all pending actions
        for (const item of queueItems) {
          try {
            // Process the item
            await syncService.processActionQueueItem(item);
            // Remove from queue after successful processing
            await syncService.removeActionQueueItem(item.id);
            await removeActionFromQueue(item.id);
          } catch (error) {
            console.error(
              `SyncManager: Failed to process queue item ${item.id}`,
              error
            );
          }
        }

        await syncService.syncRemoteCollectionsToLocal();
        setCollectionsSyncStatus("synced");
        console.debug("SyncManager: Collections synced successfully");

        await syncService.syncRemoteNotesToLocal();
        setNotesSyncStatus("synced");
        console.debug("SyncManager: Notes synced successfully");

        console.debug("SyncManager: Sync completed successfully");
      } catch (error) {
        console.error("SyncManager: Error during sync process", error);
        setCollectionsSyncStatus("error");
        setNotesSyncStatus("error");
      }
    };

    syncData();
  }, [
    setCollectionsData,
    setCollectionsSyncStatus,
    collectionsSyncStatus,
    setNotesData,
    setNotesSyncStatus,
    notesSyncStatus,
    removeActionFromQueue,
  ]);

  // Process new queue items as they are added
  useEffect(() => {
    const processNewQueueItems = async () => {
      if (
        collectionsSyncStatus !== "synced" ||
        notesSyncStatus !== "synced" ||
        actionQueue.length === 0
      ) {
        return;
      }

      console.debug("SyncManager: Processing new queue items");

      setCollectionsSyncStatus("syncing");
      setNotesSyncStatus("syncing");

      // Process pending actions in queue
      const pendingActions = actionQueue.filter(
        (item) => item.status === "pending"
      );

      for (const item of pendingActions) {
        try {
          await syncService.processActionQueueItem(item);
          await syncService.removeActionQueueItem(item.id);
          await removeActionFromQueue(item.id);
          console.debug(
            "SyncManager: Processed queue item",
            item.id,
            "successfully"
          );
        } catch (error) {
          console.error(
            `SyncManager: Failed to process queue item ${item.id}`,
            error
          );
        }
      }

      setCollectionsSyncStatus("synced");
      setNotesSyncStatus("synced");
    };

    processNewQueueItems();
  }, [
    actionQueue,
    removeActionFromQueue,
    collectionsSyncStatus,
    notesSyncStatus,
    setCollectionsSyncStatus,
    setNotesSyncStatus,
  ]);

  return null;
}
