import { useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/hooks/useStore";
import { getCollectionColor } from "@/lib/utils";
import { ClientNote } from "@/types/Entities";

export function useNoteItem(note: ClientNote) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { noteId: activeNoteId } = useParams({ strict: false });
  const navigate = useNavigate();

  const { deleteNote, collectionColor } = useStore(
    useShallow((state) => ({
      deleteNote: state.notes.deleteNote,
      collectionColor: getCollectionColor([
        note.collectionId,
        state.collections.data || [],
      ]),
    }))
  );

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log("Share note:", note.id);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    // Navigate away if we're deleting the currently active note
    if (activeNoteId === note.id) {
      navigate({ to: "/notes" });
    }

    deleteNote(note.id);
  };

  return {
    // State
    showDeleteDialog,
    setShowDeleteDialog,

    // Computed values
    collectionColor,

    // Actions
    handleShare,
    handleDeleteClick,
    handleDeleteConfirm,
  };
}
