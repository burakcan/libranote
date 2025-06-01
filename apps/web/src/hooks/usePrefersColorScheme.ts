import { useEffect } from "react";

export function usePrefersColorScheme() {
  useEffect(() => {
    const handlePrefersColorSchemeChange = (event: MediaQueryListEvent) => {
      document.body.classList.toggle("dark", event.matches);
    };

    const mediaQueryList = window.matchMedia("(prefers-color-scheme: light)");

    mediaQueryList.addEventListener("change", handlePrefersColorSchemeChange);

    return () => {
      mediaQueryList.removeEventListener(
        "change",
        handlePrefersColorSchemeChange
      );
    };
  }, []);
}
