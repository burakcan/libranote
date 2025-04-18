import { HocuspocusProvider } from "@hocuspocus/provider";
import { Editor } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useEditor, EditorContent, EditorOptions } from "@tiptap/react";
import { debounce } from "es-toolkit";
import { RefObject, useRef } from "react";
import * as Y from "yjs";
import { SearchService } from "@/lib/SearchService";
import { baseExtensions } from "./baseExtensions";
import { ClientNote } from "@/types/Entities";

const debouncedOnUpdate = debounce(
  (
    editor: RefObject<Editor | null>,
    note: RefObject<ClientNote | null>,
    updateNote: RefObject<
      | ((
          update: Partial<ClientNote> & { id: ClientNote["id"] },
          noAction?: boolean
        ) => Promise<void>)
      | null
    >
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

    // Update the noteYDocState optimistically without creating an action
    updateNote.current(
      {
        id: note.current.id,
        noteYDocState: {
          ...note.current.noteYDocState,
          updatedAt: new Date(),
        },
      },
      true
    );

    SearchService.updateNoteFromYDoc(note.current.id);
  },
  1000
);

export function TestEditor(props: {
  yDoc: Y.Doc;
  provider: HocuspocusProvider;
  note: ClientNote;
  collaborationUser: {
    name: string;
    id: string;
    color: string;
  };
  onUpdateNote: (
    update: Partial<ClientNote> & { id: ClientNote["id"] },
    noAction?: boolean
  ) => Promise<void>;
}) {
  const { yDoc, provider, note, collaborationUser, onUpdateNote } = props;
  const editorRef = useRef<Editor | null>(null);
  const noteRef = useRef<ClientNote | null>(null);
  const onUpdateNoteRef = useRef<typeof onUpdateNote | null>(null);

  noteRef.current = note;
  onUpdateNoteRef.current = onUpdateNote;

  const editor = useEditor(
    {
      onUpdate: ({ editor, transaction }) => {
        console.log("transaction", transaction);
        editorRef.current = editor;

        console.log("onUpdate", editor.getJSON());

        debouncedOnUpdate(editorRef, noteRef, onUpdateNoteRef);
      },
      extensions: [
        ...baseExtensions,
        Collaboration.configure({ document: yDoc }),
        CollaborationCursor.configure({ provider, user: collaborationUser }),
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
    [yDoc, provider, collaborationUser]
  );
  editorRef.current = editor;

  return (
    <EditorContent
      editor={editor}
      spellCheck={false}
      className="cursor-text"
      onClick={() => editor?.chain().focus().run()}
    />
  );
}
