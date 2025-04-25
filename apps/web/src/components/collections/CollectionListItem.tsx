import {
  Share2,
  Trash,
  MoreHorizontal,
  Pencil,
  UserRoundX,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useCollectionListContext } from "@/hooks/useCollectionListContext";
import { useStore } from "@/hooks/useStore";
import {
  useCollectionNotes,
  UNCATEGORIZED_COLLECTION_ID,
  ALL_NOTES_COLLECTION_ID,
} from "@/lib/store/useCollectionNotes";
import { cn, vibrate } from "@/lib/utils";
import { ClientCollection } from "@/types/Entities";

type ALL_NOTES_COLLECTION = {
  id: typeof ALL_NOTES_COLLECTION_ID;
  title: string;
};

type UNCATEGORIZED_COLLECTION = {
  id: typeof UNCATEGORIZED_COLLECTION_ID;
  title: string;
};

type CollectionListItemProps = {
  collection:
    | ClientCollection
    | ALL_NOTES_COLLECTION
    | UNCATEGORIZED_COLLECTION;
  onSelectCollection?: (collectionId: string) => void;
};

const isSpecialCollection = (
  collection: CollectionListItemProps["collection"]
): collection is ALL_NOTES_COLLECTION | UNCATEGORIZED_COLLECTION => {
  return (
    collection.id === ALL_NOTES_COLLECTION_ID ||
    collection.id === UNCATEGORIZED_COLLECTION_ID
  );
};

const collectionColorPresets = [
  {
    label: "Rose",
    color: "var(--color-rose-500)",
  },
  {
    label: "Amber",
    color: "var(--color-amber-500)",
  },
  {
    label: "Yellow",
    color: "var(--color-yellow-300)",
  },
  {
    label: "Lime",
    color: "var(--color-lime-400)",
  },
  {
    label: "Emerald",
    color: "var(--color-emerald-500)",
  },
  {
    label: "Indigo",
    color: "var(--color-indigo-500)",
  },
  {
    label: "Purple",
    color: "var(--color-purple-500)",
  },
];

export function CollectionListItem({
  collection,
  onSelectCollection,
}: CollectionListItemProps) {
  const [renameInput, setRenameInput] = useState(collection.title);
  const { showShareModal } = useCollectionListContext();
  const {
    isRenaming = false,
    isActive = false,
    setActiveCollectionId,
    deleteCollection,
    setRenamingCollection,
    updateCollection,
    leaveCollection,
  } = useStore(
    useShallow((state) => ({
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

  const allOrUncategorizedCollection = isSpecialCollection(collection);
  const totalNotes = useCollectionNotes(collection.id).length;
  const isOwner = allOrUncategorizedCollection
    ? true
    : collection.members[0].role === "OWNER";

  const handleRenameCollection = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setRenamingCollection(collection.id);
    setRenameInput(collection.title);
  };

  const handleConfirmRename = () => {
    setRenamingCollection(null);

    if (allOrUncategorizedCollection) {
      return;
    }

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

  const handleColorChange = (color: string | null) => {
    if (allOrUncategorizedCollection) {
      return;
    }

    updateCollection({
      ...collection,
      members: [
        {
          ...collection.members[0],
          color,
        },
      ],
    });
  };

  const handleSelectCollection = () => {
    if (onSelectCollection) {
      onSelectCollection(collection.id);
    }

    setActiveCollectionId(collection.id);
  };

  return (
    <motion.div
      layout
      role="button"
      key={collection.id}
      className={cn(
        "flex relative items-center justify-between h-12 px-2 rounded-md cursor-default mb-1",
        isActive && "bg-accent/50",
        isRenaming && "p-0"
      )}
      onMouseDown={handleSelectCollection}
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
            <div
              className="size-3 rounded-full ml-1 mr-3 border-1 border-white/50 flex-shrink-0"
              style={{
                backgroundColor: allOrUncategorizedCollection
                  ? "var(--color-transparent)"
                  : collection.members[0].color
                    ? collection.members[0].color
                    : "var(--color-transparent)",
              }}
            />
            <span className="text-sm font-medium truncate flex-shrink min-w-0">
              {collection.title}
            </span>
            <span className="ml-2 text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
              {totalNotes} {totalNotes === 1 ? "note" : "notes"}
            </span>
          </div>

          {!allOrUncategorizedCollection && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="focus:outline-none text-muted-foreground ml-2 z-10"
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                asChild
              >
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 -translate-y-2"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {isOwner && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      showShareModal(collection.id);
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
                {!allOrUncategorizedCollection && (
                  <>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <div
                          className={cn(
                            "size-3 ml-0.5 rounded-full border-1 border-white/50 mr-4.5",
                            collection.members[0].color
                              ? "bg-accent-foreground/50"
                              : ""
                          )}
                          style={{
                            backgroundColor: collection.members[0].color
                              ? collection.members[0].color
                              : "var(--color-transparent)",
                          }}
                        />
                        {collection.members[0].color
                          ? "Change color"
                          : "No color"}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem
                            onClick={() => handleColorChange(null)}
                          >
                            <div
                              className={cn(
                                "size-3 rounded-full border-1 border-accent-foreground/50"
                              )}
                              style={{
                                backgroundColor: `var(--color-transparent)`,
                              }}
                            />
                            No color
                          </DropdownMenuItem>
                          {collectionColorPresets.map((color) => (
                            <DropdownMenuItem
                              key={color.label}
                              onClick={() => handleColorChange(color.color)}
                            >
                              <div
                                className={cn(
                                  "size-3 rounded-full border-1 border-accent-foreground/50"
                                )}
                                style={{
                                  backgroundColor: color.color,
                                }}
                              />
                              {color.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                  </>
                )}
                {isOwner ? (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCollection(collection.id);
                      vibrate(10);
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
    </motion.div>
  );
}
