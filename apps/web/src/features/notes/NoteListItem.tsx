import { FaFileAlt } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Note } from "@/lib/prisma";

export function NoteListItem({ note }: { note: Note }) {
  return (
    <Button variant="ghost" className="w-full justify-start text-left truncate">
      <FaFileAlt className="size-3 mr-2 text-muted-foreground" />
      {note.title}
    </Button>
  );
}
