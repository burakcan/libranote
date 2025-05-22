import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "./useStore";
import { ClientUserSetting } from "@/types/Settings";

export const DEFAULT_SETTINGS: Record<string, ClientUserSetting> = {
  "appearance.themeMode": {
    key: "appearance.themeMode",
    value: "system",
    updatedAt: new Date(),
  },
  "appearance.darkTheme": {
    key: "appearance.darkTheme",
    value: "sunset",
    updatedAt: new Date(),
  },
  "appearance.lightTheme": {
    key: "appearance.lightTheme",
    value: "sunset",
    updatedAt: new Date(),
  },
};

export const useSetting = (key: ClientUserSetting["key"]) => {
  const { value, setSetting } = useStore(
    useShallow((state) => {
      const setting =
        state.settings.data.find((setting) => setting.key === key) ||
        DEFAULT_SETTINGS[key];

      return {
        value: setting.value,
        setSetting: state.settings.setSetting,
      };
    })
  );

  const setValue = useCallback(
    (newValue: typeof value) => {
      setSetting(key, newValue);
    },
    [setSetting, key]
  );

  return { value, setValue };
};
