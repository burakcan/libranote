import { prisma } from "@/lib/prisma";

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
