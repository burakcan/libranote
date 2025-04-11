import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import { NoteCollaboratorRole, Prisma, prisma, type Note } from "../db/prisma.js";
import { SSEService } from "../services/sse-service.js";

const whereCanViewNote = (userId: string) => ({
  OR: [
    {
      noteCollaborators: {
        some: { userId },
      },
    },
    {
      collection: {
        ownerId: userId,
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
});

const whereCanEditNote = (userId: string) => ({
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
          some: { userId, canEdit: true },
        },
      },
    },
  ],
});

const whereCanDeleteNote = (userId: string) => ({
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
          some: { userId, canEdit: true },
        },
      },
    },
  ],
});

/**
 * Get all notes for the current user (owned + collaborator + in member collections)
 */
export async function getNotes(req: Request, res: Response) {
  const { userId } = req;

  try {
    const notes = await prisma.note.findMany({
      where: whereCanViewNote(userId),
      orderBy: { updatedAt: "desc" },
      include: {
        noteYDocState: {
          omit: { encodedDoc: true },
        },
      },
    });

    res.status(200).json({ notes });
  } catch (error) {
    console.error("Error fetching notes:", error);

    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to fetch notes",
    });
  }
}

/**
 * Get notes by collection ID
 */
export async function getNotesByCollection(req: Request, res: Response) {
  const { userId } = req;
  const { collectionId } = req.params;

  try {
    const notes = await prisma.note.findMany({
      where: {
        collectionId,
        ...whereCanViewNote(userId),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        noteYDocState: {
          omit: { encodedDoc: true },
        },
      },
    });

    res.status(200).json({ notes });
  } catch (error) {
    console.error("Error fetching notes by collection:", error);

    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to fetch notes",
    });
  }
}

/**
 * Get a specific note by ID
 */
export async function getNote(req: Request, res: Response) {
  const { userId } = req;
  const { id } = req.params;

  try {
    // Get note with all permissions data in a single query
    const note = await prisma.note.findUnique({
      where: {
        id,
        ...whereCanViewNote(userId),
      },
      include: {
        noteYDocState: {
          omit: { encodedDoc: true },
        },
      },
    });

    res.status(200).json({ note });
  } catch (error) {
    console.error("Error fetching note:", error);

    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to fetch note",
    });
  }
}

/**
 * Create a new note
 */
