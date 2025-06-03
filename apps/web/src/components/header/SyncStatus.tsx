import ReactTimeAgo from "react-time-ago";
import { useNetworkStatusContext } from "@/hooks/useNetworkStatusContext";
import { useSyncBasicStatus } from "@/hooks/useSyncStatus";
import { cn } from "@/lib/utils";

export function SyncStatus() {
  const { isOnline } = useNetworkStatusContext();
  const { isSyncing, lastSyncTime } = useSyncBasicStatus();

  return (
    <div className="flex flex-col justify-center items-end w-42">
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
          <>
            {isSyncing || !lastSyncTime ? (
              <>Syncing...</>
            ) : (
              <>
                Last synced: <ReactTimeAgo date={lastSyncTime} />
              </>
            )}
          </>
        ) : (
          "Will sync when connected"
        )}
      </div>
    </div>
  );
}
