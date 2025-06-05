import { createContext, useEffect, useRef, useState } from "react";
import { useNetworkStatusContext } from "@/hooks/useNetworkStatusContext";
import { useStoreInstance } from "@/hooks/useStore";
import { ActionQueueRepository } from "@/services/db/ActionQueueRepository";
import { CollectionRepository } from "@/services/db/CollectionRepository";
import { NoteRepository } from "@/services/db/NoteRepository";
import { NoteYDocStateRepository } from "@/services/db/NoteYDocStateRepository";
import { SettingRepository } from "@/services/db/SettingRepository";
import { SyncService } from "@/services/sync/SyncService";
import { SyncStatus } from "@/services/sync/SyncStatusManager";

interface SyncContextType {
  syncService: SyncService | null;
  status: SyncStatus;
  isReady: boolean;
  error: Error | null;
}

const defaultStatus: SyncStatus = {
  isSynced: false,
  isIdle: true,
  isSyncing: false,
  hasError: false,
  operations: new Map(),
  errors: [],
};

// eslint-disable-next-line react-refresh/only-export-components
export const SyncContext = createContext<SyncContextType>({
  syncService: null,
  status: defaultStatus,
  isReady: false,
  error: null,
});

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>(defaultStatus);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const store = useStoreInstance();
  const { networkService } = useNetworkStatusContext();
  const syncServiceRef = useRef<SyncService | null>(null);
  const statusUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    async function initializeServices() {
      // Only initialize once and when dependencies are ready
      if (syncServiceRef.current || !networkService || !store) {
        return;
      }

      try {
        console.debug("SyncProvider: Initializing sync service...");

        const syncService = new SyncService(store, networkService, {
          collection: CollectionRepository,
          note: NoteRepository,
          noteYDocState: NoteYDocStateRepository,
          actionQueue: ActionQueueRepository,
          setting: SettingRepository,
        });

        syncServiceRef.current = syncService;

        // Subscribe to status changes
        statusUnsubscribeRef.current = syncService.subscribeToStatus(setStatus);

        // Handle sync service errors
        const handleSyncError = (event: Event) => {
          const syncError = (event as CustomEvent).detail as Error;
          console.error("SyncProvider: Sync error received:", syncError);
          setError(syncError);
        };

        syncService.addEventListener("sync-error", handleSyncError);

        // Add to window for debugging
        (window as unknown as { syncService: SyncService }).syncService =
          syncService;

        setIsReady(true);
        setError(null);

        console.debug("SyncProvider: ✅ Sync service initialized successfully");
      } catch (initError) {
        const errorInstance =
          initError instanceof Error ? initError : new Error(String(initError));
        console.error(
          "SyncProvider: ❌ Failed to initialize sync service:",
          errorInstance
        );
        setError(errorInstance);
        setIsReady(false);
      }
    }

    initializeServices();

    return () => {
      console.debug("SyncProvider: Cleaning up...");

      // Unsubscribe from status updates
      if (statusUnsubscribeRef.current) {
        statusUnsubscribeRef.current();
        statusUnsubscribeRef.current = null;
      }

      // Stop sync service
      if (syncServiceRef.current) {
        try {
          syncServiceRef.current.stopSync();
        } catch (cleanupError) {
          console.error("SyncProvider: Error during cleanup:", cleanupError);
        }
        syncServiceRef.current = null;
      }

      // Reset state
      setStatus(defaultStatus);
      setIsReady(false);
      setError(null);

      // Clean up window reference
      if (typeof window !== "undefined") {
        delete (window as unknown as { syncService?: SyncService }).syncService;
      }
    };
  }, [store, networkService]);

  const contextValue: SyncContextType = {
    syncService: syncServiceRef.current,
    status,
    isReady,
    error,
  };

  return (
    <SyncContext.Provider value={contextValue}>{children}</SyncContext.Provider>
  );
}
