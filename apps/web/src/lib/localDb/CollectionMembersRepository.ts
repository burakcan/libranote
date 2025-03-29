import { CollectionMember } from "@repo/db";
import { dexie } from "./dexie";
import { wrapDbOperation } from "./wrapDbOperation";

export class CollectionMembersRepository {
  static async getAll(): Promise<CollectionMember[]> {
    return wrapDbOperation(
      () => dexie.table<CollectionMember>("collectionMembers").toArray(),
      `Failed to fetch all collection members`
    );
  }

  static async getAllByCollectionId(
    collectionId: string
  ): Promise<CollectionMember[]> {
    return wrapDbOperation(
      () =>
        dexie
          .table<CollectionMember>("collectionMembers")
          .where("collectionId")
          .equals(collectionId)
          .toArray(),
      `Failed to fetch all collection members for collection ${collectionId}`
    );
  }

  static async getAllByUserId(userId: string): Promise<CollectionMember[]> {
    return wrapDbOperation(
      () =>
        dexie
          .table<CollectionMember>("collectionMembers")
          .where("userId")
          .equals(userId)
          .toArray(),
      `Failed to fetch all collection members for user ${userId}`
    );
  }

  static async put(collectionMember: CollectionMember): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie
        .table<CollectionMember>("collectionMembers")
        .put(collectionMember);
    }, `Failed to create collection member`);
  }

  static async delete(collectionMember: CollectionMember): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie
        .table<CollectionMember>("collectionMembers")
        .delete(collectionMember.id);
    }, `Failed to delete collection member`);
  }
}
