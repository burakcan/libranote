import Avatar from "boring-avatars";
import { Github, Key, Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChangePasswordDialog } from "@/components/settings/ChangePasswordDialog";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { useAccountsListQuery } from "@/hooks/useAccountsListQuery";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { useStore } from "@/hooks/useStore";
import { useUpdateUserMutation } from "@/hooks/useUpdateUserMutation";
import {
  EXPORT_COMPLETED_EVENT,
  EXPORT_STARTED_EVENT,
  exportService,
} from "@/services/ExportService";
import { authClient } from "@/lib/authClient";
import { getUserColors } from "@/lib/utils";
import { DeleteAccountDialog } from "../DeleteAccountDialog";

export function AccountSettings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const sessionData = useSessionQuery();
  const user = sessionData.data?.user;
  const { data: accounts } = useAccountsListQuery();
  const { mutate: updateUser, isPending } = useUpdateUserMutation();
  const [isExporting, setIsExporting] = useState(exportService.isExporting);
  const { notes, collections } = useStore(
    useShallow((state) => ({
      notes: state.notes.data,
      collections: state.collections.data,
    }))
  );

  useEffect(() => {
    const handleExportStarted = () => {
      setIsExporting(true);
    };
    const handleExportCompleted = () => {
      setIsExporting(false);
    };

    exportService.addEventListener(EXPORT_STARTED_EVENT, handleExportStarted);
    exportService.addEventListener(
      EXPORT_COMPLETED_EVENT,
      handleExportCompleted
    );

    return () => {
      exportService.removeEventListener(
        EXPORT_STARTED_EVENT,
        handleExportStarted
      );
      exportService.removeEventListener(
        EXPORT_COMPLETED_EVENT,
        handleExportCompleted
      );
    };
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const hasPassword = accounts?.some(
    (account) => account.provider === "credential"
  );

  const nameValueChanged = name !== user?.name;

  const handleExportNotes = async () => {
    const promise = exportService.exportNotes(notes, collections);
    toast.promise(promise, {
      loading:
        "Exporting notes... Please keep the browser window open. You can leave this dialog.",
      success: "Notes exported successfully!",
      error: (error) => {
        console.error(error);
        return "Failed to export notes!";
      },
    });
  };

  const handleSetPassword = async () => {
    if (!user?.email) {
      return;
    }

    await authClient.forgetPassword({
      email: user.email,
      redirectTo: `${window.location.origin}/set-password`,
    });

    toast.success("Password set email sent!", {
      description: `Check your inbox at ${user.email}`,
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <SettingsSection title="Profile Information">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
          <div className="flex flex-col items-center gap-2">
            <Avatar
              name={user.id}
              key={user.id}
              size={96}
              className="outline-1 outline-offset-1 rounded-full mt-6"
              variant="beam"
              colors={[...getUserColors(user.id)]}
            />
          </div>

          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {nameValueChanged && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateUser(
                          {
                            name: name,
                          },
                          {
                            onSuccess: () => {
                              toast.success("Name updated successfully!");
                            },
                            onError: () => {
                              toast.error("Failed to update name!");
                            },
                          }
                        );
                      }}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setName(user.name);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Input id="email" type="email" value={email} disabled />
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Password Management">
        {hasPassword && <ChangePasswordDialog />}
        {!hasPassword && (
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleSetPassword}
          >
            <Key className="h-4 w-4" />
            Set Password
          </Button>
        )}
      </SettingsSection>

      <SettingsSection title="Connected Accounts">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center gap-3">
              <Github className="h-5 w-5" />
              <div>
                <p className="font-medium">GitHub</p>
                <p className="text-sm text-muted-foreground">johndoe</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Disconnect
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5" />
              <div>
                <p className="font-medium">Google</p>
                <p className="text-sm text-muted-foreground">
                  john.doe@gmail.com
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Disconnect
            </Button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Export Data">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Export all your notes and collections in Markdown format.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportNotes}
              disabled={isExporting}
            >
              Export as Markdown
            </Button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Account Deletion">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <DeleteAccountDialog />
        </div>
      </SettingsSection>
    </div>
  );
}
