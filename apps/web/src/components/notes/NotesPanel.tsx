import { CreateNoteButton } from "./CreateNoteButton";
import { NoteList } from "./NoteList";

export function NotesPanel() {
  return (
    <aside className="w-96 flex flex-col border-r border-sidebar-border/70 bg-sidebar">
      <div className="p-4 pb-2 h-16 flex justify-between items-center">
        <h2 className="text-md font-medium">Notes</h2>
        <CreateNoteButton />
      </div>
      <NoteList />
    </aside>
  );
}
