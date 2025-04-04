import { Notebook, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { SearchBar } from "./SearchBar";
import { SyncStatus } from "./SyncStatus";

export function Header() {
  return (
    <header className="h-12 flex-shrink-0 border-b border-sidebar-border/70 bg-sidebar">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-4 w-72">
          <h1 className="font-bold flex items-center h-full gap-2 text-md">
            <Notebook className="size-8 p-2 bg-accent rounded-md" />
            Libranote
          </h1>
          <div className="w-[1px] bg-accent h-4" />
        </div>
        <div className="flex items-center justify-center flex-auto">
          <SearchBar />
        </div>
        <div className="flex items-center gap-4">
          <SyncStatus />
          <div className="w-[1px] bg-accent h-4" />
          <Button variant="outline" size="icon">
            <Settings className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
