import { Menu, Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CollectionList } from "@/components/collections/CollectionList";
import { CreateCollectionButton } from "@/components/collections/CreateCollectionButton";
import { SyncStatus } from "@/components/header/SyncStatus";
import { SearchBar } from "@/components/search/SearchBar";

export function NotesMobileHeader() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex sm:hidden p-4 pl-2 pr-2 gap-2 h-14 justify-between items-center border-b border-sidebar-border/70 bg-accent">
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="h-10">
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="gap-0">
          <SheetHeader>
            <SheetTitle>Collections</SheetTitle>
            <SheetDescription className="hidden">
              Select a collection to view your notes
            </SheetDescription>
          </SheetHeader>
          <CreateCollectionButton className="mx-4" />
          <CollectionList onSelectCollection={() => setSheetOpen(false)} />
          <div className="flex justify-between items-center p-2 bg-accent/10 border-t border-sidebar-border/70">
            <Button variant="outline" size="icon">
              <Settings className="size-4" />
            </Button>
            <SyncStatus />
          </div>
        </SheetContent>
      </Sheet>
      <SearchBar />
    </div>
  );
}
