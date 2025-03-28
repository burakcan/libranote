"use client";

import { useStore } from "@/components/providers/StoreProvider";
import { useCollectionNotes } from "@/lib/store/selectors";
import { CreateNoteButton } from "./CreateNoteButton";
import { NoteListItem } from "./NoteListItem";

export function NoteList() {
  const activeCollection = useStore((state) => state.activeCollection);
  const activeCollectionNotes = useCollectionNotes(activeCollection);
  const collections = useStore((state) => state.collections.data);

  // Find the active collection name
  const activeCollectionName = activeCollection
    ? collections.find((c) => c.id === activeCollection)?.title
    : null;

  return (
    <div className="flex flex-col h-full">
      {activeCollection && (
        <div className="p-3 border-b border-sidebar-border/70 font-medium">
          {activeCollectionName || "Collection"}
        </div>
      )}
      <div className="p-4 space-y-1 flex-1 overflow-y-auto">
        {activeCollectionNotes.length > 0 ? (
          activeCollectionNotes.map((note) => (
            <NoteListItem key={note.id} note={note} />
          ))
        ) : (
          <div className="text-muted-foreground text-sm px-2 py-4">
            No notes in this collection
          </div>
        )}
      </div>
      <div className="p-4 border-t border-sidebar-border/70">
        <CreateNoteButton />
      </div>
    </div>
  );
}
