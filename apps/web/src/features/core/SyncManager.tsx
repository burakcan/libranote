"use client";

import { useEffect } from "react";
import {
  getActionQueue,
  getCollections,
  upsertCollection,
  getCollection,
  swapCollection,
} from "@/lib/local-persistence/localDb";
import { Collection } from "@/lib/prisma";
import { useStore } from "@/features/core/StoreProvider";

async function processActionQueueItem(item: ActionQueue.Item) {
  switch (item.type) {
    case "CREATE_COLLECTION":
      const localCollection = await getCollection(item.relatedEntityId);

      if (!localCollection) {
        console.error(
          `SyncManager: Collection ${item.relatedEntityId} not found`
        );
        return;
      }

      const remoteCollection = await fetch("/api/collections", {
        method: "POST",
        body: JSON.stringify({
          id: localCollection.id,
          title: localCollection.title,
        }),
      }).then((res) => res.json());

      console.log("remoteCollection", remoteCollection);

      await swapCollection(localCollection, remoteCollection);
      break;
    case "DELETE_COLLECTION":
      // TODO: Implement API call to delete collection on server
      // await fetch(`/api/collections/${item.relatedEntityId}`, { method: "DELETE" });
      break;
    case "CREATE_NOTE":
      // TODO: Implement API call to create note on server
      // await fetch("/api/notes", { method: "POST", body: JSON.stringify({ id: item.relatedEntityId }) });
      break;
    case "DELETE_NOTE":
      // TODO: Implement API call to delete note on server
      // await fetch(`/api/notes/${item.relatedEntityId}`, { method: "DELETE" });
      break;
  }
}

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
  const collectionsData = useStore((state) => state.collections.data);

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
          getCollections(),
          getActionQueue(),
        ]);
        console.debug(
          "SyncManager: Loaded local collections",
          localCollections
        );
        console.debug("SyncManager: Loaded queue items", queueItems);

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
        const remoteCollections: Collection[] = await fetch(
          "/api/collections"
        ).then((res) => res.json());
        console.debug(
          "SyncManager: Loaded remote collections",
          remoteCollections
        );

        // Step 5: Update store and local db with remote data
        setCollectionsData(remoteCollections);
        await Promise.all(
          remoteCollections.map((collection) => upsertCollection(collection))
        );

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

  console.log("collectionsData", collectionsData);

  return null;
}
