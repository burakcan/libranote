export type ThemeModeSetting = {
  key: "appearance.themeMode";
  value: "light" | "dark" | "system";
};

export type DarkThemeSetting = {
  key: "appearance.darkTheme";
  value: string;
};

export type LightThemeSetting = {
  key: "appearance.lightTheme";
  value: string;
};

export type HeadingFontFamilySetting = {
  key: "appearance.headingFontFamily";
  value: string;
};

export type ContentFontFamilySetting = {
  key: "appearance.contentFontFamily";
  value: string;
};

export type CodeFontFamilySetting = {
  key: "appearance.codeFontFamily";
  value: string;
};

export type LineHeightSetting = {
  key: "appearance.lineHeight";
  value: number;
};

export type FontSizeSetting = {
  key: "appearance.fontSize";
  value: "small" | "medium" | "large";
};

export type NoteFontSizeSetting = {
  key: "appearance.noteFontSize";
  value: "small" | "medium" | "large";
};

export type NoteLineHeightSetting = {
  key: "appearance.noteLineHeight";
  value: number;
};

export type SyncSettingsEnabledSetting = {
  key: "sync.syncSettingsEnabled";
  value: boolean;
};

export type Setting =
  | ThemeModeSetting
  | DarkThemeSetting
  | LightThemeSetting
  | HeadingFontFamilySetting
  | ContentFontFamilySetting
  | CodeFontFamilySetting
  | LineHeightSetting
  | FontSizeSetting
  | NoteFontSizeSetting
  | NoteLineHeightSetting
  | SyncSettingsEnabledSetting;
