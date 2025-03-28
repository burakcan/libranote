"use client";

import { Share2, Trash, MoreHorizontal, Pencil } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useStore } from "@/components/providers/StoreProvider";
import { Collection } from "@/lib/db/prisma";
import { useCollectionNotes } from "@/lib/store/selectors";
import { cn } from "@/lib/utils";

type ALL_NOTES_COLLECTION = {
  id: null;
  title: "All Notes";
  createdAt: Date;
  updatedAt: Date;
};

export function CollectionListItem({
  collection,
}: {
  collection: Collection | ALL_NOTES_COLLECTION;
}) {
  const [renameInput, setRenameInput] = useState(collection.title);
  const isSyncing = useStore((state) =>
    state.actionQueue.some((action) => action.relatedEntityId === collection.id)
  );
  const isRenaming = useStore(
    (state) =>
      state.renamingCollection !== null &&
      state.renamingCollection === collection.id
  );
  const setRenamingCollection = useStore(
    (state) => state.setRenamingCollection
  );
  const notes = useCollectionNotes(collection.id);
  const activeCollection = useStore((state) => state.activeCollection);
  const setActiveCollection = useStore((state) => state.setActiveCollection);
  const deleteCollection = useStore((state) => state.deleteCollection);
  const updateCollection = useStore((state) => state.updateCollection);
  const isActive = activeCollection === collection.id;

  const setIsRenaming = (isRenaming: boolean) => {
    setRenamingCollection(isRenaming ? collection.id : null);
  };

  const handleRename = () => {
    setIsRenaming(false);

    if (collection.id === null) return;
    if (renameInput.trim() === "") return;
    if (renameInput.trim() === collection.title) return;

    updateCollection({
      ...collection,
      title: renameInput.trim(),
    });
  };

  const handleCancelRename = () => {
    setRenameInput(collection.title);
    setIsRenaming(false);
  };

  return (
    <div
      key={collection.id}
      className={cn(
        "flex items-center justify-between p-2 rounded-md cursor-default hover:bg-accent/30",
        isActive && "bg-accent/50",
        isRenaming && "p-0",
        isSyncing && "opacity-50"
      )}
      onClick={() => setActiveCollection(collection.id)}
    >
      {isRenaming && collection.id !== null ? (
        <Input
          className="w-full text-sm h-9 font-medium pl-8 border-none"
          value={renameInput}
          onChange={(e) => setRenameInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleRename();
            } else if (e.key === "Escape") {
              handleCancelRename();
            }
          }}
          autoFocus
          onBlur={handleRename}
        />
      ) : (
        <>
          <div className="flex items-center max-w-full">
            <div className="w-3 h-3 rounded-full mr-3 bg-accent-foreground" />
            <span className="text-sm font-medium truncate max-w-32">
              {collection.title}
            </span>
            <span className="ml-2 text-xs text-muted-foreground whitespace-nowrap">
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </span>
          </div>

          {collection.id !== null && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="focus:outline-none text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCollection(collection.id);
                  }}
                >
                  <Trash className="text-destructive h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRenaming(true);
                    setRenameInput(collection.title);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      )}
    </div>
  );
}
