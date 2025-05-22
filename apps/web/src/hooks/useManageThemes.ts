import { useEffect } from "react";
import { useState } from "react";
import { useSetting } from "./useSetting";
import { useStore } from "./useStore";

export function useManageThemes() {
  const settingsInitialized = useStore(
    (state) => state.settings.initialDataLoaded
  );
  const [resolvedThemeMode, setResolvedThemeMode] = useState<"light" | "dark">(
    "light"
  );
  const { value: themeMode } = useSetting("appearance.themeMode");
  const { value: lightTheme } = useSetting("appearance.lightTheme");
  const { value: darkTheme } = useSetting("appearance.darkTheme");

  useEffect(() => {
    if (!settingsInitialized) {
      return;
    }

    if (themeMode === "system") {
      setResolvedThemeMode(
        window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark"
      );
    } else {
      setResolvedThemeMode(themeMode as "light" | "dark");
    }

    const handlePrefersColorSchemeChange = (event: MediaQueryListEvent) => {
      setResolvedThemeMode(event.matches ? "light" : "dark");
    };

    // watch for prefers-color-scheme changes
    const mediaQueryList = window.matchMedia("(prefers-color-scheme: light)");
    mediaQueryList.addEventListener("change", handlePrefersColorSchemeChange);

    return () => {
      mediaQueryList.removeEventListener(
        "change",
        handlePrefersColorSchemeChange
      );
    };
  }, [themeMode, settingsInitialized]);

  useEffect(() => {
    if (!settingsInitialized) {
      return;
    }

    // find active theme by looking at classname starting with theme-
    const currentTheme = Array.from(document.body.classList).find((className) =>
      className.startsWith("theme-")
    );

    if (currentTheme) {
      document.body.classList.remove(currentTheme);
    }

    if (resolvedThemeMode === "light") {
      document.body.classList.remove("dark");
      document.body.classList.add(`theme-${lightTheme}`);
    } else if (resolvedThemeMode === "dark") {
      document.body.classList.add("dark");
      document.body.classList.add(`theme-${darkTheme}`);
    }
  }, [resolvedThemeMode, lightTheme, darkTheme, settingsInitialized]);
}
