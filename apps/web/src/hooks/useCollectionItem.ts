import { useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCollectionListContext } from "@/hooks/useCollectionListContext";
import { useStore } from "@/hooks/useStore";
import { exportService } from "@/services/ExportService";
import {
  useCollectionNotes,
  UNCATEGORIZED_COLLECTION_ID,
  ALL_NOTES_COLLECTION_ID,
} from "@/lib/store/useCollectionNotes";
import { ClientCollection } from "@/types/Entities";

type ALL_NOTES_COLLECTION = {
  id: typeof ALL_NOTES_COLLECTION_ID;
  title: string;
};

type UNCATEGORIZED_COLLECTION = {
  id: typeof UNCATEGORIZED_COLLECTION_ID;
  title: string;
};

type CollectionType =
  | ClientCollection
  | ALL_NOTES_COLLECTION
  | UNCATEGORIZED_COLLECTION;

const isSpecialCollection = (
  collection: CollectionType
): collection is ALL_NOTES_COLLECTION | UNCATEGORIZED_COLLECTION => {
  return (
    collection.id === ALL_NOTES_COLLECTION_ID ||
    collection.id === UNCATEGORIZED_COLLECTION_ID
  );
};

export function useCollectionItem(collection: CollectionType) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
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
  const notes = useCollectionNotes(collection.id);
  const totalNotes = notes.length;
  const isOwner = allOrUncategorizedCollection
    ? true
    : collection.members[0].role === "OWNER";
  const currentColor = allOrUncategorizedCollection
    ? null
    : collection.members[0].color;

  const handleRename = () => {
    setRenamingCollection(collection.id);
    setTimeout(() => {
      elementRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 500);
  };

  const handleRenameConfirm = (newTitle: string) => {
    setRenamingCollection(null);
    if (allOrUncategorizedCollection) return;

    updateCollection({
      ...collection,
      title: newTitle,
    });
  };

  const handleRenameCancel = () => {
    setRenamingCollection(null);
  };

  const handleColorChange = (color: string | null) => {
    if (allOrUncategorizedCollection) return;

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

  const handleSelectCollection = (
    onSelectCollection?: (id: string) => void
  ) => {
    if (onSelectCollection) {
      onSelectCollection(collection.id);
    }
    setActiveCollectionId(collection.id);
  };

  const handleShare = () => {
    showShareModal(collection.id);
  };

  const handleDeleteOrLeave = () => {
    if (isOwner) {
      deleteCollection(collection.id);
    } else {
      leaveCollection(collection.id);
    }
  };

  const handleExport = async () => {
    if (allOrUncategorizedCollection) {
      return;
    }

    await exportService.exportNotes(notes, [collection]);
  };

  return {
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
  };
}
