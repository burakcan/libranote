import { useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/hooks/useStore";
import { exportService } from "@/services/ExportService";
import { getCollectionColor } from "@/lib/utils";
import { ClientNote } from "@/types/Entities";

export function useNoteItem(note: ClientNote) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { noteId: activeNoteId } = useParams({ strict: false });
  const navigate = useNavigate();

  const { deleteNote, collectionColor, collections } = useStore(
    useShallow((state) => ({
      deleteNote: state.notes.deleteNote,
      collections: state.collections.data,
      collectionColor: getCollectionColor([
        note.collectionId,
        state.collections.data || [],
      ]),
    }))
  );

  const handleExport = async () => {
    const collection = collections.find(
      (collection) => collection.id === note.collectionId
    );

    await exportService.downloadNoteMarkdown(note, collection || null);
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
    handleExport,
    handleDeleteClick,
    handleDeleteConfirm,
  };
}
