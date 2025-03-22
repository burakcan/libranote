import * as Y from "yjs";
import { prisma, YDocType } from "@/lib/prisma";

function createNoteYDoc(title: string, content: string) {
  const doc = new Y.Doc();
  doc.getMap("note").set("title", title);
  doc.getMap("note").set("content", content);

  const yDocState = Y.encodeStateAsUpdate(doc);
  return Buffer.from(yDocState);
}

export async function createNote(
  userId: string,
  collectionId: string,
  title: string,
  content: string
) {
  return await prisma.$transaction(async (tx) => {
    const note = await tx.note.create({
      data: {
        id: crypto.randomUUID(),
        ownerId: userId,
        collectionId: collectionId,
        title,
        description: content,
      },
    });

    await tx.yDocState.create({
      data: {
        id: note.id,
        docType: YDocType.NOTE,
        encodedDoc: createNoteYDoc(title, content),
      },
    });

    return note;
  });
}
