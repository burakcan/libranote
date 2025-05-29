import { SettingsSidebar } from "./SettingsSidebar";
import type { SettingsTab } from "./types";

interface MobileSettingsListProps {
  onNavigateToSection: (section: SettingsTab) => void;
}

export function MobileSettingsList({
  onNavigateToSection,
}: MobileSettingsListProps) {
  return (
    <div className="flex flex-col flex-1 h-full max-h-full p-2">
      <SettingsSidebar onTabChange={onNavigateToSection} activeTab={null} />
    </div>
  );
}
