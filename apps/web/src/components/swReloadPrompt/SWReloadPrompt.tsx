import { useEffect } from "react";
import { toast } from "sonner";
import { useNetworkStatusContext } from "@/hooks/useNetworkStatusContext";
import { useRegisterSW } from "virtual:pwa-register/react";

function ReloadPrompt() {
  const { getIsOnline, addEventListener: addNetworkEventListener } =
    useNetworkStatusContext();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_, registration) {
      if (!registration) {
        return;
      }

      function checkForUpdates() {
        if (getIsOnline() && registration && registration.update) {
          registration.update().catch((err) => {
            console.error("Error checking for SW update:", err);
          });
        }
      }

      setInterval(checkForUpdates, 60 * 1000);
      window.addEventListener("visibilitychange", checkForUpdates);
      addNetworkEventListener("online", checkForUpdates);
    },
    onOfflineReady() {
      toast.info("App is ready to work offline");
    },
    onRegistered(r) {
      console.log("SW Registered: " + r);
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toast.info(
        "New version of the app is available, click on reload button to update.",
        {
          dismissible: false,
          duration: Infinity,
          action: {
            label: "Reload",
            onClick: () => updateServiceWorker(true),
          },
          cancel: {
            label: "Later",
            onClick: () => setNeedRefresh(false),
          },
        }
      );
    }
  }, [needRefresh, updateServiceWorker, setNeedRefresh]);

  return null;
}

export default ReloadPrompt;

// export default function SWReloadPrompt() {
//   return null;
// }
