import { ChevronRight } from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";
import type { SettingsTab } from "./types";
import { SETTINGS_SECTIONS } from "./utils";

interface SettingsSidebarProps {
  activeTab: SettingsTab | null;
  onTabChange: (tab: SettingsTab) => void;
}

interface SidebarItemProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function SidebarItem({ label, icon, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3 text-base sm:text-sm font-medium rounded-md text-left bg-muted/40 sm:bg-transparent text-muted-foreground",
        active
          ? "bg-accent! text-accent-foreground!"
          : "text-muted-foreground hover:bg-muted"
      )}
      aria-selected={active}
    >
      {icon}
      <span>{label}</span>
      <div className="flex-1 sm:hidden" />
      <ChevronRight size={18} className="text-muted-foreground sm:hidden" />
    </button>
  );
}

export function SettingsSidebar({
  activeTab,
  onTabChange,
}: SettingsSidebarProps) {
  return (
    <div className="w-full sm:w-[200px] sm:border-r shrink-0 sm:bg-muted/40 sm:rounded-l-md">
      <nav className="flex flex-col gap-2 sm:gap-1 sm:p-2">
        {SETTINGS_SECTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarItem
              key={item.id}
              label={item.label}
              icon={<Icon size={18} />}
              active={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
            />
          );
        })}
      </nav>
    </div>
  );
}
