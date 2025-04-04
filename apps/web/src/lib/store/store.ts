import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createActionQueueSlice } from "./actionQueueSlice";
import { createCollectionsSlice } from "./collectionsSlice";
import { createNotesSlice } from "./notesSlice";
import { createRootSlice } from "./rootSlice";
import type { Store } from "./types";

export interface StoreInitialData {
  userId: string;
}

// The main store creator function
export const createStore = (initialData: StoreInitialData) => {
  return create<Store>()(
    devtools((...a) => ({
      ...createRootSlice(initialData)(...a),
      ...createCollectionsSlice(...a),
      ...createNotesSlice(...a),
      ...createActionQueueSlice(...a),
    }))
  );
};
