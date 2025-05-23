import { LucideUser, PaintBucket, RefreshCw, Shield } from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";
import type { SettingsTab } from "./types";

interface SettingsSidebarProps {
  activeTab: SettingsTab;
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
        "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-md text-left",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted"
      )}
      aria-selected={active}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

const items = [
  {
    id: "account" as const,
    label: "Account",
    icon: <LucideUser size={18} />,
  },
  {
    id: "appearance" as const,
    label: "Appearance",
    icon: <PaintBucket size={18} />,
  },
  {
    id: "sync" as const,
    label: "Sync & Network",
    icon: <RefreshCw size={18} />,
  },
  {
    id: "security" as const,
    label: "Security",
    icon: <Shield size={18} />,
  },
];

export function SettingsSidebar({
  activeTab,
  onTabChange,
}: SettingsSidebarProps) {
  return (
    <div className="w-[200px] border-r shrink-0 bg-muted/40 rounded-l-md">
      <nav className="flex flex-col gap-1 p-2">
        {items.map((item) => (
          <SidebarItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            active={activeTab === item.id}
            onClick={() => onTabChange(item.id)}
          />
        ))}
      </nav>
    </div>
  );
}
