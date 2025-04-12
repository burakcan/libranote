import { randomUUID } from "crypto";
import { CollectionMemberRole, prisma, type Collection } from "../db/prisma.js";
import { SSEService } from "./sse-service.js";
import { NotFoundError } from "../utils/errors.js";
import type {
  SSECollectionCreatedEvent,
  SSECollectionUpdatedEvent,
  SSECollectionDeletedEvent,
} from "../types/sse.js";

/**
 * Common permission filters used across methods
 */
export class CollectionPermissions {
  static whereCanView(userId: string) {
    return {
      members: { some: { userId } },
    };
  }

  static whereCanEdit(userId: string) {
    return {
      members: {
        some: { userId, role: { in: [CollectionMemberRole.OWNER, CollectionMemberRole.EDITOR] } },
      },
    };
  }

  static whereCanDelete(userId: string) {
    return {
      members: { some: { userId, role: CollectionMemberRole.OWNER } },
    };
  }
}

export class CollectionService {
  /**
   * Get all collections for the current user (owned + member of)
   */
  static async getCollections(userId: string) {
    return prisma.collection.findMany({
      where: CollectionPermissions.whereCanView(userId),
      orderBy: { updatedAt: "desc" },
    });
  }

  /**
   * Get a specific collection by ID
   */
  static async getCollection(userId: string, collectionId: string) {
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
        ...CollectionPermissions.whereCanView(userId),
      },
    });

    if (!collection) {
      throw new NotFoundError("Collection not found");
    }

    return collection;
  }

  /**
   * Create a new collection
   */
  static async createCollection(
    userId: string,
    collectionData: Pick<Collection, "title" | "createdAt" | "updatedAt">,
    clientId: string,
  ) {
    const newCollection = await prisma.collection.create({
      data: {
        id: randomUUID(),
        title: collectionData.title,
        createdById: userId,
        createdAt: new Date(collectionData.createdAt),
        updatedAt: new Date(collectionData.updatedAt),
        members: {
          create: {
            id: randomUUID(),
            userId,
            role: CollectionMemberRole.OWNER,
          },
        },
      },
    });

    // Broadcast event to collection members (which is just the creator at this point)
    const event: SSECollectionCreatedEvent = {
      type: "COLLECTION_CREATED",
      collection: newCollection,
    };

    SSEService.broadcastSSEToCollectionMembers(newCollection.id, event, userId, clientId);

    return newCollection;
  }

  /**
   * Update a collection
   */
  static async updateCollection(
    userId: string,
    collectionId: string,
    updateData: Pick<Collection, "title" | "updatedAt">,
    clientId: string,
  ) {
    // Update collection
    const updatedCollection = await prisma.collection.update({
      where: {
        id: collectionId,
        ...CollectionPermissions.whereCanEdit(userId),
      },
      data: {
        title: updateData.title,
        updatedAt: new Date(updateData.updatedAt),
      },
      include: {
        members: { select: { userId: true } },
      },
    });

    // Broadcast to all collection members
    const event: SSECollectionUpdatedEvent = {
      type: "COLLECTION_UPDATED",
      collection: updatedCollection,
    };

    SSEService.broadcastSSEToCollectionMembers(updatedCollection.id, event, userId, clientId);

    return updatedCollection;
  }

  /**
   * Delete a collection
   */
  static async deleteCollection(userId: string, collectionId: string, clientId: string) {
    // Find the collection with its members for notification
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
        ...CollectionPermissions.whereCanDelete(userId),
      },
      include: {
        members: {
          select: { userId: true },
        },
      },
    });

    if (!collection) {
      throw new NotFoundError("Collection not found");
    }

    // Store member IDs for notification after deletion
    const memberUserIds = collection.members.map((member) => member.userId);

    // Delete collection (Prisma will cascade delete related records)
    await prisma.collection.delete({
      where: { id: collectionId },
    });

    // Notify all members about the deletion using explicit member IDs
    // (since collection no longer exists in database)
    const notificationEvent: SSECollectionDeletedEvent = {
      type: "COLLECTION_DELETED",
      collectionId,
    };

    // Use the same pattern as in note service - pass the collection ID and event,
    // with the sender ID and client ID, but also pass the explicit member IDs
    // since the collection no longer exists in the database
    SSEService.broadcastSSEToCollectionMembers(
      collectionId,
      notificationEvent,
      userId,
      clientId,
      memberUserIds,
    );

    return collection;
  }
}
