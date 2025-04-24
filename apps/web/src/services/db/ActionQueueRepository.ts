import { userDatabaseService } from "./userDatabaseService";
import { wrapDbOperation } from "./wrapDbOperation";
import { ActionQueueItem } from "@/types/ActionQueue";

export class ActionQueueRepository {
  static async getAll(): Promise<ActionQueueItem[]> {
    return wrapDbOperation(() => {
      const db = userDatabaseService.getDatabase();
      return db.table<ActionQueueItem>("actionQueue").toArray();
    }, "Failed to fetch action queue items");
  }

  static async getById(id: string): Promise<ActionQueueItem | undefined> {
    return wrapDbOperation(() => {
      const db = userDatabaseService.getDatabase();
      return db.table<ActionQueueItem>("actionQueue").get(id);
    }, `Failed to fetch action queue item with ID ${id}`);
  }

  static async create(action: ActionQueueItem): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.table<ActionQueueItem>("actionQueue").add(action);
    }, `Failed to create action queue item with ID ${action.id}`);
  }

  static async update(
    id: string,
    updates: Partial<ActionQueueItem>
  ): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.table<ActionQueueItem>("actionQueue").update(id, updates);
    }, `Failed to update action queue item with ID ${id}`);
  }

  static async delete(id: string): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.table<ActionQueueItem>("actionQueue").delete(id);
    }, `Failed to delete action queue item with ID ${id}`);
  }
}
