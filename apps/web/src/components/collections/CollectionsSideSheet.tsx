import { Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SyncStatus } from "@/components/header/SyncStatus";
import { CollectionList } from "./CollectionList";
import { CreateCollectionButton } from "./CreateCollectionButton";

interface CollectionsSideSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CollectionsSideSheet(props: CollectionsSideSheetProps) {
  const { open, onOpenChange } = props;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="gap-0 w-10/12">
        <SheetHeader>
          <SheetTitle>Collections</SheetTitle>
          <SheetDescription className="hidden">
            Select a collection to view your notes
          </SheetDescription>
        </SheetHeader>
        <CreateCollectionButton className="mx-4 sm:mx-2" />
        <CollectionList onSelectCollection={() => onOpenChange(false)} />
        <div className="flex sm:hidden justify-between items-center p-2 bg-accent/10 border-t border-sidebar-border/70">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              toast.info("Build Date", {
                description: import.meta.env.BUILD_DATE,
              });
            }}
          >
            <Settings className="size-4" />
          </Button>
          <SyncStatus />
        </div>
      </SheetContent>
    </Sheet>
  );
}
