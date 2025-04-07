import { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import * as Y from "yjs";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { hocuspocusSocket } from "@/lib/hocusPocusSocket";

interface NoteEditorProps {
  noteId: string;
}

const extensions = [
  StarterKit.configure({
    history: false,
  }),
];

const getRandomColor = () => {
  return ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"][
    Math.floor(Math.random() * 6)
  ];
};

export function NoteEditor(props: NoteEditorProps) {
  const { noteId } = props;
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const sessionData = useSessionQuery();

  const editor = useEditor(
    {
      extensions: [
        ...extensions,
        ...(yDoc
          ? [
              Collaboration.configure({ document: yDoc }),
              CollaborationCursor.configure({
                provider,
                user: {
                  name: sessionData.data?.user?.name || "Anonymous",
                  color: getRandomColor(),
                },
              }),
            ]
          : []),
      ],
    },
    [yDoc, provider]
  );

  useEffect(() => {
    const doc = new Y.Doc();
    setYDoc(doc);

    const provider = new HocuspocusProvider({
      websocketProvider: hocuspocusSocket,
      document: doc,
      name: noteId,
      token: "123",
    });

    setProvider(provider);

    return () => {
      provider?.destroy();
      doc.destroy();
      setYDoc(null);
      setProvider(null);
    };
  }, [noteId]);

  return (
    <>
      <EditorContent
        editor={editor}
        className="h-full flex flex-col overflow-x-auto cursor-text"
        onClick={() => editor?.chain().focus().run()}
      />
    </>
  );
}
