import { createContext, useEffect, useRef, useState } from "react";
import { useJWT } from "@/hooks/useJWT";
import { useNetworkStatusContext } from "@/hooks/useNetworkStatusContext";
import { useStore, useStoreInstance } from "@/hooks/useStore";
import { ActionQueueRepository } from "@/services/db/ActionQueueRepository";
import { CollectionRepository } from "@/services/db/CollectionRepository";
import { NoteRepository } from "@/services/db/NoteRepository";
import { NoteYDocStateRepository } from "@/services/db/NoteYDocStateRepository";
import { SettingRepository } from "@/services/db/SettingRepository";
import {
  SYNCED_EVENT,
  SYNCING_EVENT,
  SyncService,
} from "@/services/sync/SyncService";

interface SyncContextType {
  syncService: SyncService | null;
  isSyncing: boolean;
  isSynced: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const SyncContext = createContext<SyncContextType>({
  syncService: null,
  isSyncing: false,
  isSynced: false,
});

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const store = useStoreInstance();
  const { networkService } = useNetworkStatusContext();
  const syncServiceRef = useRef<SyncService | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const setJWT = useStore((state) => state.setJWT);

  const { data: jwt } = useJWT();

  useEffect(() => {
    setJWT(jwt || "");
  }, [jwt, setJWT]);

  useEffect(() => {
    const handleSyncing = () => {
      setIsSyncing(true);
    };

    const handleSynced = () => {
      setIsSyncing(false);
      setIsSynced(true);
    };

    async function initializeServices() {
      if (syncServiceRef.current || !networkService) {
        return;
      }

      const syncService = new SyncService(store, networkService, {
        collection: CollectionRepository,
        note: NoteRepository,
        noteYDocState: NoteYDocStateRepository,
        actionQueue: ActionQueueRepository,
        setting: SettingRepository,
      });
      syncServiceRef.current = syncService;

      // Add to window for debugging
      (window as unknown as { syncService: SyncService }).syncService =
        syncService;

      syncService.addEventListener(SYNCING_EVENT, handleSyncing);
      syncService.addEventListener(SYNCED_EVENT, handleSynced);
    }

    initializeServices();

    return () => {
      syncServiceRef.current?.removeEventListener(SYNCING_EVENT, handleSyncing);
      syncServiceRef.current?.removeEventListener(SYNCED_EVENT, handleSynced);
      syncServiceRef.current = null;
    };
  }, [store, networkService]);

  return (
    <SyncContext.Provider
      value={{
        syncService: syncServiceRef.current,
        isSyncing,
        isSynced,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}
