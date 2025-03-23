"use client";

import { FaPlusCircle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useStore } from "@/features/core/StoreProvider";

export function CreateNoteButton() {
  const createNote = useStore((state) => state.createNote);
  const activeCollection = useStore((state) => state.activeCollection);

  return (
    <Button
      variant="ghost"
      className="w-full justify-start border-1 border-accent"
      onClick={() => {
        if (activeCollection) {
          createNote(activeCollection, "New Note");
        }
      }}
      disabled={!activeCollection}
    >
      <FaPlusCircle className="size-3 mr-2" />
      New note
    </Button>
  );
}
