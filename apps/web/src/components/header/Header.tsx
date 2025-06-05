import { Loader2, LogOut, Notebook, Settings, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchBar } from "@/components/search/SearchBar";
import { SettingsModal } from "@/components/settings/Settings";
import { useLogout } from "@/hooks/useLogout";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { SyncStatus } from "./SyncStatus";

export function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { data: session } = useSessionQuery();
  const { mutate: logout, isPending } = useLogout();

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
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSettingsOpen(true);
              }}
            >
              <Settings className="size-4" />
            </Button>
            <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <User className="size-4" />
                  {session?.user?.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSettingsOpen(true);
                  }}
                >
                  <Settings className="size-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                  }}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogOut className="size-4" />
                  )}
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
