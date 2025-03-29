"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { ActionQueueRepository } from "@/lib/localDb/ActionQueueRepository";
import { CollectionRepository } from "@/lib/localDb/CollectionRepository";
import { NoteRepository } from "@/lib/localDb/NoteRepository";
import { SyncService } from "@/lib/sync/SyncService";
import { useMutex } from "@/lib/useMutex";
import { useStore } from "./StoreProvider";

export function SyncProvider(props: PropsWithChildren) {
  const [initialSyncComplete, setInitialSyncComplete] = useState(false);
  const [locked, acquireLock] = useMutex();
  const {
    clientId,
    setClientId,
    setCollectionsData,
    setNotesData,
    removeActionFromQueue,
    actionQueue,
  } = useStore(
    useShallow((state) => ({
      clientId: state.clientId,
      setClientId: state.setClientId,
      setCollectionsData: state.setCollectionsData,
      setNotesData: state.setNotesData,
      removeActionFromQueue: state.removeActionFromQueue,
      actionQueue: state.actionQueue,
    }))
  );

  // Initial sync
  useEffect(() => {
    const syncData = async () => {
      if (initialSyncComplete || locked || !clientId) return;

      const releaseLock = acquireLock("SyncProvider:initialSync");

      console.debug("SyncProvider: Syncing data");

      const [localCollections, localNotes, queueItems] = await Promise.all([
        CollectionRepository.getAll(),
        NoteRepository.getAll(),
        ActionQueueRepository.getAll(),
      ]);

      console.debug(
        "SyncProvider: Loaded local data",
        localCollections,
        localNotes,
        queueItems
      );

      setCollectionsData(localCollections);
      setNotesData(localNotes);
      console.debug("SyncProvider: Populated store with local data");

      console.debug("SyncProvider: Processing queue items", queueItems);
      for (const item of queueItems) {
        // Process the item
        await SyncService.processActionQueueItem(item);

        // Remove from queue after successful processing
        await ActionQueueRepository.delete(item.id);
        await removeActionFromQueue(item.id);
      }

      await SyncService.syncRemoteCollectionsToLocal();
      await SyncService.syncRemoteNotesToLocal();

      console.debug("SyncProvider: Synced remote data");
      console.debug("SyncProvider: Initial sync completed successfully");

      releaseLock();
      setInitialSyncComplete(true);
    };

    syncData();
  }, [
    locked,
    initialSyncComplete,
    clientId,
    acquireLock,
    setCollectionsData,
    setNotesData,
    removeActionFromQueue,
  ]);

  // Process new queue items as they are added
  useEffect(() => {
    async function process() {
      if (
        locked ||
        !clientId ||
        !initialSyncComplete ||
        actionQueue.length === 0
      )
        return;

      const releaseLock = acquireLock("SyncProvider:queueItemProcessor");

      console.debug("SyncProvider: Processing new queue items");

      const pendingActions = actionQueue.filter(
        (item) => item.status === "pending"
      );

      for (const item of pendingActions) {
        // Process the item
        await SyncService.processActionQueueItem(item);

        // Remove from queue after successful processing
        await ActionQueueRepository.delete(item.id);
        await removeActionFromQueue(item.id);
      }

      releaseLock();
    }

    process();
  }, [
    actionQueue,
    locked,
    clientId,
    initialSyncComplete,
    acquireLock,
    removeActionFromQueue,
  ]);

  // SSE event handling
  useEffect(() => {
    const localClientId = localStorage.getItem("clientId");

    // If we have a local clientId, set it so other parts of the app can use it.
    // In most cases, this should be fine since clientId just needs to be unique per user.
    if (localClientId) {
      setClientId(localClientId);
    }

    const eventSource = new EventSource(
      localClientId ? `/api/sse?clientId=${localClientId}` : "/api/sse"
    );

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
  }, [setClientId]);

  return <>{props.children}</>;
}
