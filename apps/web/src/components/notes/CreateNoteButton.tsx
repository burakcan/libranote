import { useNavigate } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { useStore } from "@/hooks/useStore";

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
    if (userId) {
      const note = await createNote(activeCollectionId, userId, "New Note");
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
