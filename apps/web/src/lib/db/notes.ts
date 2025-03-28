import * as Y from "yjs";
import { executeTransaction } from "@/lib/db/executeTransaction";
import { prisma, YDocType } from "@/lib/db/prisma";
import { wrapDbOperation } from "./wrapDbOperation";

export async function getNotes(userId: string, collectionId?: string) {
  return await wrapDbOperation(async () => {
    return await prisma.note.findMany({
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
  }, `Failed to get notes for user ${userId}`);
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

  return await executeTransaction(async (tx) => {
    // Always generate a server-side ID
    const id = crypto.randomUUID();

    const note = await tx.note.create({
      data: {
        id,
        ownerId: userId,
        collectionId: collectionId,
        title,
        description,
        isPublic: isPublic || false,
        createdAt: createdAt ?? new Date(),
        updatedAt: updatedAt ?? new Date(),
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
