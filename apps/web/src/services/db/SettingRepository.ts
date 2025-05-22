import { userDatabaseService } from "./userDatabaseService";
import { wrapDbOperation } from "./wrapDbOperation";
import { ISettingRepository } from "@/types/Repositories";
import { ClientUserSetting } from "@/types/Settings";

export const SettingRepository = new (class implements ISettingRepository {
  async getAll(): Promise<ClientUserSetting[]> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      return await db.table<ClientUserSetting>("settings").toArray();
    }, "Failed to fetch all settings");
  }

  async getById(key: string): Promise<ClientUserSetting | undefined> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      return await db.table<ClientUserSetting>("settings").get(key);
    }, "Failed to fetch setting by key");
  }

  getByKey = this.getById;

  async put(setting: ClientUserSetting): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.table<ClientUserSetting>("settings").put(setting);
    }, "Failed to put setting");
  }

  async update(
    key: ClientUserSetting["key"],
    setting: Partial<ClientUserSetting>
  ): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      const existingSetting = await db
        .table<ClientUserSetting>("settings")
        .get(key);

      if (!existingSetting) {
        throw new Error(`Setting with key ${key} not found`);
      }

      await db
        .table<ClientUserSetting>("settings")
        .update(key, setting as ClientUserSetting);
    }, "Failed to update setting");
  }

  async delete(key: string): Promise<void> {
    return wrapDbOperation(async () => {
      const db = userDatabaseService.getDatabase();
      await db.table<ClientUserSetting>("settings").delete(key);
    }, "Failed to delete setting");
  }
})();
