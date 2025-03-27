"use client";

import { Trash2 } from "lucide-react";
import { FaCircle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useStore } from "@/components/providers/StoreProvider";
import { Collection } from "@/lib/db/prisma";
import { cn } from "@/lib/utils";

export function CollectionListItem({ collection }: { collection: Collection }) {
  const activeCollection = useStore((state) => state.activeCollection);
  const setActiveCollection = useStore((state) => state.setActiveCollection);
  const deleteCollection = useStore((state) => state.deleteCollection);
  const isActive = activeCollection === collection.id;

  return (
    <div className="flex items-center justify-between">
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
      <Button
        variant="ghost"
        size="icon"
        onClick={() => deleteCollection(collection.id)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
