import { HocuspocusProvider } from "@hocuspocus/provider";
import { HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { useEffect, useState } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "@/services/db/yIndexedDb";

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

  useEffect(() => {
    const doc = new Y.Doc({
      gc: true,
    });

    const persistence = new IndexeddbPersistence(noteId, doc);

    let newProvider: HocuspocusProvider | null = null;

    persistence.whenSynced
      .then(() => {
        console.info("NoteEditor: Creating provider");

        newProvider = new HocuspocusProvider({
          websocketProvider: hocuspocusSocket,
          document: doc,
          name: noteId,
          token: "123",
        });

        setProvider(newProvider);
        setYDoc(doc);
      })
      .catch((error) => {
        console.error("NoteEditor: Error syncing persistence", error);
      });

    return () => {
      console.info("NoteEditor: Destroying provider");
      newProvider?.destroy();
      doc.destroy();
      setYDoc(null);
      setProvider(null);
    };
  }, [noteId]);

  return { yDoc, provider };
}
