import { useIgnoreQuickChange } from "@/hooks/useIgnoreQuickChange";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSyncContext } from "@/hooks/useSyncContext";
import { cn } from "@/lib/utils";

export function SyncStatus() {
  const isOnline = useOnlineStatus();
  const { isSyncing } = useSyncContext();
  const deferredSyncStatus = useIgnoreQuickChange(100, isSyncing);

  return (
    <div className="flex flex-col justify-center items-end">
      <div className="flex items-center text-sm gap-2">
        {isOnline ? "Online" : "Offline"}
        <div
          className={cn(
            "size-2 rounded-full",
            isOnline ? "bg-green-500" : "bg-red-500"
          )}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {isOnline ? (
          <>{deferredSyncStatus ? "Syncing..." : "All up to date"}</>
        ) : (
          "Will sync when online"
        )}
      </div>
    </div>
  );
}
