import {
  NoteRepository,
  LocalDataService,
} from "@/lib/local-persistence/localDb";
import { Note } from "@/lib/prisma";

/**
 * Service for note-related operations.
 * This acts as a facade over the local data service.
 */
export class NotesService {
  /**
   * Create a new note locally
   */
  static async createNote(
    title: string,
    description: string,
    ownerId: string,
    collectionId: string
  ): Promise<Note> {
    const noteId = crypto.randomUUID();

    // Create the action in local DB
    await LocalDataService.createNote(
      noteId,
      title,
      description,
      ownerId,
      collectionId
    );

    const note = {
      id: noteId,
      title,
      description,
      ownerId,
      collectionId,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return note;
  }

  /**
   * Delete a note locally
   */
  static async deleteNote(noteId: string): Promise<void> {
    await NoteRepository.delete(noteId);
  }

  /**
   * Update a note locally
   */
  static async updateNote(note: Note): Promise<void> {
    await NoteRepository.update(note);
  }

  /**
   * Get all notes, optionally filtered by collection
   */
  static async getNotes(collectionId?: string): Promise<Note[]> {
    return await NoteRepository.getAll(collectionId);
  }

  /**
   * Get a note by ID
   */
  static async getNote(id: string): Promise<Note | undefined> {
    return await NoteRepository.getById(id);
  }
}
