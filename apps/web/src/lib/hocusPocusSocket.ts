import { HocuspocusProviderWebsocket } from "@hocuspocus/provider";

export const hocuspocusSocket = new HocuspocusProviderWebsocket({
  url: import.meta.env.VITE_HOCUSPOCUS_URL || "",
});
