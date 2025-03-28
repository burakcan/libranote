import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { CollectionList } from "./CollectionList";
import { CreateCollectionButton } from "./CreateCollectionButton";

export function CollectionsPanel() {
  return (
    <aside className="w-72 flex flex-col border-r border-sidebar-border/70 bg-accent/40">
      <div className="p-4 pb-2 flex justify-between items-center">
        <h2 className="text-md font-medium">Collections</h2>
        <Button variant="ghost" className="border-1 border-accent">
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>
      <CollectionList />
      <div className="p-4 border-t border-sidebar-border/70">
        <CreateCollectionButton />
      </div>
    </aside>
  );
}
