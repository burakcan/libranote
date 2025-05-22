import { Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SyncStatus } from "@/components/header/SyncStatus";
import { useViewportSize } from "@/hooks/useViewportSize";
import { SettingsModal } from "../settings/Settings";
import { CollectionList } from "./CollectionList";
import { CreateCollectionButton } from "./CreateCollectionButton";

interface CollectionsSideSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CollectionsSideSheet(props: CollectionsSideSheetProps) {
  const { open, onOpenChange } = props;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const viewportSize = useViewportSize();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="gap-0 w-10/12"
        style={{
          height: viewportSize?.[1],
        }}
      >
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
              setSettingsOpen(true);
            }}
          >
            <Settings className="size-4" />
          </Button>
          <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
          <SyncStatus />
        </div>
      </SheetContent>
    </Sheet>
  );
}
