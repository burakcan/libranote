import { useIgnoreQuickChange } from "@/hooks/useIgnoreQuickChange";
import { useNetworkStatusContext } from "@/hooks/useNetworkStatusContext";
import { useSyncContext } from "@/hooks/useSyncContext";
import { cn } from "@/lib/utils";

export function SyncStatus() {
  const { isOnline } = useNetworkStatusContext();
  const { isSyncing } = useSyncContext();
  const deferredSyncStatus = useIgnoreQuickChange(100, isSyncing);

  return (
    <div className="flex flex-col justify-center items-end">
      <div className="flex items-center text-sm gap-2">
        {isOnline ? "Connected" : "Disconnected"}
        <div
          className={cn(
            "size-2 rounded-full",
            isOnline ? "bg-emerald-500" : "bg-rose-500"
          )}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {isOnline ? (
          <>{deferredSyncStatus ? "Syncing..." : "All up to date"}</>
        ) : (
          "Will sync when connected"
        )}
      </div>
    </div>
  );
}
