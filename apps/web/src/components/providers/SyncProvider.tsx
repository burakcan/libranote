import { createContext, useEffect, useRef, useState } from "react";
import { useStoreInstance, useStore } from "@/hooks/useStore";
import { ApiService } from "@/lib/ApiService";
import { databaseService } from "@/lib/db/db";
import { SyncService } from "@/lib/SyncService";

interface SyncContextType {
  syncService: SyncService | null;
  isSyncing: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const SyncContext = createContext<SyncContextType>({
  syncService: null,
  isSyncing: false,
});

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const clientId = useStore((state) => state.clientId);
  const userId = useStore((state) => state.userId);
  const store = useStoreInstance();
  const syncServiceRef = useRef<SyncService | null>(null);

  useEffect(() => {
    const handleSyncing = () => {
      setIsSyncing(true);
    };

    const handleSynced = () => {
      setIsSyncing(false);
    };
    async function initializeServices() {
      if (syncServiceRef.current) {
        return;
      }

      await databaseService.initialize(userId);
      const apiService = new ApiService(clientId);
      const syncService = new SyncService(store, apiService);
      syncServiceRef.current = syncService;

      syncService.addEventListener("syncing", handleSyncing);
      syncService.addEventListener("synced", handleSynced);
    }

    initializeServices();

    return () => {
      databaseService.cleanup();

      syncServiceRef.current?.removeEventListener("syncing", handleSyncing);
      syncServiceRef.current?.removeEventListener("synced", handleSynced);
    };
  }, [store, clientId, userId]);

  return (
    <SyncContext.Provider
      value={{ syncService: syncServiceRef.current, isSyncing }}
    >
      {children}
    </SyncContext.Provider>
  );
}
