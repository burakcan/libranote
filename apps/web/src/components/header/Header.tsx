import { LogOut, Notebook, Settings, User } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { SyncStatus } from "./SyncStatus";

export function Header() {
  const { data: session } = useSessionQuery();

  return (
    <header className="h-14 px-4 flex-shrink-0 border-b border-sidebar-border/70 bg-sidebar">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-4 w-72 shrink-0">
          <h1 className="font-bold flex items-center h-full gap-2 text-md">
            <Notebook className="size-8 p-2 bg-accent rounded-md" />
            Libranote
          </h1>
        </div>
        <div className="flex items-center justify-center max-w-md flex-auto">
          <SearchBar />
        </div>
        <div className="flex items-center justify-end gap-4 shrink-0">
          <SyncStatus />
          <div className="w-[1px] bg-accent h-4" />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Settings className="size-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <User className="size-4" />
                  {session?.user?.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <LogOut className="size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
