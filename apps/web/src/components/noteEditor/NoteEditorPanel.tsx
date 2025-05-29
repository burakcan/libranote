import { useColllaborativeNoteYDoc } from "@/hooks/useColllaborativeNoteYDoc";
import { NoteEditor } from "./NoteEditor";

interface NoteEditorPanelProps {
  noteId: string;
  setEditorReady: (ready: boolean) => void;
}

export function NoteEditorPanel(props: NoteEditorPanelProps) {
  const { noteId, setEditorReady } = props;
  const { yDoc, provider } = useColllaborativeNoteYDoc(noteId);

  return (
    <div className="flex flex-col flex-1 h-full max-h-full bg-background rounded-tl-md lg:rounded-t-md shadow-lg">
      {yDoc && provider && (
        <NoteEditor
          key={noteId}
          noteId={noteId}
          yDoc={yDoc}
          provider={provider}
          setEditorReady={setEditorReady}
        />
      )}
    </div>
  );
}
