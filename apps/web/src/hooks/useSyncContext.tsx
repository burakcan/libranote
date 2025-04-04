import { useContext } from "react";
import { SyncContext } from "@/components/providers/SyncProvider";

export function useSyncContext() {
  return useContext(SyncContext);
}
