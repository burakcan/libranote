import { useNavigate } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { useStore } from "@/hooks/useStore";
import {
  ALL_NOTES_COLLECTION_ID,
  UNCATEGORIZED_COLLECTION_ID,
} from "@/lib/store/useCollectionNotes";

export function CreateNoteButton() {
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

      navigate({
        to: "/notes/$noteId",
        params: { noteId: note.id },
      });
    }
  };

  return (
    <Button disabled={!userId} onClick={handleClick} variant="outline">
      <FileText className="h-4 w-4" />
      New
    </Button>
  );
}
