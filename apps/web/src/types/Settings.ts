import { type UserSetting } from "@repo/db";
import { Setting } from "@repo/types";

export type ServerUserSetting = UserSetting;
export type ClientUserSetting = Setting & {
  updatedAt: Date;
};
