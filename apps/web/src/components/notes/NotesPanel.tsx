import { FilterIcon } from "lucide-react";
import { Button } from "../ui/button";
import { CreateNoteButton } from "./CreateNoteButton";
import { NoteList } from "./NoteList";

export function NotesPanel() {
  return (
    <aside className="w-96 flex flex-col border-r border-sidebar-border/70 bg-sidebar">
      <div className="p-4 h-14 flex justify-between items-center">
        <h2 className="text-base font-medium">Notes</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <FilterIcon className="w-4 h-4" />
          </Button>
          <CreateNoteButton />
        </div>
      </div>
      <NoteList />
    </aside>
  );
}
