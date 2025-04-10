import { createContext, useEffect, useRef, useState } from "react";
import { useStoreInstance, useStore } from "@/hooks/useStore";
import { SYNCED_EVENT, SYNCING_EVENT, SyncService } from "@/lib/SyncService";

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

      const syncService = new SyncService(store);
      syncServiceRef.current = syncService;

      syncService.addEventListener(SYNCING_EVENT, handleSyncing);
      syncService.addEventListener(SYNCED_EVENT, handleSynced);
    }

    initializeServices();

    return () => {
      syncServiceRef.current?.removeEventListener(SYNCING_EVENT, handleSyncing);
      syncServiceRef.current?.removeEventListener(SYNCED_EVENT, handleSynced);
      syncServiceRef.current = null;
    };
  }, [store, userId]);

  return (
    <SyncContext.Provider
      value={{ syncService: syncServiceRef.current, isSyncing }}
    >
      {children}
    </SyncContext.Provider>
  );
}
