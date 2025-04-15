import { NoteEditor } from "../noteEditor/NoteEditor";

interface NotePanelProps {
  noteId: string;
}

export function NotePanel(props: NotePanelProps) {
  return (
    <div className="flex flex-col flex-1">
      <NoteEditor noteId={props.noteId} key={props.noteId} />
    </div>
  );
}
