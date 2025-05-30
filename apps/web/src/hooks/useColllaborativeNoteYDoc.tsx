import { HocuspocusProvider } from "@hocuspocus/provider";
import { HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "@/services/db/yIndexedDb";
import { useJWT } from "./useJWT";

export const hocuspocusSocket = new HocuspocusProviderWebsocket({
  url: import.meta.env.VITE_HOCUSPOCUS_URL || "",
});

export const keepAliveProvider = new HocuspocusProvider({
  websocketProvider: hocuspocusSocket,
  document: new Y.Doc(),
  name: "keep-alive",
  token: "keep-alive",
});

export function useColllaborativeNoteYDoc(noteId: string) {
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [isDocReady, setIsDocReady] = useState(false);
  const persistenceRef = useRef<IndexeddbPersistence | null>(null);
  const hasConnectedRef = useRef(false);
  const { data: jwt } = useJWT();

  // Effect for creating/destroying Y.Doc and persistence (only depends on noteId)
  useEffect(() => {
    console.info("NoteEditor: Creating Y.Doc and persistence");

    const doc = new Y.Doc({
      gc: true,
    });

    const persistence = new IndexeddbPersistence(noteId, doc);
    persistenceRef.current = persistence;

    persistence.whenSynced
      .then(() => {
        console.info("NoteEditor: Y.Doc synced with persistence");
        setYDoc(doc);
        setIsDocReady(true);
      })
      .catch((error) => {
        console.error("NoteEditor: Error syncing persistence", error);
      });

    return () => {
      console.info("NoteEditor: Destroying Y.Doc and persistence");
      doc.destroy();
      persistenceRef.current = null;
      setYDoc(null);
      setIsDocReady(false);
    };
  }, [noteId]);

  // Effect for creating/destroying provider (depends on noteId and isDocReady, but NOT jwt)
  useEffect(() => {
    if (!isDocReady || !yDoc) {
      return;
    }

    console.info("NoteEditor: Creating provider");

    const newProvider = new HocuspocusProvider({
      websocketProvider: hocuspocusSocket,
      document: yDoc,
      name: noteId,
      connect: false, // Don't connect immediately
    });

    setProvider(newProvider);
    // Reset connection state when provider changes (i.e., when noteId changes)
    hasConnectedRef.current = false;

    return () => {
      console.info("NoteEditor: Destroying provider");
      newProvider.destroy();
      setProvider(null);
      hasConnectedRef.current = false;
    };
  }, [noteId, isDocReady, yDoc]);

  // Effect for connecting once when both provider and JWT are ready
  useEffect(() => {
    if (!provider || !jwt || hasConnectedRef.current) {
      return;
    }

    console.info("NoteEditor: Connecting provider with JWT");

    // Set the token
    provider.configuration.token = jwt;

    // Connect
    provider.connect();

    // Mark as connected so we don't reconnect on JWT changes
    hasConnectedRef.current = true;

    provider.on("status", (status: unknown) => {
      console.log("NoteEditor: Provider status", status);
    });
  }, [provider, jwt]);

  return { yDoc, provider };
}
