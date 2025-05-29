import { MoreHorizontal, Share2, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { vibrate } from "@/lib/utils";

type NoteDropdownMenuProps = {
  onShare: () => void;
  onDelete: () => void;
};

export function NoteDropdownMenu({ onShare, onDelete }: NoteDropdownMenuProps) {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate(10);
    onDelete();
  };

  return (
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
        <DropdownMenuItem onClick={handleShare}>
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
  );
}
