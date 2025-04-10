import type { StateCreator } from "zustand";
import { CLIENT_ID } from "../clientId";
import type { StoreInitialData } from "./store";
import type { Store } from "./types";

export const createRootSlice =
  (
    initialData: StoreInitialData
  ): StateCreator<Store, [], [], Pick<Store, "clientId" | "userId">> =>
  () => ({
    // Generate a random clientId. This represents this specific instance of the app (so each tab has a different clientId)
    // It's ok because we don't use clientId for anything other than SSE
    // And each client is limited under user. So a user can only tamper with their own stuff.
    clientId: CLIENT_ID,
    userId: initialData.userId,
  });
