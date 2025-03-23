"use client";

import { CreateNoteButton } from "./CreateNoteButton";
import { NoteListItem } from "./NoteListItem";
import { useStore } from "@/features/core/StoreProvider";

export function NoteList() {
  const notes = useStore((state) => state.notes.data);
  const activeCollection = useStore((state) => state.activeCollection);
  const collections = useStore((state) => state.collections.data);

  // Filter notes by the active collection
  const filteredNotes = activeCollection
    ? notes.filter((note) => note.collectionId === activeCollection)
    : notes;

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
        {activeCollection ? (
          filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <NoteListItem key={note.id} note={note} />
            ))
          ) : (
            <div className="text-muted-foreground text-sm px-2 py-4">
              No notes in this collection
            </div>
          )
        ) : (
          <div className="text-muted-foreground text-sm px-2 py-4">
            Select a collection to view notes
          </div>
        )}
      </div>
      <div className="p-4 border-t border-sidebar-border/70">
        <CreateNoteButton />
      </div>
    </div>
  );
}
