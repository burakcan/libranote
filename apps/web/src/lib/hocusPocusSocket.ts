import { HocuspocusProviderWebsocket } from "@hocuspocus/provider";

const globalForHocuspocusSocket = globalThis as unknown as {
  hocuspocusSocket: HocuspocusProviderWebsocket;
};

export const hocuspocusSocket =
  globalForHocuspocusSocket.hocuspocusSocket ||
  new HocuspocusProviderWebsocket({
    url: import.meta.env.VITE_HOCUPSPOCUS_URL || "",
  });

if (import.meta.env.NODE_ENV !== "production")
  globalForHocuspocusSocket.hocuspocusSocket = hocuspocusSocket;
