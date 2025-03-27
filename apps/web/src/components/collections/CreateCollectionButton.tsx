"use client";

import { FaPlusCircle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useStore } from "@/components/providers/StoreProvider";

export function CreateCollectionButton() {
  const createCollection = useStore((state) => state.createCollection);

  return (
    <Button
      variant="ghost"
      className="w-full justify-start border-1 border-accent"
      onClick={() => createCollection("New Collection")}
    >
      <FaPlusCircle className="size-3" />
      New collection
    </Button>
  );
}
