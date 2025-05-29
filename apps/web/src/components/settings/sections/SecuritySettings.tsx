import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { useRevokeOtherSessionsMutation } from "@/hooks/useRevokeOtherSessionsMutation";
import { useRevokeSessionMutation } from "@/hooks/useRevokeSessionMutation";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { useSessionsQuery } from "@/hooks/useSessionsQuery";
import { parseUserAgent, formatLastActive } from "@/lib/sessionUtils";

export function SecuritySettings() {
  const { data: currentSession } = useSessionQuery();
  const { data: sessions, isLoading, error } = useSessionsQuery();
  const revokeSessionMutation = useRevokeSessionMutation();
  const revokeOtherSessionsMutation = useRevokeOtherSessionsMutation();

  const handleRevokeSession = (sessionToken: string) => {
    revokeSessionMutation.mutate(sessionToken);
  };

  const handleRevokeOtherSessions = () => {
    revokeOtherSessionsMutation.mutate();
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
          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-12 gap-2 p-3 bg-muted font-medium text-sm">
              <div className="col-span-5 sm:col-span-4">Device</div>
              <div className="col-span-4 sm:col-span-3">Location</div>
              <div className="col-span-3">Last Active</div>
              <div className="hidden sm:block sm:col-span-2"></div>
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
                    className="grid grid-cols-12 gap-2 p-3 border-t text-sm items-center"
                  >
                    <div className="col-span-5 sm:col-span-4 truncate">
                      {parseUserAgent(session.userAgent ?? "")}
                    </div>
                    <div className="col-span-4 sm:col-span-3 truncate">
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
                    <div className="hidden sm:block sm:col-span-2 text-right">
                      {!isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeSession(session.token)}
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
              onClick={handleRevokeOtherSessions}
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
    </div>
  );
}
