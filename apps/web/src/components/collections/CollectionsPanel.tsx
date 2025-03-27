import { CollectionList } from "./CollectionList";
import { CreateCollectionButton } from "./CreateCollectionButton";

export function CollectionsPanel() {
  return (
    <aside className=" w-72 flex flex-col border-r border-sidebar-border/70 bg-accent/40">
      <CollectionList />
      <div className="p-4 border-t border-sidebar-border/70">
        <CreateCollectionButton />
      </div>
    </aside>
  );
}
