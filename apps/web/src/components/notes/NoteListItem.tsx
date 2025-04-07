import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { MoreHorizontal, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/hooks/useStore";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ClientNote } from "@/types/Entities";

interface NoteListItemProps {
  note: ClientNote;
}

export function NoteListItem({ note }: NoteListItemProps) {
  const { noteId: activeNoteId } = useParams({ strict: false });
  const deleteNote = useStore((state) => state.notes.deleteNote);
  const navigate = useNavigate();

  const handleDelete = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (activeNoteId === note.id) {
      navigate({ to: "/notes" });
    }

    deleteNote(note.id);
  };

  return (
    <Link
      to="/notes/$noteId"
      params={{ noteId: note.id }}
      className={cn(
        "flex items-center justify-between p-4 rounded-md cursor-default mb-1"
      )}
      activeProps={{ className: "bg-accent/50" }}
      inactiveProps={{ className: "hover:bg-accent/30" }}
    >
      <div className="flex flex-col min-w-0 mr-2">
        <div className="text-sm font-medium truncate flex-shrink min-w-0">
          {note.title || "Untitled Note"}
        </div>
        <div className="text-xs text-muted-foreground truncate flex-shrink min-w-0">
          {note.description || "empty note"}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="focus:outline-none text-muted-foreground flex-shrink-0 ml-2"
          onClick={(e) => e.stopPropagation()}
          asChild
        >
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDelete}>
            <Trash className="text-destructive h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Link>
  );
}
