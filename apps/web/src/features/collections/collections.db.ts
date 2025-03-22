import * as Y from "yjs";
import { prisma, YDocType } from "@/lib/prisma";

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

export async function createCollection(userId: string, title: string) {
  return await prisma.$transaction(async (tx) => {
    const collection = await tx.collection.create({
      data: {
        id: crypto.randomUUID(),
        ownerId: userId,
        title,
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
  });
}

export async function deleteCollection(collectionId: string) {
  return await prisma.collection.delete({
    where: {
      id: collectionId,
    },
  });
}

export async function updateCollection(collectionId: string, title: string) {
  return await prisma.collection.update({
    where: {
      id: collectionId,
    },
    data: {
      title,
      updatedAt: new Date(),
    },
  });
}