export async function createNote(
  req: Request<
    {},
    {},
    {
      note: Pick<
        Note,
        "title" | "description" | "isPublic" | "updatedAt" | "createdAt" | "collectionId" | "id"
      >;
    }
  >,
  res: Response,
) {
  const { userId } = req;
  const { note } = req.body;
  const clientId = (req.headers["x-client-id"] as string) || "";

  try {
    // Validate input
    if (!note.title || typeof note.title !== "string") {
      res.status(400).json({
        error: "BadRequest",
        message: "Title is required and must be a string",
      });
      return;
    }

    if (!note.createdAt || typeof note.createdAt !== "string") {
      res.status(400).json({
        error: "BadRequest",
        message: "Created at is required and must be a string",
      });
      return;
    }

    if (!note.updatedAt || typeof note.updatedAt !== "string") {
      res.status(400).json({
        error: "BadRequest",
        message: "Updated at is required and must be a string",
      });
      return;
    }

    if (note.collectionId) {
      if (typeof note.collectionId !== "string") {
        res.status(400).json({
          error: "BadRequest",
          message: "Collection ID must be a string",
        });
        return;
      }

      // Check if user has permission to create notes in this collection with a single query
      const collection = await prisma.collection.findUnique({
        where: { id: note.collectionId },
        include: {
          members: {
            where: { userId, canEdit: true },
            select: { userId: true },
          },
        },
      });

      if (!collection) {
        res.status(404).json({
          error: "NotFound",
          message: "Collection not found",
        });
        return;
      }

      const isOwner = collection.ownerId === userId;
      const isMember = collection.members.length > 0;

      if (!isOwner && !isMember) {
        res.status(403).json({
          error: "Forbidden",
          message: "You don't have permission to create notes in this collection",
        });
        return;
      }
    }

    // first try to use the note id from the request body,
    // if it clashes with an existing note, then create a new id

    let newNote: Note;

    const noteData: Prisma.NoteCreateArgs["data"] = {
      id: note.id,
      title: note.title,
      description: note.description || null,
      createdById: userId,
      collectionId: note.collectionId,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
      isPublic: note.isPublic,
      noteCollaborators: {
        create: {
          userId,
          role: NoteCollaboratorRole.OWNER,
          id: randomUUID(),
        },
      },
      noteYDocState: {
        create: {
          encodedDoc: new Uint8Array(),
          noteId: note.id,
        },
      },
    };

    try {
      newNote = await prisma.note.create({
        data: noteData,
        include: {
          noteYDocState: {
            omit: { encodedDoc: true },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        // if the note id already exists, create a new one
        const newId = randomUUID();
        newNote = await prisma.note.create({
          data: {
            ...noteData,
            id: newId,
            noteYDocState: {
              create: {
                noteId: newId,
                encodedDoc: new Uint8Array(),
              },
            },
          },
          include: {
            noteYDocState: {
              omit: { encodedDoc: true },
            },
          },
        });
      } else {
        throw error;
      }
    }

    // Broadcast event to other clients
    if (newNote.collectionId) {
      SSEService.broadcastSSEToCollectionMembers(
        newNote.collectionId,
        { type: "NOTE_CREATED", note: newNote },
        userId,
        clientId,
      );
    }

    res.status(201).json({ note: newNote });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to create note",
    });
  }
}

/**
 * Update a note
 */
export async function updateNote(
  req: Request<
    { id: string },
    {},
    { note: Pick<Partial<Note>, "title" | "description" | "isPublic" | "updatedAt"> }
  >,
  res: Response,
) {
  const { userId } = req;
  const { id } = req.params;
  const { note } = req.body;
  const clientId = (req.headers["x-client-id"] as string) || "";

  try {
    // Validate input
    if (
      (note.title !== undefined && typeof note.title !== "string") ||
      (note.description !== undefined &&
        note.description !== null &&
        typeof note.description !== "string") ||
      (note.isPublic !== undefined && typeof note.isPublic !== "boolean")
    ) {
      res.status(400).json({
        error: "BadRequest",
        message: "Invalid input types",
      });
      return;
    }

    // Update note
    const updatedNote = await prisma.note.update({
      where: {
        id,
        ...whereCanEditNote(userId),
      },
      data: note,
      include: {
        noteYDocState: {
          omit: { encodedDoc: true },
        },
      },
    });

    // Broadcast event to other clients
    SSEService.broadcastSSEToNoteCollaborators(
      updatedNote.id,
      { type: "NOTE_UPDATED", note: updatedNote },
      userId,
      clientId,
    );

    res.status(200).json({ note: updatedNote });
  } catch (error) {
    console.error("Error updating note:", error);

    if ((error as Prisma.PrismaClientKnownRequestError).code === "P2025") {
      res.status(404).json({
        error: "NotFound",
        message: "Note not found",
      });
      return;
    }

    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to update note",
    });
  }
}

/**
 * Delete a note
 */
export async function deleteNote(req: Request, res: Response) {
  const { userId } = req;
  const { id } = req.params;
  const clientId = (req.headers["x-client-id"] as string) || "";

  try {
    // Delete note
    const deletedNote = await prisma.note.delete({
      where: {
        id,
        ...whereCanDeleteNote(userId),
      },
    });

    // Broadcast event to other clients
    if (deletedNote.collectionId) {
      SSEService.broadcastSSEToCollectionMembers(
        deletedNote.collectionId,
        { type: "NOTE_DELETED", noteId: deletedNote.id },
        userId,
        clientId,
      );
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting note:", error);

    if ((error as Prisma.PrismaClientKnownRequestError).code === "P2025") {
      res.status(404).json({
        error: "NotFound",
        message: "Note not found",
      });
      return;
    }

    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to delete note",
    });
  }
}
