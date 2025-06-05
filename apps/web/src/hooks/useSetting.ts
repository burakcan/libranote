import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { DEFAULT_SETTINGS } from "@/lib/defaultSettings";
import { useStore } from "./useStore";
import { ClientUserSetting } from "@/types/Settings";

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
