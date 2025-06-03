import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { useSetting } from "@/hooks/useSetting";
import { useStore } from "@/hooks/useStore";
import { useSyncContext } from "@/hooks/useSyncContext";
import { useSyncBasicStatus } from "@/hooks/useSyncStatus";
import { userDatabaseService } from "@/services/db/userDatabaseService";
import { yjsDB } from "@/services/db/yIndexedDb";
import { searchService } from "@/services/SearchService";

export function SyncSettings() {
  const notes = useStore((state) => state.notes.data);
  const { syncService, isReady } = useSyncContext();
  const { isSyncing, hasError, lastSyncTime } = useSyncBasicStatus();
  const [resetCacheDialogOpen, setResetCacheDialogOpen] = useState(false);
  const { data: sessionData } = useSessionQuery();
  const { value: syncSettingsEnabled, setValue: setSyncSettingsEnabled } =
    useSetting("sync.syncSettingsEnabled");

  if (!sessionData) {
    return null;
  }

  const handleSync = async () => {
    if (!syncService) {
      toast.error("Sync service not available");
      return;
    }

    try {
      await syncService.syncAll();
      toast.success("Sync completed successfully");
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Sync failed. Please try again.");
    }
  };

  const handleRebuildSearchIndex = () => {
    const promise = searchService.rebuildSearchIndex(notes);

    toast.promise(promise, {
      loading:
        "Rebuilding search index... This may take a while depending on the size of your notes.",
      success: "Search index rebuilt successfully",
      error: "Failed to rebuild search index",
    });
  };

  const handleResetCache = async () => {
    setResetCacheDialogOpen(false);

    if (!syncService) {
      toast.error("Sync service not initialized");
      return;
    }

    const clearPromises = Promise.all([
      yjsDB.delete({ disableAutoOpen: false }),
      searchService.clearNotesIndex(),
      userDatabaseService.destroy({ disableAutoOpen: false }),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);

    toast.promise(clearPromises, {
      loading: "Resetting cache...",
      success: "Cache reset successfully",
      error: (error) =>
        `Failed to reset cache. Please submit an issue on GitHub and include the following information:\n\nError: ${error}`,
    });

    await clearPromises;
    await userDatabaseService.initialize(sessionData?.user.id);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const syncPromise = syncService.syncAll();

    toast.promise(syncPromise, {
      loading: "Syncing data...",
      success: "Data synced successfully",
      error: "Failed to sync data",
    });
  };

  // Determine sync status display
  const getSyncStatus = () => {
    if (!isReady) return { status: "offline", label: "Initializing..." };
    if (isSyncing) return { status: "syncing", label: "Syncing..." };
    if (hasError) return { status: "error", label: "Sync Error" };
    if (lastSyncTime) return { status: "synced", label: "Synced" };
    return { status: "idle", label: "Ready" };
  };

  const { status, label } = getSyncStatus();

  const formatLastSyncTime = (timestamp?: number) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <SettingsSection title="Sync Status">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  status === "synced"
                    ? "bg-green-500"
                    : status === "syncing"
                      ? "bg-blue-500"
                      : status === "error"
                        ? "bg-red-500"
                        : "bg-gray-500"
                }`}
              />
              <span className="font-medium">Status: {label}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Last synced: {formatLastSyncTime(lastSyncTime)}
            </p>
          </div>

          <Button
            onClick={handleSync}
            disabled={isSyncing || !isReady}
            className="flex items-center gap-2"
            variant="outline"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Sync Settings">
        <div className="space-y-4">
          <p className="text-sm">
            Sync your settings between devices. This only affects the syncing of
            settings, not the syncing of notes or collections.
          </p>
          <div className="flex gap-2">
            <Switch
              id="sync-settings"
              checked={syncSettingsEnabled as boolean}
              onCheckedChange={setSyncSettingsEnabled}
            />
            <Label htmlFor="sync-settings">Sync Settings</Label>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Offline Data Management">
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={() => setResetCacheDialogOpen(true)}
          >
            Reset Local Cache
          </Button>
          <Button variant="outline" onClick={handleRebuildSearchIndex}>
            Rebuild Search Index
          </Button>
        </div>
      </SettingsSection>

      <AlertDialog
        open={resetCacheDialogOpen}
        onOpenChange={setResetCacheDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset local cache?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all locally stored data and redownload the latest
              data from the server. Any unsynced changes will be lost. Make sure
              you have synced your data before proceeding.
              {!syncSettingsEnabled && (
                <span className="block mt-2">
                  Your local settings will be reset to the server values.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={handleResetCache}
            >
              Reset Cache
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
