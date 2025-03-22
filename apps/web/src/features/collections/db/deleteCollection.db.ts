import { prisma, YDocType } from "@/lib/prisma";

export async function deleteCollection(collectionId: string) {
  await prisma.collection.delete({
    where: { id: collectionId },
  });

  await prisma.yDocState.deleteMany({
    where: { id: collectionId, docType: YDocType.COLLECTION },
  });
}
