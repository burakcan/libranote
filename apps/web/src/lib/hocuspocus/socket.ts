import { HocuspocusProviderWebsocket } from "@hocuspocus/provider";

const globalForHocuspocusSocket = global as unknown as { hocuspocusSocket: HocuspocusProviderWebsocket };

export const hocuspocusSocket =
  globalForHocuspocusSocket.hocuspocusSocket || new HocuspocusProviderWebsocket({
    url: process.env.NEXT_PUBLIC_HOCUPSPOCUS_URL || "",
  });

if (process.env.NODE_ENV !== "production") globalForHocuspocusSocket.hocuspocusSocket = hocuspocusSocket;