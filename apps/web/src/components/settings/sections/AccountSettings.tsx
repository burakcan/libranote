"use client";

import Avatar from "boring-avatars";
import { Github, Mail } from "lucide-react";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { getUserColors } from "@/lib/utils";

export function AccountSettings() {
  const [name, setName] = useState("John Doe");
  const [email] = useState("john.doe@example.com");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const sessionData = useSessionQuery();
  const user = sessionData.data?.user;

  return (
    <div className="space-y-6">
      <SettingsSection title="Profile Information">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
          <div className="flex flex-col items-center gap-2">
            <Avatar
              name={user.id}
              key={user.clientId}
              size={96}
              className="outline-1 outline-offset-1 rounded-full mt-6"
              style={{ outlineColor: user.color }}
              variant="beam"
              colors={[...getUserColors(user.id)]}
            />
          </div>

          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Input id="email" value={email} disabled />
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Password Management">
        <Button>Change Password</Button>
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
            Export all your notes and collections in JSON or Markdown format.
          </p>
          <div className="flex gap-2">
            <Button variant="outline">Export as JSON</Button>
            <Button variant="outline">Export as Markdown</Button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Account Deletion">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Account
          </Button>
        </div>
      </SettingsSection>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all of your data from our servers.
              <div className="mt-4">
                <Label htmlFor="confirm">Type DELETE to confirm</Label>
                <Input id="confirm" className="mt-2" />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
