import { ClientUserSetting } from "@/types/Settings";

export const DEFAULT_SETTINGS: Record<string, ClientUserSetting> = {
  "appearance.themeMode": {
    key: "appearance.themeMode",
    value: "system",
    updatedAt: new Date(),
  },
  "appearance.darkTheme": {
    key: "appearance.darkTheme",
    value: "sunset",
    updatedAt: new Date(),
  },
  "appearance.lightTheme": {
    key: "appearance.lightTheme",
    value: "sunset",
    updatedAt: new Date(),
  },
  "sync.syncSettingsEnabled": {
    key: "sync.syncSettingsEnabled",
    value: true,
    updatedAt: new Date(),
  },
  "appearance.headingFontFamily": {
    key: "appearance.headingFontFamily",
    value: "system",
    updatedAt: new Date(),
  },
  "appearance.contentFontFamily": {
    key: "appearance.contentFontFamily",
    value: "system",
    updatedAt: new Date(),
  },
  "appearance.codeFontFamily": {
    key: "appearance.codeFontFamily",
    value: "system",
    updatedAt: new Date(),
  },
  "appearance.lineHeight": {
    key: "appearance.lineHeight",
    value: 1.6,
    updatedAt: new Date(),
  },
  "appearance.fontSize": {
    key: "appearance.fontSize",
    value: "medium",
    updatedAt: new Date(),
  },
};
