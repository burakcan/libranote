import type { Request, Response, NextFunction } from "express";
import type { Collection } from "../db/prisma.js";
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
export async function getCollection(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new Error("Collection ID is required");
    }

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
  req: Request<{ id: string }, {}, { collection: Pick<Collection, "title" | "updatedAt"> }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { id } = req.params;
    if (!id) {
      throw new Error("Collection ID is required");
    }

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
export async function deleteCollection(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req;
    const { id } = req.params;
    if (!id) {
      throw new Error("Collection ID is required");
    }

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
export async function getMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req;
    const { id } = req.params;
    if (!id) {
      throw new Error("Collection ID is required");
    }

    const members = await CollectionService.getMembers(userId, id);
    res.status(200).json({ members });
  } catch (error) {
    next(error);
  }
}

/**
 * Invite a member to a collection
 */
export async function inviteToCollection(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req;
    const { id } = req.params;

    if (!id) {
      throw new Error("Collection ID is required");
    }

    const { email, role } = req.body;
    const clientId = (req.headers["x-client-id"] as string) || "";

    const newMember = await CollectionService.inviteToCollection(userId, id, email, role, clientId);
    res.status(201).json({ member: newMember });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove a member from a collection
 */
export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req;
    const { id, userId: userIdToRemove } = req.params;

    if (!id) {
      throw new Error("Collection ID is required");
    }

    if (!userIdToRemove) {
      throw new Error("Member ID is required");
    }

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
export async function updateMemberRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req;
    const { id, userId: userIdToUpdate } = req.params;

    if (!id) {
      throw new Error("Collection ID is required");
    }

    if (!userIdToUpdate) {
      throw new Error("Member ID is required");
    }

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
