import type { Request, Response, NextFunction } from "express";
import type { Collection, CollectionMember, CollectionMemberRole } from "../db/prisma.js";
import { CollectionService } from "../services/collection-service.js";

/**
 * Get all collections for the current user (owned + member of)
 */
export async function getCollections(req: Request, res: Response, next: NextFunction) {
  try {
    const collections = await CollectionService.getCollections(req.userId);
    res.status(200).json({ collections });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific collection by ID
 */
export async function getCollection(
  req: Request<{ id: string }, {}, {}>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    const collection = await CollectionService.getCollection(req.userId, id);
    res.status(200).json({ collection });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new collection
 */
export async function createCollection(
  req: Request<{}, {}, { collection: Pick<Collection, "title" | "createdAt" | "updatedAt"> }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { collection } = req.body;
    const clientId = (req.headers["x-client-id"] as string) || "";

    const newCollection = await CollectionService.createCollection(userId, collection, clientId);
    res.status(201).json({ collection: newCollection });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a collection
 */
export async function updateCollection(
  req: Request<{ id: string }, {}, { collection: Pick<Collection, "title" | "updatedAt"> }> & {
    body: {
      collection: Pick<Collection, "title" | "updatedAt"> & {
        members?: (Pick<CollectionMember, "id" | "color"> & { id: string })[];
      };
    };
  },
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { id } = req.params;

    const { collection } = req.body;
    const clientId = (req.headers["x-client-id"] as string) || "";

    const updatedCollection = await CollectionService.updateCollection(
      userId,
      id,
      collection,
      clientId,
    );

    res.status(200).json({ collection: updatedCollection });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a collection
 */
export async function deleteCollection(
  req: Request<{ id: string }, {}, {}>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { id } = req.params;

    const clientId = (req.headers["x-client-id"] as string) || "";

    await CollectionService.deleteCollection(userId, id, clientId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * Get members for a collection
 */
export async function getMembers(
  req: Request<{ id: string }, {}, {}>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { id } = req.params;

    const members = await CollectionService.getMembers(userId, id);
    res.status(200).json({ members });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove a member from a collection
 */
export async function removeMember(
  req: Request<{ id: string; userId: string }, {}, {}>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { id, userId: userIdToRemove } = req.params;

    const clientId = (req.headers["x-client-id"] as string) || "";

    await CollectionService.removeMember(userId, id, userIdToRemove, clientId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * Update a member's role in a collection
 */
export async function updateMemberRole(
  req: Request<{ id: string; userId: string }, {}, { role: CollectionMemberRole }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { id, userId: userIdToUpdate } = req.params;

    const { role } = req.body;
    const clientId = (req.headers["x-client-id"] as string) || "";

    const updatedMember = await CollectionService.updateMemberRole(
      userId,
      id,
      userIdToUpdate,
      role,
      clientId,
    );
    res.status(200).json({ member: updatedMember });
  } catch (error) {
    next(error);
  }
}

/**
 * Invite a member to a collection
 */
export async function inviteToCollection(
  req: Request<
    { id: string },
    {},
    { email: string; role: CollectionMemberRole; callbackUrl: string }
  >,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { id } = req.params;
    const { email, role, callbackUrl } = req.body;

    const invitation = await CollectionService.inviteToCollection(
      userId,
      id,
      email,
      role,
      callbackUrl,
    );

    res.status(201).json({ invitation });
  } catch (error) {
    next(error);
  }
}

/**
 * Accept an invitation to a collection
 */
export async function acceptInvitation(
  req: Request<{ id: string; invitationId: string }, {}, {}>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { id, invitationId } = req.params;
    const clientId = (req.headers["x-client-id"] as string) || "";

    const invitation = await CollectionService.acceptInvitation(userId, id, invitationId, clientId);
    res.status(200).json({ invitation });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject an invitation to a collection
 */
export async function rejectInvitation(
  req: Request<{ id: string; invitationId: string }, {}, {}>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { id, invitationId } = req.params;

    await CollectionService.rejectInvitation(userId, id, invitationId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel an invitation to a collection
 */
export async function cancelInvitation(
  req: Request<{ id: string; invitationId: string }, {}, {}>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { id, invitationId } = req.params;

    await CollectionService.cancelInvitation(userId, id, invitationId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * Get an invitation
 */
export async function getInvitation(
  req: Request<{ invitationId: string }, {}, {}>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { invitationId } = req.params;

    const invitation = await CollectionService.getInvitation(userId, invitationId);
    res.status(200).json({ invitation });
  } catch (error) {
    next(error);
  }
}

/**
 * Get invitations for a collection
 */
export async function getCollectionInvitations(
  req: Request<{ id: string }, {}, {}>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { id } = req.params;

    const invitations = await CollectionService.getCollectionInvitations(userId, id);
    res.status(200).json({ invitations });
  } catch (error) {
    next(error);
  }
}

/**
 * Get invitations for the current user
 */
export async function getUserInvitations(
  req: Request<{}, {}, {}>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req;

    const invitations = await CollectionService.getUserInvitations(userId);
    res.status(200).json({ invitations });
  } catch (error) {
    next(error);
  }
}
