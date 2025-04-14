import { prisma } from "../db/prisma.js";

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
}
