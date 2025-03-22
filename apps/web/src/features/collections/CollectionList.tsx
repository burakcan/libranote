"use client";

import { CollectionListItem } from "./CollectionListItem";
import { useStore } from "@/features/core/StoreProvider";

export function CollectionList() {
  const collections = useStore((state) => state.collections.data);

  return (
    <div className="p-4 space-y-1 flex-1">
      {collections.map((collection) => (
        <CollectionListItem key={collection.id} collection={collection} />
      ))}
    </div>
  );
}
