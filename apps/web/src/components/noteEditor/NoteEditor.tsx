import { HocuspocusProvider } from "@hocuspocus/provider";
import { Separator } from "@radix-ui/react-dropdown-menu";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Italic,
  Link,
  List,
  ListOrdered,
  Heading2,
  Heading1,
  Redo,
  Undo,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as Y from "yjs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { IndexeddbPersistence } from "@/lib/db/yIndexedDb";
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

new HocuspocusProvider({
  websocketProvider: hocuspocusSocket,
  document: new Y.Doc(),
  name: "keep-alive",
  token: "123",
});

export function NoteEditor(props: NoteEditorProps) {
  const { noteId } = props;
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const sessionData = useSessionQuery();

  const editor = useEditor(
    {
      extensions: [
        ...extensions,
        ...(yDoc ? [Collaboration.configure({ document: yDoc })] : []),
        ...(provider
          ? [
              CollaborationCursor.configure({
                provider,
                user: {
                  name: sessionData.data?.user?.name || "Anonymous",
                  id: sessionData.data?.user?.id,
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
      <div className="border-b border-border/50 p-2 flex items-center gap-1">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <Separator className="mx-1 h-6" />

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Heading2 className="h-4 w-4" />
          </Button>
        </div>

        <Separator className="mx-1 h-6" />

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Code className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Link className="h-4 w-4" />
          </Button>
        </div>

        <Separator className="mx-1 h-6" />

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <Separator className="mx-1 h-6" />

        <div className="flex flex-auto items-center justify-end gap-1">
          {editor?.storage.collaborationCursor?.users.map(
            (user: { clientId: string; name: string; color: string }) => (
              <Tooltip key={user.clientId}>
                <TooltipTrigger asChild>
                  <Avatar
                    key={user.clientId}
                    className="h-6 w-6 cursor-default"
                  >
                    <AvatarFallback
                      className="border-2 font-bold text-xs"
                      style={{ borderColor: user.color }}
                    >
                      {user.name
                        .split(" ")
                        .map((name) => name[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent className="font-semibold">
                  {user.name}
                </TooltipContent>
              </Tooltip>
            )
          )}
        </div>
      </div>

      <EditorContent
        editor={editor}
        className="h-full flex flex-col overflow-x-auto cursor-text"
        onClick={() => editor?.chain().focus().run()}
      />
    </>
  );
}
