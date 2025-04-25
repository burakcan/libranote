import { useNavigate } from "@tanstack/react-router";
import { FileText, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { useStore } from "@/hooks/useStore";
import {
  ALL_NOTES_COLLECTION_ID,
  UNCATEGORIZED_COLLECTION_ID,
} from "@/lib/store/useCollectionNotes";
import { vibrate } from "@/lib/utils";

const MotionButton = motion(Button);

export function CreateNoteButton({ floating }: { floating?: boolean }) {
  const { data: session } = useSessionQuery();
  const userId = session?.user.id;
  const navigate = useNavigate();

  const { createNote, activeCollectionId } = useStore(
    useShallow((state) => ({
      createNote: state.notes.createNote,
      activeCollectionId: state.collections.activeCollectionId,
    }))
  );

  const handleClick = async () => {
    const collectionId =
      activeCollectionId === ALL_NOTES_COLLECTION_ID ||
      activeCollectionId === UNCATEGORIZED_COLLECTION_ID
        ? null
        : activeCollectionId;

    if (userId) {
      const note = await createNote(collectionId, userId, "Untitled Note");

      vibrate(10);

      navigate({
        to: "/notes/$noteId",
        params: { noteId: note.id },
      });
    }
  };

  return (
    <>
      <MotionButton
        className={
          floating
            ? "block fixed bottom-4 right-4 z-10 h-16 w-16 rounded-full shadow-lg"
            : ""
        }
        disabled={!userId}
        onClick={handleClick}
        variant={!floating ? "outline" : "default"}
        initial={{ scale: 1 }}
        whileHover={floating ? { scale: 0.8 } : undefined}
        whileTap={floating ? { scale: 0.7 } : undefined}
      >
        {floating ? (
          <Plus className="size-10" />
        ) : (
          <>
            <FileText className="h-4 w-4" />
            New
          </>
        )}
      </MotionButton>
    </>
  );
}
