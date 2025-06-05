import {
  Share2,
  Trash,
  MoreHorizontal,
  Pencil,
  UserRoundX,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { vibrate } from "@/lib/utils";
import { CollectionColorSelector } from "./CollectionColorSelector";

type CollectionDropdownMenuProps = {
  isOwner: boolean;
  currentColor: string | null;
  onShare: () => void;
  onRename: () => void;
  onColorChange: (color: string | null) => void;
  onDelete: () => void;
  onLeave: () => void;
  onExport: () => void;
};

export function CollectionDropdownMenu({
  isOwner,
  currentColor,
  onShare,
  onRename,
  onColorChange,
  onDelete,
  onLeave,
  onExport,
}: CollectionDropdownMenuProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate(10);
    onDelete();
  };

  const handleLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLeave();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare();
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExport();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="focus:outline-none text-muted-foreground ml-2 z-10"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        asChild
      >
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 -translate-y-2"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {isOwner && (
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
        )}
        {isOwner && (
          <DropdownMenuItem onClick={onRename}>
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
        )}
        {isOwner && <DropdownMenuSeparator />}

        <CollectionColorSelector
          currentColor={currentColor}
          onColorChange={onColorChange}
        />
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export as Markdown
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isOwner ? (
          <DropdownMenuItem onClick={handleDelete}>
            <Trash className="text-destructive h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleLeave}>
            <UserRoundX className="text-destructive h-4 w-4 mr-2" />
            Leave
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
