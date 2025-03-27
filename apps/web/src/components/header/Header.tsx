import { Notebook } from "lucide-react";

export function Header() {
  return (
    <header className="h-12 border-b border-sidebar-border/70 bg-sidebar">
      <div className="flex items-center justify-between h-full px-2">
        <h1 className="font-bold flex items-center h-full gap-2 text-md">
          <Notebook className="size-8 p-2 bg-accent rounded-md" />
          Libranote
        </h1>
      </div>
    </header>
  );
}
