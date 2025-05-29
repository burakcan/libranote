import { LucideUser, PaintBucket, RefreshCw, Shield } from "lucide-react";
import type { SettingsTab } from "./types";

export const SETTINGS_SECTIONS = [
  {
    id: "account" as SettingsTab,
    label: "Account",
    icon: LucideUser,
  },
  {
    id: "appearance" as SettingsTab,
    label: "Appearance",
    icon: PaintBucket,
  },
  {
    id: "sync" as SettingsTab,
    label: "Sync & Network",
    icon: RefreshCw,
  },
  {
    id: "security" as SettingsTab,
    label: "Security",
    icon: Shield,
  },
] as const;

export function getSectionInfo(sectionId: SettingsTab) {
  return SETTINGS_SECTIONS.find((section) => section.id === sectionId);
}
