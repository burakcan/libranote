import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search/SearchBar";
import { useCollectionListContext } from "@/hooks/useCollectionListContext";

export function NotesMobileHeader() {
  const { isSideSheetOpen, onSideSheetOpenChange } = useCollectionListContext();

  return (
    <div className="flex p-4 pl-2 pr-2 gap-2 h-14 justify-between items-center border-b border-sidebar-border/70 bg-accent">
      <Button
        variant="outline"
        className="size-10"
        onClick={() => onSideSheetOpenChange(!isSideSheetOpen)}
      >
        <Menu className="size-4" />
      </Button>
      <SearchBar />
    </div>
  );
}
