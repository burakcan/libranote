import { Separator } from "@radix-ui/react-dropdown-menu";
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
import { useStore } from "@/hooks/useStore";
import { NoteEditor } from "../noteEditor/NoteEditor";
import { Button } from "../ui/button";

interface NotePanelProps {
  noteId: string;
}

export function NotePanel(props: NotePanelProps) {
  const note = useStore((state) =>
    state.notes.data.find((note) => note.id === props.noteId)
  );

  return (
    <div className="flex flex-col flex-1">
      {/* Editor Header */}
      {/* <div className="border-b border-border/50 p-4">
        <input
          type="text"
          className="w-full text-xl font-semibold bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground"
          placeholder="New Note"
        />
      </div> */}

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
      </div>

      <NoteEditor noteId={props.noteId} />

      {/* Status Bar */}
      <div className="border-t border-border/50 p-2 px-4 flex justify-between items-center text-xs text-muted-foreground">
        <div>
          Last edited: {note?.noteYDocState?.updatedAt.toLocaleString()}
        </div>
        <div>0 words</div>
      </div>
    </div>
  );
}
