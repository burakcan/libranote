import type { Request, Response, NextFunction } from "express";
import { SettingsService } from "../services/settings-service.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import type { Setting } from "@repo/types";

/**
 * Get all settings for the current user.
 */
export async function getAllUserSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await SettingsService.getSettings(req.userId);
    res.status(200).json({ settings });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific setting for the current user by key.
 */
export async function getUserSettingByKey(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params;
    if (!key) {
      throw new BadRequestError("Setting key is required");
    }
    const setting = await SettingsService.getSetting(req.userId, key);
    if (!setting) {
      throw new NotFoundError("Setting not found");
    }
    res.status(200).json({ setting });
  } catch (error) {
    next(error);
  }
}

/**
 * Update or create a setting for the current user.
 */
export async function upsertUserSetting(
  req: Request<{ key: string }, {}, { setting: Setting }> & {
    body: {
      setting: Setting;
    };
  },
  res: Response,
  next: NextFunction,
) {
  try {
    const { key } = req.params;
    const { setting } = req.body;
    const clientId = req.headers["x-client-id"] as string | undefined;

    if (!key) {
      throw new BadRequestError("Setting key is required");
    }
    if (!setting) {
      throw new BadRequestError("Setting is required");
    }

    const updatedSetting = await SettingsService.upsertSetting(
      req.userId,
      key,
      setting.value,
      clientId,
    );
    res.status(200).json({ setting: updatedSetting });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk update or create settings for the current user.
 */
export async function bulkUpsertUserSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { settings } = req.body as { settings: { key: string; value: any }[] };
    const clientId = req.headers["x-client-id"] as string | undefined;

    if (!settings || !Array.isArray(settings) || settings.length === 0) {
      throw new BadRequestError("Settings array is required and cannot be empty");
    }

    // Basic validation for each setting item
    for (const s of settings) {
      if (!s.key || s.value === undefined) {
        throw new BadRequestError("Each setting in the array must have a key and a value");
      }
    }

    const updatedSettings = await SettingsService.bulkUpsertSettings(
      req.userId,
      settings,
      clientId,
    );
    res.status(200).json({ settings: updatedSettings });
  } catch (error) {
    next(error);
  }
}
