import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { MoreHorizontal, Share2, Trash } from "lucide-react";
import { motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/hooks/useStore";
import { cn, getCollectionColor, vibrate } from "@/lib/utils";
import { Button } from "../ui/button";
import { ClientNote } from "@/types/Entities";

interface NoteListItemProps {
  note: ClientNote;
}

export function NoteListItem({ note }: NoteListItemProps) {
  const { noteId: activeNoteId } = useParams({ strict: false });
  const { deleteNote, collectionColor } = useStore(
    useShallow((state) => ({
      deleteNote: state.notes.deleteNote,
      collectionColor: getCollectionColor([
        note.collectionId,
        state.collections.data || [],
      ]),
    }))
  );

  const navigate = useNavigate();

  const handleDelete = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (activeNoteId === note.id) {
      navigate({ to: "/notes" });
    }

    deleteNote(note.id);
    vibrate(10);
  };

  return (
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
        <div className="flex flex-shrink-0 flex-grow-0 mr-3 h-9">
          <div
            className="w-1 h-1 rounded-full mt-2 outline-1 outline-white/50"
            style={{
              backgroundColor: collectionColor,
            }}
          />
        </div>
        <div className="flex flex-auto flex-col min-w-0 mr-2">
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
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            asChild
          >
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete}>
              <Trash className="text-destructive h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Link>
    </motion.div>
  );
}
