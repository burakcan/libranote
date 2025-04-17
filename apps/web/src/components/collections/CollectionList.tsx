import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/hooks/useStore";
import {
  ALL_NOTES_COLLECTION_ID,
  UNCATEGORIZED_COLLECTION_ID,
} from "@/lib/store/useCollectionNotes";
import { Separator } from "../ui/separator";
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
    <ScrollArea className="p-2 flex-1 min-h-0">
      <CollectionListItem
        collection={{
          id: ALL_NOTES_COLLECTION_ID,
          title: "All Notes",
        }}
      />
      <CollectionListItem
        collection={{
          id: UNCATEGORIZED_COLLECTION_ID,
          title: "Uncategorized Notes",
        }}
      />
      {sortedCollections.length > 0 && (
        <>
          <Separator className="mt-2 mb-2 bg-accent/50" />
          {sortedCollections.map((collection) => (
            <CollectionListItem key={collection.id} collection={collection} />
          ))}
        </>
      )}
    </ScrollArea>
  );
}
