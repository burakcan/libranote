import { Collection, Note } from "@repo/db";
import { getStoreInstance } from "@/components/providers/StoreProvider";

// Helper: consistently fetch the client ID from the global store
function getClientIdOrThrow(): string {
  const storeState = getStoreInstance()?.getState();
  if (!storeState?.clientId) {
    throw new Error("Client ID not found");
  }
  return storeState.clientId;
}

export class ApiService {
  static async createCollection(collection: Collection): Promise<Collection> {
    const clientId = getClientIdOrThrow();
    const response = await fetch("/api/collections", {
      method: "POST",
      body: JSON.stringify({ collection, clientId }),
    });
    if (!response.ok) {
      throw new Error(
        `Failed to create collection on server: ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  }

  static async updateCollection(collection: Collection): Promise<Collection> {
    const clientId = getClientIdOrThrow();
    const response = await fetch(`/api/collections/${collection.id}`, {
      method: "PUT",
      body: JSON.stringify({ collection, clientId }),
    });
    if (!response.ok) {
      throw new Error(
        `Failed to update collection on server: ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  }

  static async deleteCollection(collectionId: string): Promise<void> {
    const clientId = getClientIdOrThrow();
    const response = await fetch(`/api/collections/${collectionId}`, {
      method: "DELETE",
      body: JSON.stringify({ clientId }),
    });
    if (!response.ok) {
      throw new Error(
        `Failed to delete collection on server: ${response.status} ${response.statusText}`
      );
    }
  }

  static async createNote(note: Note): Promise<Note> {
    const clientId = getClientIdOrThrow();
    const response = await fetch("/api/notes", {
      method: "POST",
      body: JSON.stringify({ note, clientId }),
    });
    if (!response.ok) {
      throw new Error(
        `Failed to create note on server: ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  }

  static async deleteNote(noteId: string): Promise<void> {
    const clientId = getClientIdOrThrow();
    const response = await fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
      body: JSON.stringify({ clientId }),
    });
    if (!response.ok) {
      throw new Error(
        `Failed to delete note on server: ${response.status} ${response.statusText}`
      );
    }
  }

  static async fetchAllCollections(): Promise<Collection[]> {
    const response = await fetch("/api/collections");
    if (!response.ok) {
      throw new Error(
        `Failed to fetch collections from server: ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  }

  static async fetchAllNotes(): Promise<Note[]> {
    const response = await fetch("/api/notes");
    if (!response.ok) {
      throw new Error(
        `Failed to fetch notes from server: ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  }
}
