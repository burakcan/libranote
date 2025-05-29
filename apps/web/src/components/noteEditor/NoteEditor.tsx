import { HocuspocusProvider } from "@hocuspocus/provider";
import { Editor } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useRef } from "react";
import * as Y from "yjs";
import { useShallow } from "zustand/react/shallow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBreakpointSM } from "@/hooks/useBreakpointSM";
import { useCustomizedProseClasses } from "@/hooks/useCustomizedProseClasses";
import { useSetting } from "@/hooks/useSetting";
import { useStore } from "@/hooks/useStore";
import { cn } from "@/lib/utils";
import { EditorMobileHeader } from "./EditorMobileHeader";
import { EditorStatusBar } from "./EditorStatusBar";
import EditorToolbar from "./EditorToolbar";
import { useCollaborationUser } from "./hooks/useCollaborationUser";
import { LinkBubbleMenu } from "./LinkBubbleMenu";
import { createEditorConfig } from "./utils/editorConfig";
import { createDebouncedUpdateHandler } from "./utils/updateHandler";
import { ClientNote } from "@/types/Entities";

interface NoteEditorProps {
  yDoc: Y.Doc;
  provider: HocuspocusProvider;
  noteId: string;
  setEditorReady: (ready: boolean) => void;
}

export function NoteEditor(props: NoteEditorProps) {
  const { yDoc, provider, noteId, setEditorReady } = props;

  // Hooks
  const lineHeight = useSetting("appearance.lineHeight").value;
  const proseClasses = useCustomizedProseClasses();
  const isMobile = useBreakpointSM();
  const collaborationUser = useCollaborationUser();

  // Store data
  const { note, updateNote } = useStore(
    useShallow((state) => {
      return {
        note: state.notes.data.find((note) => note.id === noteId),
        updateNote: state.notes.updateNote,
      };
    })
  );

  // Refs for the debounced update handler
  const editorRef = useRef<Editor | null>(null);
  const noteRef = useRef<ClientNote | null>(null);
  const updateNoteRef = useRef<typeof updateNote | null>(null);

  // Keep refs current
  noteRef.current = note || null;
  updateNoteRef.current = updateNote || null;

  // Create debounced update handler
  const debouncedOnUpdate = createDebouncedUpdateHandler();

  // Create editor configuration
  const editorConfig = createEditorConfig({
    yDoc,
    provider,
    collaborationUser,
    setEditorReady,
    editorRef,
    noteRef,
    updateNoteRef,
    debouncedOnUpdate,
  });

  // Initialize editor
  const editor = useEditor(editorConfig, [collaborationUser]);
  editorRef.current = editor;

  // Handle visual viewport resize for mobile
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
            "cursor-text prose flex-auto p-4 pt-8 sm:p-16 max-w-[100ch] min-h-screen",
            proseClasses
          )}
          style={{ lineHeight: `${lineHeight}em` }}
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
