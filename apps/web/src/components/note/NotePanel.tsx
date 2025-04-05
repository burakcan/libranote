interface NotePanelProps {
  noteId: string;
}

export function NotePanel(props: NotePanelProps) {
  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1">{props.noteId}</div>
    </div>
  );
}
