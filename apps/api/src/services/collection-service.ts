import { nanoid } from "nanoid";
import {
  CollectionMemberRole,
  prisma,
  type Collection,
  type CollectionMember,
} from "../db/prisma.js";
import { SSEService } from "./sse-service.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/errors.js";
import type {
  SSECollectionCreatedEvent,
  SSECollectionUpdatedEvent,
  SSECollectionDeletedEvent,
  SSECollectionMemberInvitedEvent,
} from "../types/sse.js";
import { emailService } from "./email/email-service.js";
import { env } from "process";

type InvitationApiResponse = {
  id: string;
  createdAt: string;
  expiresAt: string | null;
  inviterId: string;
  inviterName: string;
  inviteeEmail: string;
  collectionId: string;
  collectionTitle: string;
};

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

  static whereCanAcceptOrRejectInvitation(inviteeEmail: string) {
    return {
      inviteeEmail,
    };
  }

  static whereCanSeeInvitations(userId: string) {
    return {
      collection: CollectionPermissions.whereCanSeeMembers(userId),
    };
  }

  static whereCanCancelInvitation(userId: string) {
    return {
      collection: CollectionPermissions.whereCanInvite(userId),
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
        id: nanoid(10),
        title: collectionData.title,
        createdById: userId,
        createdAt: new Date(collectionData.createdAt),
        updatedAt: new Date(collectionData.updatedAt),
        members: {
          create: {
            id: nanoid(10),
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
    updateData: Pick<Collection, "title" | "updatedAt"> & {
      members?: (Pick<CollectionMember, "id" | "color"> & { id: string })[];
    },
    clientId: string,
  ) {
    if (updateData.members) {
      await prisma.collectionMember.update({
        where: { collectionId_userId: { collectionId, userId } },
        data: {
          color: updateData.members[0]?.color,
        },
      });
    }

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
    inviteeEmail: string,
    role: CollectionMemberRole,
    callbackUrl: string,
  ) {
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
        ...CollectionPermissions.whereCanInvite(userId),
      },
    });

    if (!collection) {
      throw new ForbiddenError("You are not authorized to invite members to this collection");
    }

    const inviter = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!inviter) {
      throw new NotFoundError("Inviter not found"); // This should never happen
    }

    if (inviteeEmail === inviter.email) {
      throw new BadRequestError(
        "You cannot invite yourself to a collection. Do you need friends? 🤔",
      );
    }

    const existingInvitation = await prisma.collectionInvitation.findFirst({
      where: {
        collectionId,
        inviteeEmail,
        expiresAt: { gte: new Date() },
      },
    });

    if (existingInvitation) {
      throw new BadRequestError("This user has already been invited to this collection");
    }

    const invitation = await prisma.collectionInvitation.create({
      data: {
        id: nanoid(10),
        collectionId,
        inviteeEmail,
        inviterId: userId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days
        role,
      },
    });

    await emailService.sendCollectionInvitationEmail({
      inviterName: inviter.name,
      collectionName: collection.title,
      invitationUrl: `${callbackUrl}?invitation=${invitation.id}`,
      appName: env.APP_NAME!,
      to: inviteeEmail,
    });

    const existingUser = await prisma.user.findUnique({
      where: { email: inviteeEmail },
    });

    const invitationPayload: SSECollectionMemberInvitedEvent["payload"] = {
      inviteeId: existingUser?.id ?? null,
      inviteeEmail: inviteeEmail,
      inviterId: userId,
      inviterName: inviter.name,
      collectionId,
      collectionTitle: collection.title,
      invitationId: invitation.id,
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt?.toISOString() ?? null,
    };

    if (existingUser) {
      SSEService.broadcastSSEToUser(existingUser.id, {
        type: "COLLECTION_MEMBER_INVITED",
        payload: invitationPayload,
      });
    }

    return invitationPayload;
  }

  static async getInvitation(userId: string, invitationId: string): Promise<InvitationApiResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const invitation = await prisma.collectionInvitation.findUnique({
      where: {
        id: invitationId,
        ...CollectionPermissions.whereCanAcceptOrRejectInvitation(user.email),
      },
      include: {
        inviter: {
          select: {
            name: true,
          },
        },
        collection: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundError("Invitation not found");
    }

    return {
      id: invitation.id,
      collectionId: invitation.collectionId,
      collectionTitle: invitation.collection.title,
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt?.toISOString() ?? null,
      inviteeEmail: invitation.inviteeEmail,
      inviterName: invitation.inviter.name,
      inviterId: invitation.inviterId,
    };
  }

  static async getCollectionInvitations(
    userId: string,
    collectionId: string,
  ): Promise<InvitationApiResponse[]> {
    // TODO: filter out expired invitations
    const invitations = await prisma.collectionInvitation.findMany({
      where: {
        collectionId,
        ...CollectionPermissions.whereCanSeeInvitations(userId),
        expiresAt: { gte: new Date() },
      },
      include: {
        inviter: {
          select: {
            name: true,
          },
        },
        collection: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return invitations.map((invitation) => ({
      id: invitation.id,
      collectionId: invitation.collectionId,
      collectionTitle: invitation.collection.title,
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt?.toISOString() ?? null,
      inviteeEmail: invitation.inviteeEmail,
      inviterName: invitation.inviter.name,
      inviterId: invitation.inviterId,
    }));
  }

  static async getUserInvitations(userId: string): Promise<InvitationApiResponse[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const invitations = await prisma.collectionInvitation.findMany({
      where: {
        ...CollectionPermissions.whereCanAcceptOrRejectInvitation(user.email),
        expiresAt: { gte: new Date() },
      },
      include: {
        collection: {
          select: {
            id: true,
            title: true,
          },
        },
        inviter: {
          select: {
            name: true,
          },
        },
      },
    });

    return invitations.map((invitation) => ({
      id: invitation.id,
      collectionId: invitation.collectionId,
      collectionTitle: invitation.collection.title,
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt?.toISOString() ?? null,
      inviteeEmail: invitation.inviteeEmail,
      inviterName: invitation.inviter.name,
      inviterId: invitation.inviterId,
    }));
  }

  static async acceptInvitation(
    userId: string,
    collectionId: string,
    invitationId: string,
    clientId: string,
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const invitation = await prisma.collectionInvitation.findUnique({
      where: {
        id: invitationId,
        collectionId,
        ...CollectionPermissions.whereCanAcceptOrRejectInvitation(user.email),
        expiresAt: { gte: new Date() },
      },
    });

    if (!invitation) {
      throw new NotFoundError("Invitation not found");
    }

    const newMember = await prisma.$transaction(async (tx) => {
      const result = await tx.collectionMember.create({
        data: {
          id: nanoid(10),
          collectionId: invitation.collectionId,
          userId,
          role: invitation.role,
        },
        include: {
          collection: {
            include: collectionDefaultInclude(userId),
          },
        },
      });

      await tx.collectionInvitation.delete({
        where: { id: invitationId },
      });

      return result;
    });

    SSEService.broadcastSSEToCollectionMembers(
      invitation.collectionId,
      {
        type: "COLLECTION_MEMBER_JOINED",
        userId,
        collection: newMember.collection,
      },
      userId,
      clientId,
    );

    return {
      id: newMember.id,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: newMember.role,
    };
  }

  static async rejectInvitation(userId: string, collectionId: string, invitationId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    await prisma.collectionInvitation.delete({
      where: {
        id: invitationId,
        collectionId,
        ...CollectionPermissions.whereCanAcceptOrRejectInvitation(user.email),
      },
    });

    return {
      id: invitationId,
    };
  }

  static async cancelInvitation(userId: string, collectionId: string, invitationId: string) {
    await prisma.collectionInvitation.delete({
      where: {
        id: invitationId,
        collectionId,
        ...CollectionPermissions.whereCanCancelInvitation(userId),
      },
    });

    return {
      id: invitationId,
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
