import { CLIENT_ID } from "./clientId";
import {
  ClientCollection,
  ClientCollectionMember,
  ClientNote,
  ServerCollection,
  ServerNote,
  ServerNoteYDocState,
} from "@/types/Entities";

const API_URL = import.meta.env.VITE_API_URL;

export interface ApiServiceError extends Error {
  status: number;
}

export class ApiService {
  static async fetch(
    path: string,
    options: RequestInit = {}
  ): Promise<Response> {
    try {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
          ...options.headers,
          "Content-Type": "application/json",
          "x-client-id": CLIENT_ID,
        },
      });

      if (!response.ok) {
        const error = new Error(response.statusText) as ApiServiceError;
        error.status = response.status;

        throw error;
      }

      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async createCollection(
    collection: ClientCollection
  ): Promise<ServerCollection> {
    const response = await this.fetch("/api/collections", {
      method: "POST",
      body: JSON.stringify({ collection }),
    });

    const data: { collection: ServerCollection } = await response.json();

    return data.collection;
  }

  static async updateCollection(
    collection: ClientCollection
  ): Promise<ServerCollection> {
    const response = await this.fetch(`/api/collections/${collection.id}`, {
      method: "PUT",
      body: JSON.stringify({ collection }),
    });

    const data: { collection: ServerCollection } = await response.json();

    return data.collection;
  }

  static async deleteCollection(collectionId: string): Promise<void> {
    await this.fetch(`/api/collections/${collectionId}`, {
      method: "DELETE",
    });
  }

  static async createNote(note: ClientNote): Promise<ServerNote> {
    const response = await this.fetch("/api/notes", {
      method: "POST",
      body: JSON.stringify({ note }),
    });

    const data: { note: ServerNote } = await response.json();

    return data.note;
  }

  static async deleteNote(noteId: string): Promise<void> {
    await this.fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
    });
  }

  static async fetchCollection(
    collectionId: string
  ): Promise<ServerCollection> {
    const response = await this.fetch(`/api/collections/${collectionId}`);

    const data: { collection: ServerCollection } = await response.json();

    return data.collection;
  }

  static async fetchAllCollections(): Promise<ServerCollection[]> {
    const response = await this.fetch("/api/collections");

    const data: { collections: ServerCollection[] } = await response.json();

    return data.collections;
  }

  static async fetchAllNotes(): Promise<ServerNote[]> {
    const response = await this.fetch("/api/notes");

    const data: { notes: ServerNote[] } = await response.json();

    return data.notes;
  }

  static async fetchAllYDocStates(): Promise<ServerNoteYDocState[]> {
    const response = await this.fetch("/api/ydocstates");

    const data: { ydocStates: ServerNoteYDocState[] } = await response.json();

    return data.ydocStates;
  }

  static async getCollectionMembers(
    collectionId: string
  ): Promise<ClientCollectionMember[]> {
    const response = await this.fetch(
      `/api/collections/${collectionId}/members`
    );

    const data: { members: ClientCollectionMember[] } = await response.json();

    return data.members;
  }

  static async inviteCollectionMember(
    collectionId: string,
    email: string,
    role: ClientCollectionMember["role"]
  ): Promise<ClientCollectionMember> {
    const response = await this.fetch(
      `/api/collections/${collectionId}/members/invite`,
      {
        method: "POST",
        body: JSON.stringify({ email, role }),
      }
    );

    const data: { member: ClientCollectionMember } = await response.json();

    return data.member;
  }

  static async removeCollectionMember(
    collectionId: string,
    userId: string
  ): Promise<void> {
    await this.fetch(`/api/collections/${collectionId}/members/${userId}`, {
      method: "DELETE",
    });
  }

  static async updateMemberRole(
    collectionId: string,
    userId: string,
    role: ClientCollectionMember["role"]
  ): Promise<ClientCollectionMember> {
    const response = await this.fetch(
      `/api/collections/${collectionId}/members/${userId}/role`,
      {
        method: "PUT",
        body: JSON.stringify({ role }),
      }
    );

    const data: { member: ClientCollectionMember } = await response.json();

    return data.member;
  }
}
