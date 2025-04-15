import { HocuspocusProvider } from "@hocuspocus/provider";
import { Editor, Node } from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { Document } from "@tiptap/extension-document";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import {
  useEditor,
  EditorContent,
  EditorOptions,
  BubbleMenu,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { debounce } from "es-toolkit";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import { createLowlight, common } from "lowlight";
import { Check, Edit, Unlink, X } from "lucide-react";
import { RefObject, useEffect, useRef, useState } from "react";
import ReactTimeAgo from "react-time-ago";
import * as Y from "yjs";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { useStore } from "@/hooks/useStore";
import { IndexeddbPersistence } from "@/lib/db/yIndexedDb";
import { hocuspocusSocket } from "@/lib/hocusPocusSocket";
import { getUserColors } from "@/lib/utils";
import { Input } from "../ui/input";
import EditorToolbar from "./EditorToolbar";
import { OnBlurHighlight } from "./OnBlurHighlightExtension";
import { ClientNote } from "@/types/Entities";

TimeAgo.addDefaultLocale(en);

interface NoteEditorProps {
  noteId: string;
}

const lowlight = createLowlight(common);

// Document title rendering a h2
const NoteTitle = Node.create({
  name: "noteTitle",
  content: "text*",
  parseHTML: () => [{ tag: "h1" }],
  renderHTML: () => ["h1", { class: "note-title" }, 0],
});

const extensions = [
  Document.extend({
    content: "noteTitle block+",
  }),
  NoteTitle,
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "noteTitle") {
        return "Untitled note";
      }

      return "Add some content";
    },
    showOnlyCurrent: false,
  }),
  CharacterCount,
  Image.configure({
    allowBase64: true,
    HTMLAttributes: {
      class: "note-image",
    },
  }),
  Link.configure({
    openOnClick: false,
  }),
  OnBlurHighlight,
  TaskList.configure({
    HTMLAttributes: {
      class: "task-list",
    },
  }),
  TaskItem.configure({
    HTMLAttributes: {
      class: "task-item",
    },
  }),
  CodeBlockLowlight.configure({
    lowlight,
  }),
  StarterKit.configure({
    history: false,
    document: false,
    codeBlock: false,
  }),
];

new HocuspocusProvider({
  websocketProvider: hocuspocusSocket,
  document: new Y.Doc(),
  name: "keep-alive",
  token: "123",
});

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
  },
  1000
);

export function NoteEditor(props: NoteEditorProps) {
  const { noteId } = props;
  const [linkHref, setLinkHref] = useState("");
  const [showEditLink, setShowEditLink] = useState(false);
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
  const bubbleMenuRef = useRef<HTMLDivElement>(null);

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
        ...extensions,
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
    <>
      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {!note || !editor || !provider || !yDoc ? (
        <div className="h-full" />
      ) : (
        <EditorContent
          editor={editor}
          spellCheck={false}
          className="h-full flex flex-col overflow-x-auto cursor-text"
          onClick={() => editor?.chain().focus().run()}
        />
      )}

      <div ref={bubbleMenuRef}>
        {/* Bubble menu for when link is active, shows a "open link" button */}
        {editor && bubbleMenuRef.current && (
          <BubbleMenu
            shouldShow={({ editor }) => editor?.isActive("link") ?? false}
            updateDelay={0}
            editor={editor}
            tippyOptions={{
              placement: "top",
              appendTo: bubbleMenuRef.current,
              onHidden: () => setShowEditLink(false),
            }}
          >
            {showEditLink ? (
              <div className="flex items-center bg-card border gap-1 p-1 pl-3 rounded-md shadow-md">
                <Input
                  value={linkHref}
                  onChange={(e) => {
                    setLinkHref(e.target.value);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .extendMarkRange("link")
                      .setLink({ href: linkHref })
                      .run();

                    setShowEditLink(false);
                    setLinkHref("");
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowEditLink(false);
                    setLinkHref("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center bg-card border gap-1 p-1 pl-3 rounded-md shadow-md">
                <a
                  href={editor.getAttributes("link").href}
                  target="_blank"
                  className="text-card-foreground whitespace-nowrap max-w-[200px] truncate underline"
                >
                  {editor.getAttributes("link").href}
                </a>
                <div className="flex items-center gap-1 border-l pl-2 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowEditLink(true);
                      setLinkHref(editor.getAttributes("link").href);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      console.log("unlinking");
                      editor.commands.unsetLink();
                    }}
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </BubbleMenu>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-border/50 p-2 px-4 flex justify-between items-center text-xs text-muted-foreground">
        <div>
          Last edited:{" "}
          <ReactTimeAgo
            date={note?.noteYDocState?.updatedAt || new Date()}
            locale="en-US"
          />
        </div>
        <div>
          {editor?.storage.characterCount?.words()} words /{" "}
          {editor?.storage.characterCount?.characters()} characters
        </div>
      </div>
    </>
  );
}
