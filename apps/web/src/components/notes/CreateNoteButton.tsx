import { FileText } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { useStore } from "@/hooks/useStore";

export function CreateNoteButton() {
  const { data: session } = useSessionQuery();
  const userId = session?.user.id;

  const { createNote, activeCollectionId } = useStore(
    useShallow((state) => ({
      createNote: state.notes.createNote,
      activeCollectionId: state.collections.activeCollectionId,
    }))
  );

  if (!activeCollectionId) return null;

  const handleClick = async () => {
    if (activeCollectionId && userId) {
      await createNote(activeCollectionId, userId, "New Note");
    }
  };

  return (
    <Button
      disabled={!userId}
      onClick={handleClick}
      variant="ghost"
      className="border-1 border-accent"
    >
      <FileText className="h-4 w-4" />
      New
    </Button>
  );
}
