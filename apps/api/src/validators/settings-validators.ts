import { z } from "zod";
import type {
  DarkThemeSetting,
  ContentFontFamilySetting,
  HeadingFontFamilySetting,
  LightThemeSetting,
  ThemeModeSetting,
  CodeFontFamilySetting,
  LineHeightSetting,
  FontSizeSetting,
  SyncSettingsEnabledSetting,
} from "@repo/types";

type Equals<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

type NonUndefined<T> = Exclude<T, undefined>;

export type ZodInferSchema<T extends object> = {
  [Key in keyof T]-?: Equals<T[Key], NonUndefined<T[Key]>> extends false
    ?
        | z.ZodOptional<z.ZodType<NonNullable<T[Key]>>>
        | z.ZodPipeline<z.ZodOptional<z.ZodType<any>>, z.ZodType<T[Key]>>
    : z.ZodType<T[Key]> | z.ZodPipeline<z.ZodType<any>, z.ZodType<T[Key]>>;
};

export const settingParamsSchema = z.object({
  key: z.string(),
});

export const settingSchema = z.discriminatedUnion("key", [
  z.object<ZodInferSchema<ThemeModeSetting>>({
    key: z.literal("appearance.themeMode"),
    value: z.enum(["light", "dark", "system"]),
  }),
  z.object<ZodInferSchema<DarkThemeSetting>>({
    key: z.literal("appearance.darkTheme"),
    value: z.string(),
  }),
  z.object<ZodInferSchema<LightThemeSetting>>({
    key: z.literal("appearance.lightTheme"),
    value: z.string(),
  }),
  z.object<ZodInferSchema<HeadingFontFamilySetting>>({
    key: z.literal("appearance.headingFontFamily"),
    value: z.string(),
  }),
  z.object<ZodInferSchema<ContentFontFamilySetting>>({
    key: z.literal("appearance.contentFontFamily"),
    value: z.string(),
  }),
  z.object<ZodInferSchema<CodeFontFamilySetting>>({
    key: z.literal("appearance.codeFontFamily"),
    value: z.string(),
  }),
  z.object<ZodInferSchema<LineHeightSetting>>({
    key: z.literal("appearance.lineHeight"),
    value: z.number().min(1.2).max(2),
  }),
  z.object<ZodInferSchema<FontSizeSetting>>({
    key: z.literal("appearance.fontSize"),
    value: z.enum(["small", "medium", "large"]),
  }),
  z.object<ZodInferSchema<SyncSettingsEnabledSetting>>({
    key: z.literal("sync.syncSettingsEnabled"),
    value: z.boolean(),
  }),
]);

export const updateSettingSchema = z.object({
  setting: settingSchema,
});

export const bulkUpsertUserSettingsSchema = z.object({
  settings: z.array(settingSchema),
});
