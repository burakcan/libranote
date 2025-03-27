import * as Y from "yjs";
import { executeTransaction } from "@/lib/db/executeTransaction";
import { prisma, YDocType } from "@/lib/db/prisma";
import { wrapDbOperation } from "./wrapDbOperation";

export async function getCollections(userId: string) {
  const collections = await prisma.collection.findMany({
    where: {
      OR: [
        {
          ownerId: userId,
        },
        {
          members: {
            some: { userId },
          },
        },
      ],
    },
  });

  return collections;
}

function createCollectionYDoc(title: string) {
  const doc = new Y.Doc();
  doc.getMap("collection").set("title", title);

  const yDocState = Y.encodeStateAsUpdate(doc);

  return Buffer.from(yDocState);
}

export async function createCollection(options: {
  userId: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  const { userId, title, createdAt, updatedAt } = options;
  return await executeTransaction(async (tx) => {
    // Always generate a server-side ID
    const id = crypto.randomUUID();

    const collection = await tx.collection.create({
      data: {
        id,
        ownerId: userId,
        title,
        ...(createdAt && { createdAt }),
        ...(updatedAt && { updatedAt }),
      },
    });

    await tx.yDocState.create({
      data: {
        id: collection.id,
        docType: YDocType.COLLECTION,
        encodedDoc: createCollectionYDoc(title),
      },
    });

    return collection;
  }, `Failed to create collection "${title}"`);
}

export async function deleteCollection(collectionId: string) {
  return await wrapDbOperation(async () => {
    return await prisma.collection.delete({
      where: {
        id: collectionId,
      },
    });
  }, `Failed to delete collection with ID ${collectionId}`);
}

export async function updateCollection(collectionId: string, title: string) {
  return await wrapDbOperation(async () => {
    return await prisma.collection.update({
      where: {
        id: collectionId,
      },
      data: {
        title,
        updatedAt: new Date(),
      },
    });
  }, `Failed to update collection with ID ${collectionId}`);
}
