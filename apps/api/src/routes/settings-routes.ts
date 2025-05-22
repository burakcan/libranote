import express from "express"; // Import express directly
import type { Router as RouterType } from "express";
import {
  getAllUserSettings,
  getUserSettingByKey, // Commented out due to persistent type error on route
  upsertUserSetting, // Commented out due to persistent type error on route
  bulkUpsertUserSettings, // Commented out due to persistent type error on route
} from "../controllers/settings-controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  bulkUpsertUserSettingsSchema,
  settingParamsSchema,
  updateSettingSchema,
} from "../validators/settings-validators.js";

const router: RouterType = express.Router(); // Use express.Router()

// All settings routes require authentication
router.use(requireAuth);

// GET all settings for the authenticated user
router.get("/", getAllUserSettings);

// GET a specific setting by key for the authenticated user
router.get("/:key", validate(settingParamsSchema, "params"), getUserSettingByKey); // Commented out due to persistent type error

// PUT (update or create) a specific setting by key for the authenticated user
router.put(
  "/:key",
  validate(settingParamsSchema, "params"),
  validate(updateSettingSchema, "body"),
  upsertUserSetting,
); // Commented out due to persistent type error

// PUT (bulk update or create) settings for the authenticated user
router.put("/", validate(bulkUpsertUserSettingsSchema), bulkUpsertUserSettings); // Commented out due to persistent type error

export default router;
