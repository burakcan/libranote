"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { UseBoundStore, useStore as useZustandStore, StoreApi } from "zustand";
import { type Store, createStore } from "@/lib/store";

export type StoreInstance = UseBoundStore<StoreApi<Store>>;

// Global store instance that can be accessed outside of React components
let storeInstance: StoreInstance | null = null;

export const getStoreInstance = (): StoreInstance | null => {
  return storeInstance;
};

export const StoreContext = createContext<StoreInstance | undefined>(undefined);

export interface StoreProviderProps {
  children: ReactNode;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null | undefined;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export const StoreProvider = ({ children, user }: StoreProviderProps) => {
  const storeRef = useRef<StoreInstance | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createStore({ user });
    // Set the global store instance
    storeInstance = storeRef.current;
  }

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = <T,>(selector: (store: Store) => T): T => {
  const storeContext = useContext(StoreContext);

  if (!storeContext) {
    throw new Error(`useStore must be used within StoreProvider`);
  }

  return useZustandStore(storeContext, selector);
};
