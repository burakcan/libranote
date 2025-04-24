import { useBreakpointSM } from "@/hooks/useBreakpointSM";
import { CreateNoteButton } from "./CreateNoteButton";
import { NoteList } from "./NoteList";
import { NotesMobileHeader } from "./NotesMobileHeader";

export function NotesPanel() {
  const isMobile = useBreakpointSM();

  return (
    <aside className="w-full sm:w-96 flex flex-col border-r border-sidebar-border/70 bg-sidebar">
      {!isMobile ? (
        <div className="flex p-4 h-14 justify-between items-center border-b border-sidebar-border/70">
          <h2 className="text-base font-medium">Notes</h2>
          <div className="flex items-center gap-2">
            <CreateNoteButton />
          </div>
        </div>
      ) : (
        <>
          <NotesMobileHeader />
          <CreateNoteButton floating />
        </>
      )}
      <NoteList />
    </aside>
  );
}
