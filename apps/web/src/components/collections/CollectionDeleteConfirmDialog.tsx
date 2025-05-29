import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

type CollectionDeleteConfirmDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  collectionTitle: string;
  onConfirm: () => void;
  isOwner: boolean;
};

export function CollectionDeleteConfirmDialog({
  isOpen,
  onOpenChange,
  collectionTitle,
  onConfirm,
  isOwner,
}: CollectionDeleteConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isOwner ? "Delete collection?" : "Leave collection?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isOwner ? (
              <>
                This will permanently delete the collection "{collectionTitle}"
                and all its notes. This action cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to leave the collection "{collectionTitle}
                "? You will lose access to all notes in this collection.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={handleConfirm}
          >
            {isOwner ? "Delete" : "Leave"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
