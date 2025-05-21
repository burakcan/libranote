import { nanoid } from "nanoid";
import {
  CollectionMemberRole,
  NoteCollaboratorRole,
  Prisma,
  prisma,
  type Note,
} from "../db/prisma.js";
import { SSEService } from "./sse-service.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";

/**
 * Common permission filters used across methods
 */
export class NotePermissions {
  static whereCanView(userId: string) {
    return {
      OR: [
        {
          noteCollaborators: {
            some: { userId },
          },
        },
        {
          collection: {
            members: {
              some: { userId },
            },
          },
        },
      ],
    };
  }

  static whereCanEdit(userId: string) {
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

  static whereCanDelete(userId: string) {
    return {
      OR: [
        {
          noteCollaborators: {
            some: {
              userId,
              role: NoteCollaboratorRole.OWNER,
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
}

/**
 * Standard include object for note queries that omits the encoded doc
 */
const noteDefaultInclude = {
  noteYDocState: {
    omit: { encodedDoc: true },
  },
};

export class NoteService {
  /**
   * Get all notes that a user can view
   */
  static async getNotes(userId: string) {
    return prisma.note.findMany({
      where: NotePermissions.whereCanView(userId),
      orderBy: { updatedAt: "desc" },
      include: noteDefaultInclude,
    });
  }

  /**
   * Get notes by collection ID
   */
  static async getNotesByCollection(userId: string, collectionId: string) {
    return prisma.note.findMany({
      where: {
        collectionId,
        ...NotePermissions.whereCanView(userId),
      },
      orderBy: { updatedAt: "desc" },
      include: noteDefaultInclude,
    });
  }

  /**
   * Get a specific note by ID
   */
  static async getNote(userId: string, noteId: string) {
    const note = await prisma.note.findUnique({
      where: {
        id: noteId,
        ...NotePermissions.whereCanView(userId),
      },
      include: noteDefaultInclude,
    });

    if (!note) {
      throw new NotFoundError("Note not found");
    }

    return note;
  }

  /**
   * Verify if a user can create a note in a collection
   */
  private static async verifyCollectionEditPermission(userId: string, collectionId: string) {
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
        members: {
          some: {
            userId,
            role: { in: [CollectionMemberRole.OWNER, CollectionMemberRole.EDITOR] },
          },
        },
      },
    });

    if (!collection) {
      throw new ForbiddenError("You don't have permission to create notes in this collection");
    }
  }

  /**
   * Create a new note
   */
  static async createNote(
    userId: string,
    noteData: Pick<
      Note,
      "title" | "description" | "isPublic" | "updatedAt" | "createdAt" | "collectionId" | "id"
    >,
    clientId: string,
  ) {
    // Verify collection permissions if a collection is specified
    if (noteData.collectionId) {
      await this.verifyCollectionEditPermission(userId, noteData.collectionId);
    }

    const collectionOwner = noteData.collectionId
      ? await prisma.collectionMember.findFirst({
          where: {
            collectionId: noteData.collectionId,
            role: CollectionMemberRole.OWNER,
          },
        })
      : null;

    // Create note with appropriate data
    const createData: Prisma.NoteCreateArgs["data"] = {
      id: noteData.id,
      title: noteData.title,
      description: noteData.description || null,
      createdById: userId,
      collectionId: noteData.collectionId,
      createdAt: new Date(noteData.createdAt),
      updatedAt: new Date(noteData.updatedAt),
      isPublic: noteData.isPublic,
      noteCollaborators: {
        // if the collection has an owner, make them the owner of the note
        create: {
          userId: collectionOwner?.userId || userId,
          role: NoteCollaboratorRole.OWNER,
          id: nanoid(10),
        },
      },
      noteYDocState: {
        create: {
          id: noteData.id,
          encodedDoc: new Uint8Array(),
        },
      },
    };

    // Try to create with provided ID, if fails with unique constraint, generate new ID
    let note: Note;
    try {
      note = await prisma.note.create({
        data: createData,
        include: noteDefaultInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        // if the note id already exists, create a new one
        const newId = nanoid(10);
        note = await prisma.note.create({
          data: {
            ...createData,
            id: newId,
            noteYDocState: {
              create: {
                id: newId,
                encodedDoc: new Uint8Array(),
              },
            },
          },
          include: noteDefaultInclude,
        });
      } else {
        throw error;
      }
    }

    // Broadcast event to other clients
    SSEService.broadcastSSEToNoteCollaborators(
      note.id,
      { type: "NOTE_CREATED", note },
      userId,
      clientId,
    );

    return note;
  }

  /**
   * Update a note
   */
  static async updateNote(
    userId: string,
    noteId: string,
    updateData: Pick<Partial<Note>, "title" | "description" | "isPublic" | "updatedAt">,
    clientId: string,
  ) {
    // Update note if user has edit permission
    const updatedNote = await prisma.note.update({
      where: {
        id: noteId,
        ...NotePermissions.whereCanEdit(userId),
      },
      data: updateData,
      include: noteDefaultInclude,
    });

    if (!updatedNote) {
      throw new NotFoundError("Note not found");
    }

    // Broadcast event to other clients
    SSEService.broadcastSSEToNoteCollaborators(
      updatedNote.id,
      { type: "NOTE_UPDATED", note: updatedNote },
      userId,
      clientId,
    );

    return updatedNote;
  }

  /**
   * Delete a note
   */
  static async deleteNote(userId: string, noteId: string, clientId: string) {
    // First, get the note with its collaborators before deletion to have info for notifications
    const noteToDelete = await prisma.note.findUnique({
      where: {
        id: noteId,
        ...NotePermissions.whereCanDelete(userId),
      },
      include: {
        noteCollaborators: {
          select: { userId: true },
        },
        collection: {
          select: {
            members: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!noteToDelete) {
      throw new NotFoundError("Note not found");
    }

    const userIds = new Set<string>();
    const noteCollaboratorUserIds = noteToDelete.noteCollaborators.map((c) => c.userId) || [];
    const collectionMemberUserIds = noteToDelete.collection?.members.map((m) => m.userId) || [];

    [userId, ...noteCollaboratorUserIds, ...collectionMemberUserIds].forEach((userId) =>
      userIds.add(userId),
    );

    // Delete note
    const deletedNote = await prisma.note.delete({
      where: {
        id: noteId,
      },
    });

    // Broadcast event to other clients
    // Use broadcastSSEToNoteCollaborators for notes both with and without collections
    SSEService.broadcastSSEToNoteCollaborators(
      noteId,
      { type: "NOTE_DELETED", noteId: deletedNote.id },
      userId,
      clientId,
      Array.from(userIds),
    );

    return deletedNote;
  }
}
