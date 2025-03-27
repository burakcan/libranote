"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/components/providers/StoreProvider";
import { CollectionRepository } from "@/lib/localDb/CollectionRepository";
import { NoteRepository } from "@/lib/localDb/NoteRepository";
import { SyncService } from "@/lib/sync/SyncService";

export function SyncProvider() {
  const {
    actionQueue,
    removeActionFromQueue,
    setCollectionsData,
    setNotesData,
    collectionsSyncStatus,
    setCollectionsSyncStatus,
    notesSyncStatus,
    setNotesSyncStatus,
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
    }))
  );

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

  useEffect(() => {
    const eventSource = new EventSource("/api/sse");

    eventSource.onmessage = (event) => {
      console.log("SyncManager: SSE event", event.data);
      SyncService.processSSEEvent(event.data);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return null;
}
