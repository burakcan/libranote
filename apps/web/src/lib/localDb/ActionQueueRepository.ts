import { dexie } from "./dexie";
import { wrapDbOperation } from "./wrapDbOperation";

export class ActionQueueRepository {
  static async getAll(): Promise<ActionQueue.Item[]> {
    return wrapDbOperation(
      () => dexie.table<ActionQueue.Item>("actionQueue").toArray(),
      "Failed to fetch action queue items"
    );
  }

  static async getById(id: string): Promise<ActionQueue.Item | undefined> {
    return wrapDbOperation(
      () => dexie.table<ActionQueue.Item>("actionQueue").get(id),
      `Failed to fetch action queue item with ID ${id}`
    );
  }

  static async create(action: ActionQueue.Item): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.table<ActionQueue.Item>("actionQueue").add(action);
    }, `Failed to create action queue item with ID ${action.id}`);
  }

  static async update(action: ActionQueue.Item): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.table<ActionQueue.Item>("actionQueue").put(action);
    }, `Failed to update action queue item with ID ${action.id}`);
  }

  static async delete(id: string): Promise<void> {
    return wrapDbOperation(async () => {
      await dexie.table<ActionQueue.Item>("actionQueue").delete(id);
    }, `Failed to delete action queue item with ID ${id}`);
  }
}
