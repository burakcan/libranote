import {
  ClientCollection,
  ClientNote,
  ServerCollection,
  ServerNote,
} from "@/types/Entities";

const API_URL = import.meta.env.VITE_API_URL;

export interface ApiServiceError extends Error {
  status: number;
}

export class ApiService {
  constructor(readonly clientId: string) {}

  async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
        "x-client-id": this.clientId,
      },
    });

    if (!response.ok) {
      const error = new Error(response.statusText) as ApiServiceError;
      error.status = response.status;
      throw error;
    }

    return response;
  }

  async createCollection(
    collection: ClientCollection
  ): Promise<ServerCollection> {
    const response = await this.fetch("/api/collections", {
      method: "POST",
      body: JSON.stringify({ collection }),
    });

    const data: { collection: ServerCollection } = await response.json();

    return data.collection;
  }

  async updateCollection(
    collection: ClientCollection
  ): Promise<ServerCollection> {
    const response = await this.fetch(`/api/collections/${collection.id}`, {
      method: "PUT",
      body: JSON.stringify({ collection }),
    });

    const data: { collection: ServerCollection } = await response.json();

    return data.collection;
  }

  async deleteCollection(collectionId: string): Promise<void> {
    await this.fetch(`/api/collections/${collectionId}`, {
      method: "DELETE",
    });
  }

  async createNote(note: ClientNote): Promise<ServerNote> {
    const response = await this.fetch("/api/notes", {
      method: "POST",
      body: JSON.stringify({ note }),
    });

    const data: { note: ServerNote } = await response.json();

    return data.note;
  }

  async deleteNote(noteId: string): Promise<void> {
    await this.fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
    });
  }

  async fetchAllCollections(): Promise<ServerCollection[]> {
    const response = await this.fetch("/api/collections");

    const data: { collections: ServerCollection[] } = await response.json();

    return data.collections;
  }

  async fetchAllNotes(): Promise<ServerNote[]> {
    const response = await this.fetch("/api/notes");

    const data: { notes: ServerNote[] } = await response.json();

    return data.notes;
  }

  async getSSEEventSource(): Promise<EventSource> {
    return new EventSource(`${API_URL}/api/sse?clientId=${this}`);
  }
}
