import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { useBreakpointSM } from "@/hooks/useBreakpointSM";
import {
  useInvitationQuery,
  useRejectCollectionInvitationMutation,
  useAcceptCollectionInvitationMutation,
} from "@/hooks/useCollectionInvitesQuery";
import { useStore } from "@/hooks/useStore";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogFooter,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { getDialogComponents } from "../ui/getDialogComponents";
import { Skeleton } from "../ui/skeleton";
import { Route as AuthRoute } from "@/routes/(auth)/route";

interface CollectionInviteModalProps {
  invitationId?: string;
}

export function CollectionInviteModal(props: CollectionInviteModalProps) {
  const { setActiveCollectionId } = useStore(
    useShallow((state) => ({
      setActiveCollectionId: state.collections.setActiveCollectionId,
    }))
  );
  const { invitationId } = props;
  const {
    data: invitation,
    isLoading: isInvitationLoading,
    error: invitationError,
    isError: isInvitationError,
  } = useInvitationQuery(invitationId);
  const { mutate: acceptInvitation, isPending: isAcceptingInvitation } =
    useAcceptCollectionInvitationMutation(
      invitation?.collectionId ?? "",
      invitationId ?? ""
    );

  const { mutate: rejectInvitation, isPending: isRejectingInvitation } =
    useRejectCollectionInvitationMutation(
      invitation?.collectionId ?? "",
      invitationId ?? ""
    );

  const navigate = AuthRoute.useNavigate();
  const isMobile = useBreakpointSM();
  const DialogComponents = getDialogComponents(isMobile);

  const open = invitationId !== undefined;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      navigate({ search: { invitation: undefined } });
    }
  };

  const handleAcceptInvitation = () => {
    acceptInvitation(undefined, {
      onSuccess: () => {
        handleOpenChange(false);

        toast.success(
          `You have joined the collection "${invitation?.collectionTitle}"`
        );

        if (invitation?.collectionId) {
          setActiveCollectionId(invitation.collectionId);
        }
      },
      onError: (error) => {
        toast.error("Failed to accept invitation", {
          description: error.message,
        });
      },
    });
  };

  const handleRejectInvitation = () => {
    rejectInvitation(undefined, {
      onSuccess: () => {
        handleOpenChange(false);

        toast.info(
          `You have rejected the invitation to join the collection "${invitation?.collectionTitle}"`
        );
      },
      onError: (error) => {
        toast.error("Failed to reject invitation", {
          description: error.message,
        });
      },
    });
  };

  return (
    <>
      <AlertDialog
        open={open && isInvitationError}
        onOpenChange={handleOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>
              {invitationError?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DialogComponents.Dialog
        open={open && !isInvitationError}
        onOpenChange={handleOpenChange}
      >
        <DialogComponents.DialogContent>
          <DialogComponents.DialogHeader>
            <DialogComponents.DialogTitle>
              {isInvitationLoading ? (
                <Skeleton className="h-6 w-48" />
              ) : (
                `Invite to ${invitation?.collectionTitle}`
              )}
            </DialogComponents.DialogTitle>
            {!isInvitationLoading && (
              <DialogComponents.DialogDescription>
                You have been invited to{" "}
                <strong>{invitation?.collectionTitle}</strong> collection by{" "}
                <strong>{invitation?.inviterName}</strong>.
              </DialogComponents.DialogDescription>
            )}
            {isInvitationLoading && (
              <DialogComponents.DialogDescription asChild>
                <Skeleton className="h-6 w-48" />
              </DialogComponents.DialogDescription>
            )}
          </DialogComponents.DialogHeader>
          <DialogComponents.DialogFooter>
            <Button
              variant="destructive"
              disabled={
                isInvitationLoading ||
                isRejectingInvitation ||
                isAcceptingInvitation
              }
              onClick={handleRejectInvitation}
            >
              {isRejectingInvitation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Reject"
              )}
            </Button>
            <Button
              variant="outline"
              disabled={
                isInvitationLoading ||
                isRejectingInvitation ||
                isAcceptingInvitation
              }
              onClick={handleAcceptInvitation}
            >
              {isAcceptingInvitation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Accept Invitation"
              )}
            </Button>
          </DialogComponents.DialogFooter>
        </DialogComponents.DialogContent>
      </DialogComponents.Dialog>
    </>
  );
}
