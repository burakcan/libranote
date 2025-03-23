import { CollectionList } from "@/features/collections/CollectionList";
import { CreateCollectionButton } from "@/features/collections/CreateCollectionButton";
import { NoteList } from "@/features/notes/NoteList";

export default async function NotesPage() {
  return (
    <main className="h-screen flex flex-col">
      <header className="h-12 border-b border-sidebar-border/70 bg-sidebar"></header>
      <div className="flex flex-1">
        <aside className="w-64 flex flex-col border-r border-sidebar-border/70 bg-sidebar">
          <CollectionList />
          <div className="p-4 border-t border-sidebar-border/70">
            <CreateCollectionButton />
          </div>
        </aside>
        <aside className="w-64 border-r border-sidebar-border overflow-y-auto bg-sidebar">
          <NoteList />
        </aside>
      </div>
    </main>
  );
}
