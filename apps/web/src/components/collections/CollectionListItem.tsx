"use client";

import { CollectionMemberRole } from "@repo/db";
import {
  Share2,
  Trash,
  MoreHorizontal,
  Pencil,
  UserRoundX,
} from "lucide-react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import SharingModal from "@/components/collections/CollectionSharingModal";
import { useStore } from "@/hooks/useStore";
import { useCollectionNotes } from "@/lib/store/useCollectionNotes";
import { cn } from "@/lib/utils";
import { ClientCollection } from "@/types/Entities";

type ALL_NOTES_COLLECTION = {
  id: null;
  title: "All Notes";
  createdAt: Date;
  updatedAt: Date;
  members: [
    {
      role: CollectionMemberRole;
    },
  ];
};

interface CollectionListItemProps {
  collection: ClientCollection | ALL_NOTES_COLLECTION;
}

export function CollectionListItem({ collection }: CollectionListItemProps) {
  const [renameInput, setRenameInput] = useState(collection.title);
  const [sharingModalOpen, setSharingModalOpen] = useState(false);
  const {
    isSyncing,
    isRenaming = false,
    isActive = false,
    setActiveCollectionId,
    deleteCollection,
    setRenamingCollection,
    updateCollection,
    leaveCollection,
  } = useStore(
    useShallow((state) => ({
      isSyncing: state.actionQueue.items.some(
        (action) =>
          action.relatedEntityId === collection.id &&
          action.status === "processing"
      ),
      isRenaming:
        state.collections.renamingCollectionId !== null &&
        state.collections.renamingCollectionId === collection.id,
      isActive: state.collections.activeCollectionId === collection.id,
      setRenamingCollection: state.collections.setRenamingCollectionId,
      setActiveCollectionId: state.collections.setActiveCollectionId,
      deleteCollection: state.collections.deleteCollection,
      updateCollection: state.collections.updateCollection,
      leaveCollection: state.collections.leaveCollection,
    }))
  );

  const totalNotes = useCollectionNotes(collection.id).length;
  const isOwner = collection.members[0].role === "OWNER";

  const handleRenameCollection = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setRenamingCollection(collection.id);
    setRenameInput(collection.title);
  };

  const handleConfirmRename = () => {
    setRenamingCollection(null);

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
    setRenamingCollection(null);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleConfirmRename();
    } else if (e.key === "Escape") {
      handleCancelRename();
    }
  };

  return (
    <div
      role="button"
      key={collection.id}
      className={cn(
        "flex items-center justify-between h-12 px-2 rounded-md cursor-default mb-1",
        isActive ? "bg-accent/50" : "hover:bg-accent/30",
        isRenaming && "p-0",
        isSyncing && "opacity-50"
      )}
      onMouseDown={() => setActiveCollectionId(collection.id)}
    >
      {isRenaming && collection.id !== null ? (
        <Input
          className="w-full text-sm h-8 mx-2 font-medium pl-6 border-none"
          value={renameInput}
          onChange={(e) => setRenameInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          autoFocus
          onBlur={handleConfirmRename}
          onFocus={(e) => e.target.select()}
        />
      ) : (
        <>
          <div className="flex items-center min-w-0">
            <div className="w-2 h-2 rounded-full ml-1 mr-3 bg-accent-foreground flex-shrink-0" />
            <span className="text-sm font-medium truncate flex-shrink min-w-0">
              {collection.title}
            </span>
            <span className="ml-2 text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
              {totalNotes} {totalNotes === 1 ? "note" : "notes"}
            </span>
          </div>

          {collection.id !== null && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="focus:outline-none text-muted-foreground ml-2"
                onClick={(e) => e.stopPropagation()}
                asChild
              >
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setSharingModalOpen(true);
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                )}
                {isOwner && (
                  <DropdownMenuItem onClick={handleRenameCollection}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                )}
                {isOwner && <DropdownMenuSeparator />}
                {isOwner ? (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCollection(collection.id);
                    }}
                  >
                    <Trash className="text-destructive h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      leaveCollection(collection.id);
                    }}
                  >
                    <UserRoundX className="text-destructive h-4 w-4 mr-2" />
                    Leave
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      )}
      {collection.id !== null && (
        <SharingModal
          setOpen={setSharingModalOpen}
          open={sharingModalOpen}
          collectionId={collection.id}
        />
      )}
    </div>
  );
}
