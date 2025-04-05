import { useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { CollectionListItem } from "./CollectionListItem";

export function CollectionList() {
  const collections = useStore((state) => state.collections.data);

  const sortedCollections = useMemo(
    () =>
      [...collections].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [collections]
  );

  return (
    <div className="p-2 space-y-1 flex-1 overflow-y-auto">
      <CollectionListItem
        collection={{
          id: null,
          title: "All Notes",
          createdAt: new Date(),
          updatedAt: new Date(),
        }}
      />
      {sortedCollections.map((collection) => (
        <CollectionListItem key={collection.id} collection={collection} />
      ))}
    </div>
  );
}
