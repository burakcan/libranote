import type { Request, Response, NextFunction } from "express";
import type { Note } from "../db/prisma.js";
import { NoteService } from "../services/note-service.js";

/**
 * Get all notes for the current user (owned + collaborator + in member collections)
 */
export async function getNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const notes = await NoteService.getNotes(req.userId);
    res.status(200).json({ notes });
  } catch (error) {
    next(error);
  }
}

/**
 * Get notes by collection ID
 */
export async function getNotesByCollection(req: Request, res: Response, next: NextFunction) {
  try {
    const { collectionId } = req.params;
    if (!collectionId) {
      throw new Error("Collection ID is required");
    }
    const notes = await NoteService.getNotesByCollection(req.userId, collectionId);
    res.status(200).json({ notes });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific note by ID
 */
export async function getNote(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new Error("Note ID is required");
    }
    const note = await NoteService.getNote(req.userId, id);
    res.status(200).json({ note });
  } catch (error) {
    next(error);
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
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { note } = req.body;
    const clientId = (req.headers["x-client-id"] as string) || "";

    const newNote = await NoteService.createNote(userId, note, clientId);
    res.status(201).json({ note: newNote });
  } catch (error) {
    next(error);
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
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { id } = req.params;
    if (!id) {
      throw new Error("Note ID is required");
    }
    const { note } = req.body;
    const clientId = (req.headers["x-client-id"] as string) || "";

    const updatedNote = await NoteService.updateNote(userId, id, note, clientId);
    res.status(200).json({ note: updatedNote });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a note
 */
export async function deleteNote(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req;
    const { id } = req.params;
    if (!id) {
      throw new Error("Note ID is required");
    }
    const clientId = (req.headers["x-client-id"] as string) || "";

    await NoteService.deleteNote(userId, id, clientId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
