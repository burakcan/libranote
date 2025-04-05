import { CollectionList } from "./CollectionList";
import { CreateCollectionButton } from "./CreateCollectionButton";

export function CollectionsPanel() {
  return (
    <aside className="w-72 flex flex-col border-r border-sidebar-border/70 bg-accent/40">
      <div className="p-4 h-14 flex justify-between items-center">
        <h2 className="text-base font-medium">Collections</h2>
        <CreateCollectionButton />
      </div>
      <CollectionList />
    </aside>
  );
}
