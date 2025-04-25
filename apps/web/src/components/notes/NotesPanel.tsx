import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBreakpointSM } from "@/hooks/useBreakpointSM";
import { useCollectionListContext } from "@/hooks/useCollectionListContext";
import { CreateNoteButton } from "./CreateNoteButton";
import { NoteList } from "./NoteList";
import { NotesMobileHeader } from "./NotesMobileHeader";

export function NotesPanel() {
  const isMobile = useBreakpointSM();
  const { isSideSheetOpen, onSideSheetOpenChange } = useCollectionListContext();
  return (
    <aside className="w-full sm:w-72 2xl:w-96 flex flex-col border-r border-sidebar-border/70 bg-sidebar">
      {!isMobile ? (
        <div className="flex p-4 h-14 justify-between items-center border-b border-sidebar-border/70">
          <Button
            variant="outline"
            className="flex xl:hidden"
            onClick={() => onSideSheetOpenChange(!isSideSheetOpen)}
          >
            <Menu className="size-4" />
            Collections
          </Button>
          <h2 className="text-base font-medium hidden xl:block">Notes</h2>
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
