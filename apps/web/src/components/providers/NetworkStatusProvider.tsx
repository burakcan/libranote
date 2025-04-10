import { createContext, useEffect, useMemo, useState } from "react";
import {
  NetworkStatusService,
  ONLINE_EVENT,
  OFFLINE_EVENT,
} from "@/lib/NetworkStatusService";

export interface NetworkStatusContextType {
  isOnline: boolean;
  getIsOnline: () => boolean;
  triggerUpdate: () => void;
  addEventListener: (event: string, callback: () => void) => void;
  removeEventListener: (event: string, callback: () => void) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const NetworkStatusContext = createContext<NetworkStatusContextType>({
  isOnline: true,
  getIsOnline: () => true,
  triggerUpdate: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
});

export const NetworkStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const networkService = useMemo(() => new NetworkStatusService(), []);
  const [isOnline, setIsOnline] = useState(networkService.getIsOnline());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    networkService.addEventListener(ONLINE_EVENT, handleOnline);
    networkService.addEventListener(OFFLINE_EVENT, handleOffline);

    return () => {
      networkService.removeEventListener(ONLINE_EVENT, handleOnline);
      networkService.removeEventListener(OFFLINE_EVENT, handleOffline);
    };
  }, [networkService]);

  const contextValue = useMemo(
    () => ({
      isOnline,
      getIsOnline: networkService.getIsOnline.bind(networkService),
      triggerUpdate: networkService.triggerUpdate.bind(networkService),
      addEventListener: networkService.addEventListener.bind(networkService),
      removeEventListener:
        networkService.removeEventListener.bind(networkService),
    }),
    [isOnline, networkService]
  );

  return (
    <NetworkStatusContext.Provider value={contextValue}>
      {children}
    </NetworkStatusContext.Provider>
  );
};
