import { FaCircle, FaPlusCircle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Hocuspocus } from "@/components/HocusPocus";

export default async function NotesPage() {
  return (
    <main className="h-screen flex flex-col">
      <Hocuspocus />
      <header className="h-12 border-b border-sidebar-border/70 bg-sidebar"></header>
      <div className="flex flex-1">
        <aside className="w-64 flex flex-col border-r border-sidebar-border/70 bg-sidebar">
          <div className="p-4 space-y-1 flex-1">
            <Button variant="ghost" className="w-full justify-start bg-accent text-accent-foreground dark:bg-accent/50">
              <FaCircle className="size-3 text-muted-foreground" />
              All Notes
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <FaCircle className="size-3 text-amber-500" />
              Personal
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <FaCircle className="size-3 text-indigo-500" />
              Family
            </Button>
          </div>
          <div className="p-4 border-t border-sidebar-border/70">
            <Button variant="ghost" className="w-full justify-start border-1 border-accent">
              <FaPlusCircle className="size-3" />
              New collection
            </Button>
          </div>
        </aside>
        <aside className="w-64 border-r border-sidebar-border overflow-y-auto bg-sidebar"></aside>
      </div>
    </main>
  );
}
