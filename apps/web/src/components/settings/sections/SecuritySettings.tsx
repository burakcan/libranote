import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { useRevokeOtherSessionsMutation } from "@/hooks/useRevokeOtherSessionsMutation";
import { useRevokeSessionMutation } from "@/hooks/useRevokeSessionMutation";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { useSessionsQuery } from "@/hooks/useSessionsQuery";
import { parseUserAgent, formatLastActive } from "@/lib/sessionUtils";

export function SecuritySettings() {
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);
  const [showBulkRevokeDialog, setShowBulkRevokeDialog] = useState(false);

  const { data: currentSession } = useSessionQuery();
  const { data: sessions, isLoading, error } = useSessionsQuery();
  const revokeSessionMutation = useRevokeSessionMutation();
  const revokeOtherSessionsMutation = useRevokeOtherSessionsMutation();

  const handleRevokeSessionClick = (sessionToken: string) => {
    setSessionToRevoke(sessionToken);
  };

  const handleConfirmRevokeSession = () => {
    if (sessionToRevoke) {
      revokeSessionMutation.mutate(sessionToRevoke, {
        onSuccess: () => {
          toast.success("Session revoked successfully");
        },
        onError: () => {
          toast.error("Failed to revoke session");
        },
      });
      setSessionToRevoke(null);
    }
  };

  const handleBulkRevokeClick = () => {
    setShowBulkRevokeDialog(true);
  };

  const handleConfirmBulkRevoke = () => {
    revokeOtherSessionsMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("All other sessions revoked successfully");
      },
      onError: () => {
        toast.error("Failed to revoke other sessions");
      },
    });
    setShowBulkRevokeDialog(false);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <SettingsSection title="Active Sessions">
          <div className="text-center p-6 text-muted-foreground">
            Failed to load sessions. Please try again later.
          </div>
        </SettingsSection>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsSection title="Active Sessions">
        <div className="space-y-4">
          <div className="border rounded-md overflow-auto whitespace-nowrap">
            <div className="grid grid-cols-14 gap-2 p-3 bg-muted font-medium text-sm">
              <div className="col-span-5">Device</div>
              <div className="col-span-4">Location</div>
              <div className="col-span-3">Last Active</div>
              <div className="col-span-2"></div>
            </div>

            {isLoading ? (
              <div className="p-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">
                  Loading sessions...
                </p>
              </div>
            ) : sessions && sessions.length > 0 ? (
              sessions.map((session) => {
                const isCurrent =
                  session.token === currentSession?.session?.token;
                return (
                  <div
                    key={session.id}
                    className="grid grid-cols-14 gap-2 p-3 border-t text-sm items-center"
                  >
                    <div className="col-span-5 truncate">
                      {parseUserAgent(session.userAgent ?? "")}
                    </div>
                    <div className="col-span-4 truncate">
                      {session.ipAddress || "Unknown Location"}
                    </div>
                    <div className="col-span-3 truncate">
                      {isCurrent ? (
                        <span className="text-green-600 font-medium">
                          Current session
                        </span>
                      ) : (
                        formatLastActive(session.updatedAt.toISOString(), false)
                      )}
                    </div>
                    <div className="col-span-2 text-right">
                      {!isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRevokeSessionClick(session.token)
                          }
                          disabled={revokeSessionMutation.isPending}
                        >
                          {revokeSessionMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Log Out"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                No active sessions found.
              </div>
            )}
          </div>

          {sessions && sessions.length > 1 && (
            <Button
              variant="outline"
              onClick={handleBulkRevokeClick}
              disabled={revokeOtherSessionsMutation.isPending}
            >
              {revokeOtherSessionsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Logging Out...
                </>
              ) : (
                "Log Out All Other Sessions"
              )}
            </Button>
          )}
        </div>
      </SettingsSection>

      <SettingsSection title="Privacy & Terms">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <a
              href="#"
              className="text-primary hover:underline flex items-center gap-1"
            >
              Privacy Policy
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#"
              className="text-primary hover:underline flex items-center gap-1"
            >
              Terms of Service
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </SettingsSection>

      {/* Individual Session Revocation Confirmation Dialog */}
      <AlertDialog
        open={!!sessionToRevoke}
        onOpenChange={() => setSessionToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log Out Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out this session? If this device has
              any unsynced changes to your notes, they will be lost permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRevokeSession}
              className={buttonVariants({
                variant: "destructive",
              })}
            >
              Log Out Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Session Revocation Confirmation Dialog */}
      <AlertDialog
        open={showBulkRevokeDialog}
        onOpenChange={setShowBulkRevokeDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log Out All Other Sessions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out all other sessions? This will
              immediately sign you out of all other devices. Any unsynced
              changes on those devices will be lost permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkRevoke}
              className={buttonVariants({
                variant: "destructive",
              })}
            >
              Log Out All Other Sessions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
