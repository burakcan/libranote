import { useStore } from "@/hooks/useStore";
import { useCollectionNotes } from "@/lib/store/useCollectionNotes";
import { NoteListItem } from "./NoteListItem";

export function NoteList() {
  const activeCollectionId = useStore(
    (state) => state.collections.activeCollectionId
  );
  const activeCollectionIdNotes = useCollectionNotes(activeCollectionId);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 space-y-2 flex-1 overflow-y-auto">
        {activeCollectionIdNotes.length > 0 ? (
          activeCollectionIdNotes.map((note) => (
            <NoteListItem key={note.id} note={note} />
          ))
        ) : (
          <div className="text-muted-foreground text-sm px-2 py-4">
            No notes in this collection
          </div>
        )}
      </div>
    </div>
  );
}
