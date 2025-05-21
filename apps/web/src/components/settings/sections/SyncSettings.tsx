"use client";

import { RefreshCw } from "lucide-react";
import { use, useState } from "react";
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
import { SettingsSection } from "@/components/settings/SettingsSection";

const storageEstimatePromise = navigator.storage.estimate();

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export function SyncSettings() {
  const [syncStatus, setSyncStatus] = useState("synced"); // synced, syncing, offline
  const [lastSynced, setLastSynced] = useState("2023-05-19 10:45 AM");
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const storageEstimate = use(storageEstimatePromise);

  const handleSync = () => {
    setIsSyncing(true);
    setSyncStatus("syncing");

    // Simulate sync process
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus("synced");
      setLastSynced(new Date().toLocaleString());
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <SettingsSection title="Sync Status">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  syncStatus === "synced"
                    ? "bg-green-500"
                    : syncStatus === "syncing"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
              <span className="font-medium">
                Status:{" "}
                {syncStatus === "synced"
                  ? "Synced"
                  : syncStatus === "syncing"
                    ? "Syncing..."
                    : "Offline"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Last synced: {lastSynced}
            </p>
          </div>

          <Button
            onClick={handleSync}
            disabled={isSyncing || syncStatus === "offline"}
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

      <SettingsSection title="Offline Data Management">
        <div className="space-y-4">
          <p className="text-sm">
            Local storage used:{" "}
            <span className="font-medium">
              {formatBytes(storageEstimate.usage ?? 0)} /{" "}
              {formatBytes(storageEstimate.quota ?? 0)}
            </span>
          </p>

          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setClearCacheDialogOpen(true)}
            >
              Clear Local Cache
            </Button>
            <Button
              variant="outline"
              onClick={() => setClearCacheDialogOpen(true)}
            >
              Rebuild Search Index
            </Button>
          </div>
        </div>
      </SettingsSection>

      <AlertDialog
        open={clearCacheDialogOpen}
        onOpenChange={setClearCacheDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear local cache?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all locally stored data. Any unsynced changes
              will be lost. Make sure you have synced your data before
              proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
            >
              Clear Cache
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
