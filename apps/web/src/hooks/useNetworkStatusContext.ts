import { useContext } from "react";
import { NetworkStatusContext } from "@/components/providers/NetworkStatusProvider";

export function useNetworkStatusContext() {
  return useContext(NetworkStatusContext);
}
