import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "@hocuspocus/provider";
import * as Y from "yjs";

export const hocuspocusSocket = new HocuspocusProviderWebsocket({
  url: import.meta.env.VITE_HOCUSPOCUS_URL || "",
});

new HocuspocusProvider({
  websocketProvider: hocuspocusSocket,
  document: new Y.Doc(),
  name: "keep-alive",
  token: "keep-alive",
  onStatus: (status) => {
    console.log("keep-alive provider status", status);
  },
});
