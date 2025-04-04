import { useContext } from "react";
import { useStore as useZustandStore } from "zustand";
import { StoreInstance } from "@/components/providers/StoreProvider";
import { StoreContext } from "@/components/providers/StoreProvider";
import { Store } from "@/lib/store";

export const useStore = <T>(selector: (store: Store) => T): T => {
  const storeContext = useContext(StoreContext);

  if (!storeContext) {
    throw new Error(`useStore must be used within StoreProvider`);
  }

  return useZustandStore(storeContext, selector);
};

export const useStoreInstance = (): StoreInstance => {
  const storeContext = useContext(StoreContext);
  if (!storeContext) {
    throw new Error(`useStoreInstance must be used within StoreProvider`);
  }

  return storeContext;
};
