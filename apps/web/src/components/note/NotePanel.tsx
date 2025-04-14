import { useStore } from "@/hooks/useStore";
import { NoteEditor } from "../noteEditor/NoteEditor";

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
