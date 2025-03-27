import { Collection, Note } from "@/lib/db/prisma";
import { ActionQueueRepository } from "./ActionQueueRepository";
import { TransactionService } from "./TransactionService";

export class LocalDataService {
  static async createCollection(
    id: string,
    title: string,
    ownerId: string
  ): Promise<string> {
    const actionId = crypto.randomUUID();
    const collection: Collection = {
      id,
      title,
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await TransactionService.createCollectionWithAction(collection, actionId);
    return actionId;
  }

  static async createNote(
    id: string,
    title: string,
    description: string,
    ownerId: string,
    collectionId: string
  ): Promise<string> {
    const actionId = crypto.randomUUID();
    const note: Note = {
      id,
      title,
      description,
      ownerId,
      collectionId,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await TransactionService.createNoteWithAction(note, actionId);
    return actionId;
  }

  static async addActionToQueue(
    actionType: ActionQueue.ItemType,
    relatedEntityId: string
  ): Promise<string> {
    const actionId = crypto.randomUUID();
    const action: ActionQueue.Item = {
      id: actionId,
      type: actionType,
      relatedEntityId,
      status: "pending",
      createdAt: new Date(),
    };

    await ActionQueueRepository.create(action);
    return actionId;
  }
}
