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

  static whereCanSeeMembers(userId: string) {
    return {
      members: {
        some: { userId, role: { in: [CollectionMemberRole.OWNER, CollectionMemberRole.EDITOR] } },
      },
    };
  }

  static whereCanInvite(userId: string) {
    return {
      members: {
        some: { userId, role: { in: [CollectionMemberRole.OWNER] } },
      },
    };
  }

  static whereCanRemoveMember(userId: string, userIdToRemove: string) {
    if (userId === userIdToRemove) {
      return {
        members: { some: { userId } },
      };
    }

    return {
      members: { some: { userId, role: CollectionMemberRole.OWNER } },
    };
  }

  static whereCanUpdateMemberRole(userId: string) {
    return {
      members: { some: { userId, role: CollectionMemberRole.OWNER } },
    };
  }
}

/**
 * Default include object for collection queries that includes the members
 */
const collectionDefaultInclude = (userId: string) => ({
  members: {
    where: {
      userId,
    },
  },
});

export class CollectionService {
  /**
   * Get all collections for the current user (owned + member of)
   */
  static async getCollections(userId: string) {
    return prisma.collection.findMany({
      where: CollectionPermissions.whereCanView(userId),
      orderBy: { updatedAt: "desc" },
      include: collectionDefaultInclude(userId),
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
      include: collectionDefaultInclude(userId),
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
      include: collectionDefaultInclude(userId),
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
      include: collectionDefaultInclude(userId),
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

  /**
   * Get members for a collection
   */
  static async getMembers(userId: string, collectionId: string) {
    const members = await prisma.collectionMember.findMany({
      where: {
        collectionId,
        collection: CollectionPermissions.whereCanSeeMembers(userId),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return members.map((member) => ({
      id: member.id,
      userId: member.user.id,
      email: member.user.email,
      name: member.user.name,
      role: member.role,
    }));
  }

  /**
   * Invite a member to a collection
   */
  static async inviteToCollection(
    userId: string,
    collectionId: string,
    email: string,
    role: CollectionMemberRole,
    clientId: string,
  ) {
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
        ...CollectionPermissions.whereCanInvite(userId),
      },
    });

    if (!collection) {
      throw new NotFoundError("Collection not found");
    }

    const userToInvite = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToInvite) {
      throw new NotFoundError("User not found");
    }

    const newMember = await prisma.collectionMember.create({
      data: {
        id: randomUUID(),
        collectionId,
        userId: userToInvite.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    SSEService.broadcastSSEToCollectionMembers(
      collectionId,
      {
        type: "COLLECTION_MEMBER_JOINED",
        userId: newMember.userId,
        collection: collection,
      },
      userId,
      clientId,
    );

    return {
      id: newMember.id,
      userId: newMember.user.id,
      email: newMember.user.email,
      name: newMember.user.name,
      role: newMember.role,
    };
  }

  /**
   * Remove a member from a collection
   */
  static async removeMember(
    userId: string,
    collectionId: string,
    userIdToRemove: string,
    clientId: string,
  ) {
    const member = await prisma.collectionMember.findFirst({
      where: {
        userId: userIdToRemove,
        collectionId,
        collection: CollectionPermissions.whereCanRemoveMember(userId, userIdToRemove),
      },
      include: {
        collection: true,
      },
    });

    if (!member) {
      throw new NotFoundError("Member not found");
    }

    await SSEService.broadcastSSEToCollectionMembers(
      collectionId,
      {
        type: "COLLECTION_MEMBER_LEFT",
        userId: userIdToRemove,
        collection: member.collection,
      },
      userId,
      clientId,
    );

    await prisma.collectionMember.delete({
      where: {
        id: member.id,
      },
    });

    return {
      id: member.id,
      userId: member.userId,
      role: member.role,
    };
  }

  /**
   * Update a member's role in a collection
   */
  static async updateMemberRole(
    userId: string,
    collectionId: string,
    userIdToUpdate: string,
    role: CollectionMemberRole,
    clientId: string,
  ) {
    const member = await prisma.collectionMember.findFirst({
      where: {
        userId: userIdToUpdate,
        collectionId,
        collection: CollectionPermissions.whereCanUpdateMemberRole(userId),
      },
      include: {
        collection: true,
        user: true,
      },
    });

    if (!member) {
      throw new NotFoundError("Member not found");
    }

    await prisma.collectionMember.update({
      where: {
        id: member.id,
        collectionId,
        collection: CollectionPermissions.whereCanUpdateMemberRole(userId),
      },
      data: { role },
    });

    SSEService.broadcastSSEToCollectionMembers(
      collectionId,
      {
        type: "COLLECTION_MEMBER_ROLE_UPDATED",
        userId: member.userId,
        role: member.role,
        collection: member.collection,
      },
      userId,
      clientId,
    );

    return {
      id: member.id,
      userId: member.user.id,
      email: member.user.email,
      name: member.user.name,
      role: member.role,
    };
  }
}
