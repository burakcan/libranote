import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import { Prisma, prisma, type Note } from "../db/prisma.js";
import { SSEService } from "../services/sse-service.js";

const whereCanViewNote = (userId: string) => ({
  OR: [
    {
      ownerId: userId,
    },
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
});

const whereCanEditNote = (userId: string) => ({
  OR: [
    {
      ownerId: userId,
    },
    {
      noteCollaborators: {
        some: { userId, canEdit: true },
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
      ownerId: userId,
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
        "title" | "description" | "isPublic" | "updatedAt" | "createdAt" | "collectionId"
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

    const newNote = await prisma.note.create({
      data: {
        id: randomUUID(),
        title: note.title,
        description: note.description || null,
        ownerId: userId,
        collectionId: note.collectionId,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
        isPublic: note.isPublic,
      },
    });

    // Broadcast event to other clients
    if (clientId) {
      SSEService.broadcastSSE(userId, clientId, {
        type: "NOTE_CREATED",
        note: newNote,
      });
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
    });

    // Broadcast event to other clients
    if (clientId) {
      SSEService.broadcastSSE(userId, clientId, {
        type: "NOTE_UPDATED",
        note: updatedNote,
      });
    }

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
    await prisma.note.delete({
      where: {
        id,
        ...whereCanDeleteNote(userId),
      },
    });

    // Broadcast event to other clients
    if (clientId && id) {
      SSEService.broadcastSSE(userId, clientId, {
        type: "NOTE_DELETED",
        noteId: id,
      });
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
