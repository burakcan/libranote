import { useEffect, useRef } from "react";
import { getDeviceOS } from "@/lib/utils";
import { useIsOnScreenKeyboardOpen } from "./useIsOnScreenKeyboardOpen";

const isIos = getDeviceOS() === "ios";

export const useIosScrollHack = () => {
  const isKeyboardOpen = useIsOnScreenKeyboardOpen();
  const isKeyboardOpenRef = useRef(isKeyboardOpen);
  isKeyboardOpenRef.current = isKeyboardOpen;

  useEffect(() => {
    const handleScroll = () => {
      if (isKeyboardOpenRef.current && isIos) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isKeyboardOpen]);
};
