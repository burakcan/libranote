import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/hooks/useStore";
import { useCollectionNotes } from "@/lib/store/useCollectionNotes";
import { NoteListItem } from "./NoteListItem";

export function NoteList() {
  const activeCollectionId = useStore(
    (state) => state.collections.activeCollectionId
  );
  const activeCollectionIdNotes = useCollectionNotes(activeCollectionId);

  return (
    <ScrollArea className="p-2 flex-1 min-h-0">
      {activeCollectionIdNotes.length > 0 ? (
        activeCollectionIdNotes.map((note) => (
          <NoteListItem key={note.id} note={note} />
        ))
      ) : (
        <div className="text-muted-foreground text-sm px-2 py-4">
          No notes in this collection
        </div>
      )}
    </ScrollArea>
  );
}
