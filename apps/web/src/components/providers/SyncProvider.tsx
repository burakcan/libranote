"use client";

import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/components/providers/StoreProvider";
import { CollectionRepository } from "@/lib/localDb/CollectionRepository";
import { NoteRepository } from "@/lib/localDb/NoteRepository";
import { SyncService } from "@/lib/sync/SyncService";

export function SyncProvider() {
  // Sync lock state to prevent concurrent operations
  const [syncInProgress, setSyncInProgress] = useState(false);

  const {
    actionQueue,
    removeActionFromQueue,
    setCollectionsData,
    setNotesData,
    collectionsSyncStatus,
    setCollectionsSyncStatus,
    notesSyncStatus,
    setNotesSyncStatus,
    clientId,
  } = useStore(
    useShallow((state) => ({
      actionQueue: state.actionQueue,
      removeActionFromQueue: state.removeActionFromQueue,
      setCollectionsData: state.setCollectionsData,
      setNotesData: state.setNotesData,
      collectionsSyncStatus: state.collections.syncStatus,
      setCollectionsSyncStatus: state.setCollectionsSyncStatus,
      notesSyncStatus: state.notes.syncStatus,
      setNotesSyncStatus: state.setNotesSyncStatus,
      clientId: state.clientId,
    }))
  );

  // Initial sync effect
  useEffect(() => {
    const syncData = async () => {
      // Only start sync if both collections and notes are idle AND no sync is in progress
      if (
        collectionsSyncStatus !== "init" ||
        notesSyncStatus !== "init" ||
        syncInProgress ||
        !clientId
      ) {
        return;
      }

      // Acquire sync lock
      setSyncInProgress(true);
      console.debug("SyncManager: Starting sync process (acquired sync lock)");

      setCollectionsSyncStatus("syncing");
      setNotesSyncStatus("syncing");

      try {
        // Step 1: Load local data
        const [localCollections, localNotes, queueItems] = await Promise.all([
          CollectionRepository.getAll(),
          NoteRepository.getAll(),
          SyncService.getActionQueueItems(),
        ]);

        // Step 2: Set local data to store
        setCollectionsData(localCollections);
        setNotesData(localNotes);

        // Step 3: Process all pending actions
        for (const item of queueItems) {
          try {
            // Process the item
            await SyncService.processActionQueueItem(item);
            // Remove from queue after successful processing
            await SyncService.removeActionQueueItem(item.id);
            await removeActionFromQueue(item.id);
          } catch (error) {
            console.error(
              `SyncManager: Failed to process queue item ${item.id}`,
              error
            );
          }
        }

        await SyncService.syncRemoteCollectionsToLocal();
        setCollectionsSyncStatus("synced");
        console.debug("SyncManager: Collections synced successfully");

        await SyncService.syncRemoteNotesToLocal();
        setNotesSyncStatus("synced");
        console.debug("SyncManager: Notes synced successfully");

        console.debug("SyncManager: Sync completed successfully");
      } catch (error) {
        console.error("SyncManager: Error during sync process", error);
        setCollectionsSyncStatus("error");
        setNotesSyncStatus("error");
      } finally {
        // Always release the sync lock when done, regardless of success or failure
        setSyncInProgress(false);
        console.debug("SyncManager: Released sync lock");
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
    syncInProgress,
    clientId,
  ]);

  // Process new queue items as they are added
  useEffect(() => {
    const processNewQueueItems = async () => {
      // Only process queue if synced AND no sync already in progress
      if (
        actionQueue.length === 0 ||
        collectionsSyncStatus === "init" ||
        notesSyncStatus === "init" ||
        syncInProgress ||
        !clientId
      ) {
        console.debug(
          "SyncManager: Skipping processing new queue items",
          actionQueue.length,
          collectionsSyncStatus,
          notesSyncStatus,
          syncInProgress,
          clientId
        );
        return;
      }

      console.debug(
        "SyncManager: Processing new queue items",
        actionQueue.length,
        collectionsSyncStatus,
        notesSyncStatus,
        syncInProgress,
        clientId
      );

      // Acquire sync lock
      setSyncInProgress(true);
      console.debug(
        "SyncManager: Processing new queue items (acquired sync lock)"
      );

      setCollectionsSyncStatus("syncing");
      setNotesSyncStatus("syncing");

      try {
        // Process pending actions in queue
        const pendingActions = actionQueue.filter(
          (item) => item.status === "pending"
        );

        for (const item of pendingActions) {
          try {
            await SyncService.processActionQueueItem(item);
            await SyncService.removeActionQueueItem(item.id);
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
      } catch (error) {
        console.error("SyncManager: Error processing queue items", error);
        setCollectionsSyncStatus("error");
        setNotesSyncStatus("error");
      } finally {
        // Always release the sync lock when done, regardless of success or failure
        setSyncInProgress(false);
        console.debug("SyncManager: Released sync lock");
      }
    };

    processNewQueueItems();
  }, [
    actionQueue,
    removeActionFromQueue,
    collectionsSyncStatus,
    notesSyncStatus,
    setCollectionsSyncStatus,
    setNotesSyncStatus,
    syncInProgress,
    clientId,
  ]);

  // SSE event handling
  useEffect(() => {
    const eventSource = new EventSource("/api/sse");

    eventSource.onmessage = (event) => {
      console.log("SyncManager: SSE event", event.data);
      // Note: We don't block SSE events during sync, but in a more robust
      // implementation we might want to queue them if a sync is in progress
      SyncService.processSSEEvent(event.data);
    };

    // Clean up event source and any active timeouts on unmount
    return () => {
      eventSource.close();
    };
  }, []);

  return null;
}
