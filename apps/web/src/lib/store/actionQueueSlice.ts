import type { StateCreator } from "zustand";
import { ActionQueueRepository } from "@/services/db/ActionQueueRepository";
import type { Store, InitialStoreState } from "./types";
import { P } from "./utils";

const initialActionQueueState: InitialStoreState["actionQueue"] = {
  items: [],
};

export const createActionQueueSlice: StateCreator<
  Store,
  [],
  [],
  Pick<Store, "actionQueue">
> = (set) => ({
  actionQueue: {
    ...initialActionQueueState,

    addActionToQueue: async (action) => {
      await ActionQueueRepository.create(action);

      P(set, (draft) => {
        draft.actionQueue.items.push(action);
      });
    },

    removeActionFromQueue: async (actionId) => {
      await ActionQueueRepository.delete(actionId);

      P(set, (draft) => {
        draft.actionQueue.items = draft.actionQueue.items.filter(
          (action) => action.id !== actionId
        );
      });
    },

    setActionQueueItems: (items) =>
      P(set, (draft) => {
        draft.actionQueue.items = items;
      }),

    setActionQueueItemStatus: async (actionId, status) => {
      await ActionQueueRepository.update(actionId, { status });

      P(set, (draft) => {
        const index = draft.actionQueue.items.findIndex(
          (action) => action.id === actionId
        );

        if (index === -1) return;

        draft.actionQueue.items[index].status = status;
      });
    },
  },
});
