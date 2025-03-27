import { NoteList } from "./NoteList";

export function NotesPanel() {
  return (
    <aside className="w-96 border-r border-sidebar-border overflow-y-auto bg-sidebar">
      <NoteList />
    </aside>
  );
}
