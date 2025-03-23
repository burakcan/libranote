"use client";

import { FaCircle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Collection } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { useStore } from "@/features/core/StoreProvider";

export function CollectionListItem({ collection }: { collection: Collection }) {
  const activeCollection = useStore((state) => state.activeCollection);
  const setActiveCollection = useStore((state) => state.setActiveCollection);

  const isActive = activeCollection === collection.id;

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start",
        isActive
          ? "bg-accent text-accent-foreground dark:bg-accent/50"
          : "hover:bg-accent/50"
      )}
      onClick={() => setActiveCollection(collection.id)}
    >
      <FaCircle
        className={cn(
          "size-3 mr-2",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      />
      {collection.title}
    </Button>
  );
}
