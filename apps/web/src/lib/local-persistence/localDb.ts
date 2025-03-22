import Dexie, { Transaction } from "dexie";
import { Collection } from "@/lib/prisma";

export const localDb = new Dexie("libra-local-db");

localDb.version(1).stores({
  collections: "id, title, ownerId, createdAt, updatedAt",
  notes: "id, title, description, ownerId, collectionId, createdAt, updatedAt",
  actionQueue: "id, relatedEntityId, type, status, createdAt",
});

const collections = localDb.table<Collection>("collections");
const actionQueue = localDb.table<ActionQueue.Item>("actionQueue");

export const getCollections = async () => {
  return await collections.toArray();
};

export const getCollection = async (id: Collection["id"]) => {
  return await collections.get(id);
};

export const upsertCollection = async (
  collection: Collection,
  tx?: Transaction
) => {
  if (tx) {
    await tx.table<Collection>("collections").put(collection);
  } else {
    await localDb.table<Collection>("collections").put(collection);
  }
};

export const deleteCollection = async (
  id: Collection["id"],
  tx?: Transaction
) => {
  if (tx) {
    await tx.table<Collection>("collections").delete(id);
  } else {
    await localDb.table<Collection>("collections").delete(id);
  }
};

export const getActionQueue = async () => {
  return await actionQueue.toArray();
};

export const addActionToQueue = async (
  action: ActionQueue.Item,
  tx?: Transaction
) => {
  if (tx) {
    await tx.table<ActionQueue.Item>("actionQueue").add(action);
  } else {
    await localDb.table<ActionQueue.Item>("actionQueue").add(action);
  }
};

export const removeActionFromQueue = async (
  actionId: ActionQueue.Item["id"],
  tx?: Transaction
) => {
  if (tx) {
    await tx.table<ActionQueue.Item>("actionQueue").delete(actionId);
  } else {
    await localDb.table<ActionQueue.Item>("actionQueue").delete(actionId);
  }
};

export const createCollection = async (
  collectionId: Collection["id"],
  title: Collection["title"],
  ownerId: Collection["ownerId"],
  actionId: ActionQueue.Item["id"]
) => {
  await localDb.transaction(
    "rw",
    localDb.table("collections"),
    localDb.table("actionQueue"),
    async (tx) => {
      await tx.table<Collection>("collections").add({
        id: collectionId,
        title,
        ownerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await tx.table<ActionQueue.Item>("actionQueue").add({
        id: actionId,
        type: "CREATE_COLLECTION",
        relatedEntityId: collectionId,
        status: "pending",
        createdAt: new Date(),
      });
    }
  );
};

export const swapCollection = async (
  localCollection: Collection,
  remoteCollection: Collection
) => {
  console.log("swapCollection", localCollection, remoteCollection);
  await localDb.transaction("rw", localDb.table("collections"), async (tx) => {
    await tx.table<Collection>("collections").put(remoteCollection);
    await tx.table<Collection>("collections").delete(localCollection.id);
  });
};
