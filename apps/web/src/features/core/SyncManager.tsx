"use client";

import { useEffect } from "react";
import {
  CollectionRepository,
  NoteRepository,
  ActionQueueRepository,
} from "@/lib/local-persistence/localDb";
import {
  processActionQueueItem,
  syncRemoteCollectionsToLocal,
  syncRemoteNotesToLocal,
} from "@/lib/sync/syncService";
import { useStore } from "@/features/core/StoreProvider";

export function SyncManager() {
  const actionQueue = useStore((state) => state.actionQueue);
  const removeActionFromQueue = useStore(
    (state) => state.removeActionFromQueue
  );

  // Collections state
  const collectionsSyncStatus = useStore(
    (state) => state.collections.syncStatus
  );
  const setCollectionsData = useStore((state) => state.setCollectionsData);
  const setCollectionsSyncStatus = useStore(
    (state) => state.setCollectionsSyncStatus
  );

  // Notes state
  const notesSyncStatus = useStore((state) => state.notes.syncStatus);
  const setNotesData = useStore((state) => state.setNotesData);
  const setNotesSyncStatus = useStore((state) => state.setNotesSyncStatus);

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
          ActionQueueRepository.getAll(),
        ]);

        // Step 2: Set local data to store
        setCollectionsData(localCollections);
        setNotesData(localNotes);

        // Step 3: Process all pending actions
        // Priority will be handled within processActionQueueItem
        for (const item of queueItems) {
          try {
            // Process the item
            await processActionQueueItem(item);
            // Remove from queue after successful processing
            await removeActionFromQueue(item.id);
          } catch (error) {
            console.error(
              `SyncManager: Failed to process queue item ${item.id}`,
              error
            );
          }
        }

        await syncRemoteCollectionsToLocal();
        setCollectionsSyncStatus("synced");
        console.debug("SyncManager: Collections synced successfully");

        await syncRemoteNotesToLocal();
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
      // Process pending actions in queue
      const pendingActions = actionQueue.filter(
        (item) => item.status === "pending"
      );

      console.debug("SyncManager: Processing new queue items", pendingActions);

      for (const item of pendingActions) {
        try {
          // processActionQueueItem now handles dependencies correctly
          await processActionQueueItem(item);
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
    };

    processNewQueueItems();
  }, [actionQueue, removeActionFromQueue]);

  return null;
}
