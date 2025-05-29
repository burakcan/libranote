import { AccountSettings } from "./sections/AccountSettings";
import { AppearanceSettings } from "./sections/AppearanceSettings";
import { SecuritySettings } from "./sections/SecuritySettings";
import { SyncSettings } from "./sections/SyncSettings";
import type { SettingsTab } from "./types";

interface SettingsContentProps {
  activeTab: SettingsTab;
}

export function SettingsContent({ activeTab }: SettingsContentProps) {
  switch (activeTab) {
    case "account":
      return <AccountSettings />;
    case "appearance":
      return <AppearanceSettings />;
    case "sync":
      return <SyncSettings />;
    case "security":
      return <SecuritySettings />;
    default:
      return null;
  }
}
