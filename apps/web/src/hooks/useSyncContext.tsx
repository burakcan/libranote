import { useContext } from "react";
import { SyncContext } from "@/components/providers/SyncProvider";

export function useSyncContext() {
  const context = useContext(SyncContext);

  if (!context) {
    throw new Error("useSyncContext must be used within a SyncProvider");
  }

  return context;
}
