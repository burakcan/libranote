import { nanoid } from "nanoid";
import { StateCreator } from "zustand";
import { SettingRepository } from "@/services/db/SettingRepository";
import { TransactionService } from "@/services/db/TransactionService";
import { Store, InitialStoreState } from "./types";
import { P } from "./utils";
import { ClientUserSetting } from "@/types/Settings";

const initialSettingsState: InitialStoreState["settings"] = {
  initialDataLoaded: false,
  data: [
    {
      key: "sync.syncSettingsEnabled",
      value: true,
      updatedAt: new Date(),
    },
  ],
};

export const createSettingsSlice: StateCreator<
  Store,
  [],
  [],
  Pick<Store, "settings">
> = (set, get) => ({
  settings: {
    ...initialSettingsState,

    setInitialDataLoaded: (initialDataLoaded: boolean) => {
      P(set, (draft) => {
        draft.settings.initialDataLoaded = initialDataLoaded;
      });
    },

    setSettingsData: (settings) => {
      P(set, (draft) => {
        draft.settings.data = settings;
      });
    },

    setSetting: async (key, value) => {
      const state = get();
      const pendingRelatedActionIndex = state.actionQueue.items.findIndex(
        (action) =>
          action.type === "UPDATE_SETTING" &&
          action.status === "pending" &&
          action.relatedEntityId === key
      );

      const existingSettingIndex = state.settings.data.findIndex(
        (s) => s.key === key
      );

      const updatedSetting = {
        key,
        value,
        updatedAt: new Date(),
      } as ClientUserSetting;

      P(set, (draft) => {
        if (existingSettingIndex !== -1) {
          draft.settings.data[existingSettingIndex] = updatedSetting;
        } else {
          draft.settings.data.push(updatedSetting);
        }
      });

      await SettingRepository.put(updatedSetting);

      const syncSettingsEnabled = get().settings.data.find(
        (s) => s.key === "sync.syncSettingsEnabled"
      )?.value;

      if (syncSettingsEnabled && pendingRelatedActionIndex === -1) {
        await get().actionQueue.addActionToQueue({
          id: nanoid(3),
          type: "UPDATE_SETTING",
          status: "pending",
          createdAt: new Date(),
          relatedEntityId: key,
        });
      }

      if (key === "sync.syncSettingsEnabled" && value === true) {
        await get().actionQueue.addActionToQueue({
          id: nanoid(3),
          type: "SYNC_SETTINGS",
          status: "pending",
          createdAt: new Date(),
          relatedEntityId: "",
        });
      }
    },

    syncRemoteSettingsToLocal: async (remoteSettings) => {
      P(set, (draft) => {
        for (const remoteSetting of remoteSettings) {
          const localSetting = {
            key: remoteSetting.key,
            value: remoteSetting.value,
            updatedAt: remoteSetting.updatedAt,
          } as ClientUserSetting;

          const existingSettingIndex = draft.settings.data.findIndex(
            (s) => s.key === remoteSetting.key
          );

          if (existingSettingIndex !== -1) {
            draft.settings.data[existingSettingIndex] = localSetting;
          } else {
            draft.settings.data.push(localSetting);
          }
        }
      });

      await TransactionService.syncRemoteSettingsToLocal(remoteSettings);
    },

    swapSetting: async (key, remoteSetting) => {
      const clientSetting = {
        key: remoteSetting.key,
        value: remoteSetting.value,
        updatedAt: remoteSetting.updatedAt,
      } as ClientUserSetting;

      P(set, (draft) => {
        const existingSettingIndex = draft.settings.data.findIndex(
          (s) => s.key === key
        );

        if (existingSettingIndex !== -1) {
          draft.settings.data[existingSettingIndex] = clientSetting;
        } else {
          draft.settings.data.push(clientSetting);
        }
      });

      await SettingRepository.put(clientSetting);
    },
  },
});
