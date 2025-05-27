import { prisma } from "../db/prisma.js";
import { NotFoundError } from "../utils/errors.js";

export class YDocStateService {
  static async getYDocStates(userId: string) {
    return prisma.noteYDocState.findMany({
      select: {
        id: true,
        noteId: true,
        updatedAt: true,
      },
      where: {
        note: {
          noteCollaborators: {
            some: {
              userId,
            },
          },
        },
      },
    });
  }

  static async getYDoc(userId: string, noteId: string) {
    const yDocState = await prisma.noteYDocState.findFirst({
      where: {
        noteId,
        note: {
          noteCollaborators: {
            some: {
              userId,
            },
          },
        },
      },
    });

    if (!yDocState) {
      throw new NotFoundError("Note not found");
    }

    return yDocState.encodedDoc;
  }
}
