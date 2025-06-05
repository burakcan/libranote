import { CLIENT_ID } from "../lib/clientId";
import {
  ClientCollection,
  ClientCollectionInvitation,
  ClientCollectionMember,
  ClientNote,
  ServerCollection,
  ServerNote,
  ServerNoteYDocState,
} from "@/types/Entities";
import { ClientUserSetting, ServerUserSetting } from "@/types/Settings";

const API_URL = import.meta.env.VITE_API_URL;

export interface ApiServiceError extends Error {
  status: number;
  message: string;
  errorCode: string;
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

        const data = await response.json();
        error.message = data.message;
        error.errorCode = data.error;

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

  static async updateNote(note: ClientNote): Promise<ServerNote> {
    const response = await this.fetch(`/api/notes/${note.id}`, {
      method: "PUT",
      body: JSON.stringify({ note }),
    });

    const data: { note: ServerNote } = await response.json();

    return data.note;
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
    role: ClientCollectionMember["role"],
    callbackUrl: string
  ): Promise<ClientCollectionInvitation> {
    const response = await this.fetch(
      `/api/collections/${collectionId}/members/invite`,
      {
        method: "POST",
        body: JSON.stringify({ email, role, callbackUrl }),
      }
    );

    const data: { invitation: ClientCollectionInvitation } =
      await response.json();

    return data.invitation;
  }

  static async acceptCollectionInvitation(
    collectionId: string,
    invitationId: string
  ): Promise<ClientCollectionInvitation> {
    const response = await this.fetch(
      `/api/collections/${collectionId}/members/invitations/${invitationId}/accept`,
      {
        method: "POST",
      }
    );

    const data: { invitation: ClientCollectionInvitation } =
      await response.json();

    return data.invitation;
  }

  static async rejectCollectionInvitation(
    collectionId: string,
    invitationId: string
  ): Promise<void> {
    await this.fetch(
      `/api/collections/${collectionId}/members/invitations/${invitationId}/reject`,
      {
        method: "POST",
      }
    );
  }

  static async cancelCollectionInvitation(
    collectionId: string,
    invitationId: string
  ): Promise<void> {
    await this.fetch(
      `/api/collections/${collectionId}/members/invitations/${invitationId}`,
      {
        method: "DELETE",
      }
    );
  }

  static async getCollectionInvitations(
    collectionId: string
  ): Promise<ClientCollectionInvitation[]> {
    const response = await this.fetch(
      `/api/collections/${collectionId}/members/invitations`
    );

    const data: { invitations: ClientCollectionInvitation[] } =
      await response.json();

    return data.invitations;
  }

  static async getUserInvitations(): Promise<ClientCollectionInvitation[]> {
    const response = await this.fetch("/api/collections/invitations");
    const data: { invitations: ClientCollectionInvitation[] } =
      await response.json();

    return data.invitations;
  }

  static async getInvitation(
    invitationId: string
  ): Promise<ClientCollectionInvitation> {
    const response = await this.fetch(
      `/api/collections/invitations/${invitationId}`
    );

    const data: { invitation: ClientCollectionInvitation } =
      await response.json();

    return data.invitation;
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

  static async fetchAllSettings(): Promise<ServerUserSetting[]> {
    const response = await this.fetch("/api/settings");

    const data: { settings: ServerUserSetting[] } = await response.json();

    return data.settings;
  }

  static async updateSetting(
    setting: ClientUserSetting
  ): Promise<ServerUserSetting> {
    const response = await this.fetch(`/api/settings/${setting.key}`, {
      method: "PUT",
      body: JSON.stringify({ setting }),
    });

    const data: { setting: ServerUserSetting } = await response.json();

    return data.setting;
  }

  static async triggerClientSessionRefresh(): Promise<void> {
    await this.fetch("/api/settings/trigger-session-refresh", {
      method: "POST",
    });
  }

  static async getJWT(): Promise<string> {
    const response = await this.fetch("/api/auth/token");

    const data: { token: string } = await response.json();

    return data.token;
  }
}
