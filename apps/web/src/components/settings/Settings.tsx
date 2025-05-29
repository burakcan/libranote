import { useState, useEffect } from "react";
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SettingsContent } from "./SettingsContent";
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
      <DialogContent className="p-0 max-w-screen! h-screen sm:h-[90vh] max-h-screen sm:max-h-[600px] sm:w-3xl">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Manage your account settings and preferences.
        </DialogDescription>
        <div className="flex flex-col sm:flex-row h-full overflow-hidden">
          <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <ScrollArea className="flex-1 h-[90vh] max-h-[600px] min-h-0">
            <div className="p-6 pt-8">
              <SettingsContent activeTab={activeTab} />
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
