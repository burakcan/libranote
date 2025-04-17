import { HocuspocusProvider } from "@hocuspocus/provider";
import { Editor } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useEditor, EditorContent, EditorOptions } from "@tiptap/react";
import { debounce } from "es-toolkit";
import { RefObject, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { useShallow } from "zustand/react/shallow";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { useStore } from "@/hooks/useStore";
import { IndexeddbPersistence } from "@/lib/db/yIndexedDb";
import { hocuspocusSocket } from "@/lib/hocusPocusSocket";
import { SearchService } from "@/lib/SearchService";
import { getUserColors } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { baseExtensions } from "./baseExtensions";
import { EditorStatusBar } from "./EditorStatusBar";
import EditorToolbar from "./EditorToolbar";
import { LinkBubbleMenu } from "./LinkBubbleMenu";
import { ClientNote } from "@/types/Entities";

interface NoteEditorProps {
  noteId: string;
}

const debouncedOnUpdate = debounce(
  (
    editor: RefObject<Editor | null>,
    note: RefObject<ClientNote | null>,
    updateNote: RefObject<((note: ClientNote) => Promise<void>) | null>
  ) => {
    if (!editor.current || !note.current || !updateNote.current) return;

    const json = editor.current.getJSON();
    const text = editor.current.getText();

    const title = json?.content?.[0]?.content?.[0]?.text || "";
    const description =
      text
        .replace(title, "")
        .split("\n")
        .find((line: string) => line.trim() !== "")
        ?.slice(0, 75) || "";

    if (
      title !== note.current.title ||
      description !== (note.current.description || "")
    ) {
      updateNote.current({
        ...note.current,
        title: title || "",
        description: description || "",
      });
    }

    SearchService.updateNoteFromYDoc(note.current.id);
  },
  1000
);

export function NoteEditor(props: NoteEditorProps) {
  const { noteId } = props;
  const { note, updateNote } = useStore(
    useShallow((state) => {
      return {
        note: state.notes.data.find((note) => note.id === noteId),
        updateNote: state.notes.updateNote,
      };
    })
  );
  const noteRef = useRef<ClientNote | null>(null);
  noteRef.current = note || null;

  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const sessionData = useSessionQuery();

  const editorRef = useRef<Editor | null>(null);

  const updateNoteRef = useRef<typeof updateNote | null>(null);
  updateNoteRef.current = updateNote;

  const editor = useEditor(
    {
      onUpdate: ({ editor }) => {
        if (!note || !yDoc || !provider) return;
        editorRef.current = editor;

        debouncedOnUpdate(editorRef, noteRef, updateNoteRef);
      },
      extensions: [
        ...baseExtensions,
        ...(yDoc ? [Collaboration.configure({ document: yDoc })] : []),
        ...(provider
          ? [
              CollaborationCursor.configure({
                provider,
                user: {
                  name: sessionData.data?.user?.name,
                  id: sessionData.data?.user?.id,
                  color: getUserColors(sessionData.data?.user?.id)[0],
                },
              }),
            ]
          : []),
      ],
      editorProps: {
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
    } satisfies Partial<EditorOptions>,
    [yDoc, provider]
  );
  editorRef.current = editor;

  useEffect(() => {
    const doc = new Y.Doc({
      gc: true,
    });

    setYDoc(doc);

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

  return (
    <div className="flex flex-col flex-1">
      <EditorToolbar editor={editor} />

      {!note || !editor || !provider || !yDoc ? (
        <div className="h-full" />
      ) : (
        <ScrollArea className="h-full min-h-0 flex flex-col cursor-text">
          <EditorContent
            editor={editor}
            spellCheck={false}
            className="cursor-text"
            onClick={() => editor?.chain().focus().run()}
          />
        </ScrollArea>
      )}

      <LinkBubbleMenu editor={editor} />
      <EditorStatusBar editor={editor} note={note || null} />
    </div>
  );
}
