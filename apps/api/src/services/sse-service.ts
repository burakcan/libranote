import { prisma } from "../db/prisma.js";
import type { SSEEvent } from "../types/sse.js";

type UserId = string;
type ClientId = string;

// Define a simplified controller interface for SSE
interface SSEController {
  enqueue: (data: string) => void;
  close: () => void;
}

/**
 * Service for managing Server-Sent Events connections and broadcasting
 */
export class SSEService {
  private static clients = new Map<UserId, Map<ClientId, SSEController>>();

  /**
   * Add a new client connection
   */
  static addClient(userId: UserId, clientId: ClientId, controller: SSEController): ClientId {
    if (!SSEService.clients.has(userId)) {
      SSEService.clients.set(userId, new Map());
    }

    SSEService.clients.get(userId)?.set(clientId, controller);
    console.info(`Client ${clientId} connected for user ${userId}`);

    return clientId;
  }

  /**
   * Remove a client connection
   */
  static removeClient(userId: UserId, clientId: ClientId) {
    SSEService.clients.get(userId)?.delete(clientId);
    console.info(`Client ${clientId} disconnected for user ${userId}`);

    // Cleanup user entry if no clients left
    if (SSEService.clients.get(userId)?.size === 0) {
      SSEService.clients.delete(userId);
    }
  }

  /**
   * Broadcast an event to all clients for a user except the sender
   * If senderClientId is undefined, broadcasts to all clients
   */
  static broadcastSSE(userId: UserId, senderClientId: string | undefined, event: SSEEvent) {
    if (!userId) return;

    console.info(
      `Broadcasting event ${event.type} from ${senderClientId || "unknown"} to clients of user ${userId}`,
    );

    SSEService.clients.get(userId)?.forEach((controller) => {
      // Skip the sender if a senderClientId is provided
      // if (senderClientId && clientId === senderClientId) {
      //   console.info(`Skipping sender client ${senderClientId}`);
      //   return;
      // }

      controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
    });
  }

  /**
   * Send initialization event to a specific client
   */
  static sendInitEvent(userId: UserId, clientId: ClientId) {
    console.info(`Sending INIT event to client ${clientId} for user ${userId}`);
    SSEService.clients
      .get(userId)
      ?.get(clientId)
      ?.enqueue(`data: ${JSON.stringify({ type: "INIT", clientId })}\n\n`);
  }

  /**
   * Get number of connected clients for a user
   */
  static getClientCount(userId: UserId): number {
    return SSEService.clients.get(userId)?.size || 0;
  }

  /**
   * Broadcast an event to all members of a collection
   */
  static async broadcastSSEToCollectionMembers(
    collectionId: string,
    event: SSEEvent,
    senderUserId: UserId,
    senderClientId: string | undefined,
  ) {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: { members: { select: { userId: true } } },
    });

    const userIds = new Set<string>();
    const collectionMembers = collection?.members.map((member) => member.userId) || [];

    for (const userId of collectionMembers) {
      userIds.add(userId);
    }

    userIds.add(senderUserId);

    for (const userId of userIds) {
      SSEService.broadcastSSE(userId, senderClientId, event);
    }
  }

  /**
   * Broadcast an event to all collaborators of a note & the collection members of the note's collection
   */
  static async broadcastSSEToNoteCollaborators(
    noteId: string,
    event: SSEEvent,
    senderUserId: UserId,
    senderClientId: string | undefined,
  ) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        collection: {
          include: {
            members: { select: { userId: true } },
          },
        },
        noteCollaborators: { select: { userId: true } },
      },
    });

    const userIds = new Set<string>();
    const noteCollaborators =
      note?.noteCollaborators.map((collaborator) => collaborator.userId) || [];
    const collectionMembers = note?.collection?.members.map((member) => member.userId) || [];

    for (const userId of noteCollaborators) {
      userIds.add(userId);
    }

    for (const userId of collectionMembers) {
      userIds.add(userId);
    }

    userIds.add(senderUserId);

    for (const userId of userIds) {
      SSEService.broadcastSSE(userId, senderClientId, event);
    }
  }
}
