import { useContext } from "react";
import { NetworkStatusContext } from "@/components/providers/NetworkStatusProvider";

export function useOnlineStatus() {
  return useContext(NetworkStatusContext);
}
