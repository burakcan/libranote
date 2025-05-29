import { SettingsContent } from "./SettingsContent";
import type { SettingsTab } from "./types";

interface MobileSettingsSectionProps {
  section: SettingsTab;
}

export function MobileSettingsSection({ section }: MobileSettingsSectionProps) {
  return (
    <div className="flex flex-col flex-1 h-full max-h-full p-4">
      <SettingsContent activeTab={section} />
    </div>
  );
}
