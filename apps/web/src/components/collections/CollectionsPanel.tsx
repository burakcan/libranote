import { CollectionList } from "./CollectionList";
import { CreateCollectionButton } from "./CreateCollectionButton";

export function CollectionsPanel() {
  return (
    <aside className="hidden xl:block w-56 sm:w-64 2xl:w-72 border-r border-sidebar-border/70 bg-sidebar">
      <div className="flex flex-1 min-h-0 h-full flex-col bg-accent/20">
        <div className="p-4 h-14 flex justify-between items-center border-b border-sidebar-border/70">
          <h2 className="text-base font-medium">Collections</h2>
          <CreateCollectionButton />
        </div>
        <CollectionList />
      </div>
    </aside>
  );
}
