import { prisma } from "../db/prisma.js";
import type { UserSetting } from "../db/prisma.js";
import { SSEService } from "./sse-service.js";

export class SettingsService {
  /**
   * Get all settings for a user.
   */
  static async getSettings(userId: string): Promise<UserSetting[]> {
    return prisma.userSetting.findMany({
      where: { userId },
    });
  }

  /**
   * Get a specific setting for a user by key.
   */
  static async getSetting(userId: string, key: string): Promise<UserSetting | null> {
    return prisma.userSetting.findUnique({
      where: { userId_key: { userId, key } },
    });
  }

  /**
   * Update or create a setting for a user.
   * If the setting already exists, it's updated. Otherwise, it's created.
   * Broadcasts an SSE event after successful update/creation.
   */
  static async upsertSetting(
    userId: string,
    key: string,
    value: any, // Prisma JSON type can be any serializable value
    clientIdToExclude?: string,
  ): Promise<UserSetting> {
    const now = new Date();
    const setting = await prisma.userSetting.upsert({
      where: { userId_key: { userId, key } },
      update: { value, updatedAt: now },
      create: { userId, key, value, updatedAt: now },
    });

    // Broadcast the change to other connected clients of the same user
    SSEService.broadcastSSEToUser(
      userId,
      {
        type: "SETTING_UPDATED",
        payload: setting,
      },
      clientIdToExclude,
    );

    return setting;
  }

  /**
   * Bulk update or create settings for a user.
   * Expects an array of settings objects, each with key and value.
   * Broadcasts an SSE event for each successfully updated/created setting.
   */
  static async bulkUpsertSettings(
    userId: string,
    settings: { key: string; value: any }[],
    clientIdToExclude?: string,
  ): Promise<UserSetting[]> {
    const results: UserSetting[] = [];
    const now = new Date();

    // Consider wrapping this in a transaction if partial failures should roll back all changes
    for (const { key, value } of settings) {
      const setting = await prisma.userSetting.upsert({
        where: { userId_key: { userId, key } },
        update: { value, updatedAt: now },
        create: { userId, key, value, updatedAt: now },
      });
      results.push(setting);

      SSEService.broadcastSSEToUser(
        userId,
        {
          type: "SETTING_UPDATED",
          payload: setting,
        },
        clientIdToExclude,
      );
    }
    return results;
  }
}
