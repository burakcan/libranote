import { motion } from "motion/react";
import { useCollectionItem } from "@/hooks/useCollectionItem";
import {
  UNCATEGORIZED_COLLECTION_ID,
  ALL_NOTES_COLLECTION_ID,
} from "@/lib/store/useCollectionNotes";
import { cn } from "@/lib/utils";
import { CollectionDeleteConfirmDialog } from "./CollectionDeleteConfirmDialog";
import { CollectionDisplay } from "./CollectionDisplay";
import { CollectionDropdownMenu } from "./CollectionDropdownMenu";
import { CollectionRenameInput } from "./CollectionRenameInput";
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

export function CollectionListItem({
  collection,
  onSelectCollection,
}: CollectionListItemProps) {
  const {
    // State
    isRenaming,
    isActive,
    showDeleteDialog,
    setShowDeleteDialog,
    elementRef,

    // Computed values
    allOrUncategorizedCollection,
    totalNotes,
    isOwner,
    currentColor,

    // Actions
    handleRename,
    handleRenameConfirm,
    handleRenameCancel,
    handleColorChange,
    handleSelectCollection,
    handleShare,
    handleDeleteOrLeave,
    handleExport,
  } = useCollectionItem(collection);

  const handleSelect = () => {
    handleSelectCollection(onSelectCollection);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    handleDeleteOrLeave();
  };

  return (
    <>
      <motion.div
        layout
        role="button"
        ref={elementRef}
        key={collection.id}
        className={cn(
          "flex relative items-center justify-between h-12 px-2 rounded-md cursor-default mb-1",
          isActive && "bg-accent/50",
          isRenaming && "p-0"
        )}
        onMouseDown={handleSelect}
      >
        {isRenaming && collection.id !== null ? (
          <CollectionRenameInput
            initialValue={collection.title}
            onConfirm={handleRenameConfirm}
            onCancel={handleRenameCancel}
          />
        ) : (
          <>
            <CollectionDisplay
              title={collection.title}
              color={currentColor}
              totalNotes={totalNotes}
              isSpecialCollection={allOrUncategorizedCollection}
            />

            {!allOrUncategorizedCollection && (
              <CollectionDropdownMenu
                isOwner={isOwner}
                currentColor={currentColor}
                onShare={handleShare}
                onRename={handleRename}
                onColorChange={handleColorChange}
                onDelete={handleDeleteClick}
                onLeave={handleDeleteClick}
                onExport={handleExport}
              />
            )}
          </>
        )}
      </motion.div>

      <CollectionDeleteConfirmDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        collectionTitle={collection.title}
        onConfirm={handleDeleteConfirm}
        isOwner={isOwner}
      />
    </>
  );
}
