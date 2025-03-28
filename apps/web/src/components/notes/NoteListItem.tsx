import { FaFileAlt } from "react-icons/fa";
import { Button } from "@/components/ui/button";

interface NoteListItemProps {
  note: ClientNote;
}

export function NoteListItem({ note }: NoteListItemProps) {
  return (
    <Button variant="ghost" className="w-full justify-start text-left truncate">
      <FaFileAlt className="size-3 mr-2 text-muted-foreground" />
      {note.title}
    </Button>
  );
}
