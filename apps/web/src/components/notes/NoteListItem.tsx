import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useNoteItem } from "@/hooks/useNoteItem";
import { cn } from "@/lib/utils";
import { NoteDeleteConfirmDialog } from "./NoteDeleteConfirmDialog";
import { NoteDisplay } from "./NoteDisplay";
import { NoteDropdownMenu } from "./NoteDropdownMenu";
import { ClientNote } from "@/types/Entities";

interface NoteListItemProps {
  note: ClientNote;
}

export function NoteListItem({ note }: NoteListItemProps) {
  const {
    // State
    showDeleteDialog,
    setShowDeleteDialog,

    // Computed values
    collectionColor,

    // Actions
    handleDeleteClick,
    handleDeleteConfirm,
    handleExport,
  } = useNoteItem(note);

  return (
    <>
      <motion.div layout>
        <Link
          to="/notes/$noteId"
          params={{ noteId: note.id }}
          className={cn(
            "flex items-center justify-between p-4 rounded-md cursor-default mb-1 first-of-type:mt-2 last-of-type:mb-2"
          )}
          activeProps={{ className: "bg-accent/50" }}
          inactiveProps={{ className: "hover:bg-accent/30" }}
          viewTransition={{
            types: ["navigate-forward"],
          }}
        >
          <NoteDisplay
            title={note.title}
            description={note.description}
            collectionColor={collectionColor}
          />

          <NoteDropdownMenu
            onExport={handleExport}
            onDelete={handleDeleteClick}
          />
        </Link>
      </motion.div>

      <NoteDeleteConfirmDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        noteTitle={note.title}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
