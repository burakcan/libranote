import { useEffect } from "react";

let isPaused = false;

export const useIosScrollHack = () => {
  const pause = () => {
    isPaused = true;
  };

  const resume = () => {
    isPaused = false;
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isPaused) return;

      window.scrollTo(0, 0);
      document.body.scrollTo(0, 0);
    };

    const effectTwice = () => {
      handleScroll();

      setTimeout(handleScroll, 1000);
    };

    window.addEventListener("scroll", effectTwice);
    window.addEventListener("resize", effectTwice);
    window.addEventListener("orientationchange", effectTwice);
    window.visualViewport?.addEventListener("resize", effectTwice);

    return () => {
      window.removeEventListener("scroll", effectTwice);
      window.removeEventListener("resize", effectTwice);
      window.removeEventListener("orientationchange", effectTwice);
      window.visualViewport?.removeEventListener("resize", effectTwice);
    };
  }, []);

  return { pause, resume };
};
