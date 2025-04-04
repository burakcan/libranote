/* eslint-disable react-refresh/only-export-components */

import { type ReactNode, createContext, useRef } from "react";
import { UseBoundStore, StoreApi } from "zustand";
import { type Store, createStore } from "@/lib/store";

export type StoreInstance = UseBoundStore<StoreApi<Store>>;

export const StoreContext = createContext<StoreInstance | undefined>(undefined);

export interface StoreProviderProps {
  children: ReactNode;
  userId: string;
}

export const StoreProvider = ({ children, userId }: StoreProviderProps) => {
  const storeRef = useRef<StoreInstance | null>(null);

  if (storeRef.current === null) {
    storeRef.current = createStore({ userId });
  }

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
};
