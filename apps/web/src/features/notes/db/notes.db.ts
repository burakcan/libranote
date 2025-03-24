import * as Y from "yjs";
import { TransactionalRepository } from "@/lib/db/transactionalRepository";
import { prisma, YDocType } from "@/lib/prisma";

export async function getNotes(userId: string, collectionId?: string) {
  const notes = await prisma.note.findMany({
    where: {
      ...(collectionId && { collectionId }),
      OR: [
        {
          ownerId: userId,
        },
        {
          noteCollaborators: {
            some: { userId },
          },
        },
      ],
    },
  });

  return notes;
}

function createNoteYDoc(title: string, content: string) {
  const doc = new Y.Doc();
  doc.getMap("note").set("title", title);
  doc.getMap("note").set("content", content);

  const yDocState = Y.encodeStateAsUpdate(doc);
  return Buffer.from(yDocState);
}

export async function createNote(options: {
  userId: string;
  collectionId: string;
  title: string;
  description: string;
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  const {
    userId,
    collectionId,
    title,
    description,
    isPublic,
    createdAt,
    updatedAt,
  } = options;

  return await TransactionalRepository.executeTransaction(async (tx) => {
    // Always generate a server-side ID
    const id = TransactionalRepository.createId();

    const note = await tx.note.create({
      data: {
        id,
        ownerId: userId,
        collectionId: collectionId,
        title,
        description,
        isPublic: isPublic || false,
        ...(createdAt && { createdAt }),
        ...(updatedAt && { updatedAt }),
      },
    });

    await tx.yDocState.create({
      data: {
        id: note.id,
        docType: YDocType.NOTE,
        encodedDoc: createNoteYDoc(title, ""),
      },
    });

    return note;
  }, `Failed to create note "${title}"`);
}
