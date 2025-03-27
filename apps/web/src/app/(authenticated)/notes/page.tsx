import { CollectionsPanel } from "@/components/collections/CollectionsPanel";
import { Header } from "@/components/header/Header";
import { NotesPanel } from "@/components/notes/NotesPanel";

export default async function NotesPage() {
  return (
    <main className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <CollectionsPanel />
        <NotesPanel />
      </div>
    </main>
  );
}
