import { CollectionMemberRole, NoteCollaboratorRole } from '@repo/db';
import { prisma } from '@/services/prisma.js';

export class AuthService {
  /**
   * Create a Prisma where clause for notes that a user can edit
   */
  static whereCanEdit(userId: string): {
    OR: Array<{
      noteCollaborators?: {
        some: {
          userId: string;
          role: {
            in: NoteCollaboratorRole[];
          };
        };
      };
      collection?: {
        members: {
          some: {
            userId: string;
            role: { in: CollectionMemberRole[] };
          };
        };
      };
    }>;
  } {
    return {
      OR: [
        {
          noteCollaborators: {
            some: {
              userId,
              role: {
                in: [NoteCollaboratorRole.OWNER, NoteCollaboratorRole.EDITOR],
              },
            },
          },
        },
        {
          collection: {
            members: {
              some: {
                userId,
                role: { in: [CollectionMemberRole.OWNER, CollectionMemberRole.EDITOR] },
              },
            },
          },
        },
      ],
    };
  }

  /**
   * Check if a user has edit access to a specific note
   */
  static async checkNoteEditAccess(noteId: string, userId: string): Promise<boolean> {
    try {
      const note = await prisma.note.findUnique({
        where: {
          id: noteId,
          ...this.whereCanEdit(userId),
        },
      });

      return !!note;
    } catch (error) {
      console.error('Error checking note access:', error);
      return false;
    }
  }

  /**
   * Get a note that the user has edit access to
   */
  static async getEditableNote(noteId: string, userId: string): Promise<unknown> {
    return prisma.note.findUnique({
      where: {
        id: noteId,
        ...this.whereCanEdit(userId),
      },
    });
  }
}
