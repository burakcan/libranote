import { HocuspocusProvider } from "@hocuspocus/provider";
import { Editor } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { Transaction } from "@tiptap/pm/state";
import { useEditor, EditorContent, EditorOptions } from "@tiptap/react";
import { debounce } from "es-toolkit";
import { RefObject, useEffect, useMemo, useRef } from "react";
import * as Y from "yjs";
import { useShallow } from "zustand/react/shallow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBreakpointSM } from "@/hooks/useBreakpointSM";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { useSetting } from "@/hooks/useSetting";
import { useStore } from "@/hooks/useStore";
import { SearchService } from "@/services/SearchService";
import { cn, getUserColors } from "@/lib/utils";
import { baseExtensions } from "./baseExtensions";
import { EditorMobileHeader } from "./EditorMobileHeader";
import { EditorStatusBar } from "./EditorStatusBar";
import EditorToolbar from "./EditorToolbar";
import { LinkBubbleMenu } from "./LinkBubbleMenu";
import { ClientNote } from "@/types/Entities";

const didTransactionChangeContent = (transaction: Transaction) => {
  const before = transaction.before;
  const after = transaction.doc;

  if (before.nodeSize !== after.nodeSize) {
    return true;
  }

  const now = performance.now();
  const result = before.textContent !== after.textContent;
  const time = performance.now() - now;
  console.info("NoteEditor: string comparison took", time, "ms");
  return result;
};

const debouncedOnUpdate = debounce(
  (
    editor: RefObject<Editor | null>,
    transaction: Transaction,
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

    const didChangeContent = didTransactionChangeContent(transaction);

    if (!didChangeContent) return;

    const json = editor.current.getJSON();
    const text = editor.current.getText();

    const title = json?.content?.[0]?.content?.[0]?.text || "";

    let description = "";

    if (json?.content?.[1]?.type === "image") {
      console.log("image");
      description = "[Image] ";
    }

    description +=
      text
        .replace(title, "")
        .split("\n")
        .find((line: string) => line.trim() !== "")
        ?.slice(0, 75) || "";

    if (
      title !== note.current.title ||
      description !== note.current.description
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

export function NoteEditor(props: {
  yDoc: Y.Doc;
  provider: HocuspocusProvider;
  noteId: string;
  setEditorReady: (ready: boolean) => void;
}) {
  const { value: fontSize } = useSetting("appearance.fontSize");
  const { value: headingFont } = useSetting("appearance.headingFontFamily");
  const { value: contentFont } = useSetting("appearance.contentFontFamily");
  const { value: codeFont } = useSetting("appearance.codeFontFamily");
  const { value: lineHeight } = useSetting("appearance.lineHeight");
  const isMobile = useBreakpointSM();
  const { yDoc, provider, noteId, setEditorReady } = props;
  const sessionData = useSessionQuery();

  const { note, updateNote } = useStore(
    useShallow((state) => {
      return {
        note: state.notes.data.find((note) => note.id === noteId),
        updateNote: state.notes.updateNote,
      };
    })
  );

  const editorRef = useRef<Editor | null>(null);
  const noteRef = useRef<ClientNote | null>(null);
  const updateNoteRef = useRef<typeof updateNote | null>(null);

  noteRef.current = note || null;
  updateNoteRef.current = updateNote || null;

  const collaborationUser = useMemo(() => {
    return {
      name: sessionData.data?.user.name,
      id: sessionData.data?.user.id,
      color: getUserColors(sessionData.data?.user.id)[0],
    };
  }, [sessionData.data]);

  const editor = useEditor(
    {
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
    } satisfies Partial<EditorOptions>,
    [collaborationUser]
  );
  editorRef.current = editor;

  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current?.isFocused) {
        editorRef.current.commands.scrollIntoView();
      }
    };

    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      {isMobile && (
        <div className="sticky top-0 z-10">
          <EditorMobileHeader editor={editor} />
        </div>
      )}

      {!isMobile && <EditorToolbar editor={editor} />}

      <ScrollArea className="flex-1 min-h-0 flex flex-col">
        <EditorContent
          editor={editor}
          spellCheck={false}
          className={cn(
            "cursor-text prose dark:prose-invert flex-auto p-4 pt-8 sm:p-16 max-w-[100ch] min-h-screen",
            {
              ["prose-base"]: fontSize === "small",
              ["prose-lg"]: fontSize === "medium",
              ["prose-xl"]: fontSize === "large",
              [`prose-headings_font-${headingFont}`]: headingFont !== "system",
              [`prose-p_font-${contentFont}`]: contentFont !== "system",
              [`prose-code_font-${codeFont}`]: codeFont !== "system",
              [`prose-pre_font-${codeFont}`]: codeFont !== "system",
            }
          )}
          style={{
            lineHeight: `${lineHeight}em`,
          }}
          onClick={() => editor?.chain().focus().run()}
        />
        <LinkBubbleMenu editor={editor} />
      </ScrollArea>

      {isMobile && (
        <div className="w-screen block sm:hidden overflow-y-hidden overflow-x-auto border-t border-border/50 bg-background">
          <EditorToolbar editor={editor} isMobile />
        </div>
      )}

      {!isMobile && <EditorStatusBar editor={editor} note={note || null} />}
    </>
  );
}
