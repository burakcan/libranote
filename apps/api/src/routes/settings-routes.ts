import express from "express";
import type { Router as RouterType } from "express";
import {
  getAllUserSettings,
  getUserSettingByKey,
  upsertUserSetting,
  bulkUpsertUserSettings,
  triggerClientSessionRefresh,
} from "../controllers/settings-controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  bulkUpsertUserSettingsSchema,
  settingParamsSchema,
  updateSettingSchema,
} from "../validators/settings-validators.js";

const router: RouterType = express.Router();

// All settings routes require authentication
router.use(requireAuth);

// GET all settings for the authenticated user
router.get("/", getAllUserSettings);

// GET a specific setting by key for the authenticated user
router.get("/:key", validate(settingParamsSchema, "params"), getUserSettingByKey);

// PUT (update or create) a specific setting by key for the authenticated user
router.put(
  "/:key",
  validate(settingParamsSchema, "params"),
  validate(updateSettingSchema, "body"),
  upsertUserSetting,
);

// PUT (bulk update or create) settings for the authenticated user
router.put("/", validate(bulkUpsertUserSettingsSchema), bulkUpsertUserSettings);

// POST (trigger a client session refresh)
router.post("/trigger-session-refresh", triggerClientSessionRefresh);

export default router;
