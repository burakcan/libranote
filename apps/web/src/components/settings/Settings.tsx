import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AccountSettings } from "./sections/AccountSettings";
import { AppearanceSettings } from "./sections/AppearanceSettings";
import { SecuritySettings } from "./sections/SecuritySettings";
import { SyncSettings } from "./sections/SyncSettings";
import { SettingsSidebar } from "./SettingsSidebar";
import type { SettingsTab } from "./types";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  // Reset to first tab when opening on mobile for better UX
  useEffect(() => {
    if (open) {
      setActiveTab("account");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="sr-only">
        <DialogTitle>Settings</DialogTitle>
        <DialogDescription>
          Manage your account settings and preferences.
        </DialogDescription>
      </div>
      <DialogContent className="p-0 max-w-screen! h-[90vh] max-h-[600px] w-3xl">
        <div className="flex h-full overflow-hidden">
          <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <ScrollArea className="flex-1 h-[90vh] max-h-[600px] min-h-0">
            <div className="p-6 pt-8">
              {activeTab === "account" && <AccountSettings />}
              {activeTab === "appearance" && <AppearanceSettings />}
              {activeTab === "sync" && <SyncSettings />}
              {activeTab === "security" && <SecuritySettings />}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
