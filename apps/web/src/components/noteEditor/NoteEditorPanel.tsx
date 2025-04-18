import { useColllaborativeNoteYDoc } from "@/hooks/useColllaborativeNoteYDoc";
import { NoteEditor } from "./NoteEditor";

interface NoteEditorPanelProps {
  noteId: string;
}

export function NoteEditorPanel(props: NoteEditorPanelProps) {
  const { noteId } = props;
  const { yDoc, provider } = useColllaborativeNoteYDoc(noteId);

  return (
    <div className="flex flex-col flex-1">
      {yDoc && provider && (
        <NoteEditor
          key={noteId}
          noteId={noteId}
          yDoc={yDoc}
          provider={provider}
        />
      )}
    </div>
  );
}
