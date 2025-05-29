import { HocuspocusProvider } from "@hocuspocus/provider";
import { Editor } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { Transaction } from "@tiptap/pm/state";
import { EditorOptions } from "@tiptap/react";
import { RefObject } from "react";
import * as Y from "yjs";
import { baseExtensions } from "../baseExtensions";
import { ClientNote } from "@/types/Entities";

type UpdateNoteFunction = (
  update: Partial<ClientNote> & { id: ClientNote["id"] },
  noAction?: boolean
) => Promise<void>;

interface CollaborationUser {
  name?: string;
  id?: string;
  color: string;
}

interface EditorConfigOptions {
  yDoc: Y.Doc;
  provider: HocuspocusProvider;
  collaborationUser: CollaborationUser;
  setEditorReady: (ready: boolean) => void;
  editorRef: RefObject<Editor | null>;
  noteRef: RefObject<ClientNote | null>;
  updateNoteRef: RefObject<UpdateNoteFunction | null>;
  debouncedOnUpdate: (
    editor: RefObject<Editor | null>,
    transaction: Transaction,
    note: RefObject<ClientNote | null>,
    updateNote: RefObject<UpdateNoteFunction | null>
  ) => void;
}

export const createEditorConfig = (
  options: EditorConfigOptions
): Partial<EditorOptions> => {
  const {
    yDoc,
    provider,
    collaborationUser,
    setEditorReady,
    editorRef,
    noteRef,
    updateNoteRef,
    debouncedOnUpdate,
  } = options;

  return {
    onCreate: () => {
      setEditorReady(true);
    },
    onUpdate: ({ editor, transaction }) => {
      editorRef.current = editor;
      debouncedOnUpdate(editorRef, transaction, noteRef, updateNoteRef);
    },
    extensions: [
      ...baseExtensions,
      Collaboration.configure({ document: yDoc }),
      CollaborationCursor.configure({
        provider,
        user: collaborationUser,
      }),
    ],
    editorProps: {
      scrollThreshold: 80,
      scrollMargin: 80,
      transformPastedHTML(html, view) {
        const { $head } = view.state.selection;

        // If the pasted content is a note title, return the content of the note title
        if ($head.parent.type.name === "noteTitle") {
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = html;
          return tempDiv.textContent || tempDiv.innerText || "";
        }

        return html;
      },
    },
  };
};
