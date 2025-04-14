"use client";

import { Loader2, Mail, Send, X } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCollectionMembersQuery } from "@/hooks/useCollectionMembersQuery";
import { useInviteCollectionMemberMutation } from "@/hooks/useInviteCollectionMemberMutation";
import { useRemoveCollectionMemberMutation } from "@/hooks/useRemoveCollectionMemberMutation";
import { getInitials } from "@/lib/utils";
import { ClientCollectionMember } from "@/types/Entities";

interface SharingModalProps {
  setOpen?: (open: boolean) => void;
  open?: boolean;
  collectionId: string;
}

export default function CollectionSharingModal(props: SharingModalProps) {
  const { setOpen, open, collectionId } = props;
  const [newEmail, setNewEmail] = useState("");
  const [newRole] = useState<ClientCollectionMember["role"]>("EDITOR");

  const { data: members, isLoading } = useCollectionMembersQuery(
    collectionId,
    open ?? false
  );

  const sortedMembers = useMemo(() => {
    return members?.sort((a, b) => {
      if (a.role === "OWNER") return -1;
      if (b.role === "OWNER") return 1;
      return 0;
    });
  }, [members]);

  const { mutate: inviteCollaborator, isPending: isInviting } =
    useInviteCollectionMemberMutation(collectionId);

  const { mutate: removeCollaborator } =
    useRemoveCollectionMemberMutation(collectionId);

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();

    inviteCollaborator({
      email: newEmail,
      role: newRole,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share this collection</DialogTitle>
          <DialogDescription>Invite people to collaborate</DialogDescription>
        </DialogHeader>

        {sortedMembers.length > 0 && (
          <div className="py-4">
            <h4 className="text-sm font-medium mb-3">People with access</h4>
            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2">
              {sortedMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role !== "OWNER" ? (
                      <p className="text-xs text-muted-foreground">
                        Collaborator
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Owner</p>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeCollaborator(member.userId)}
                      disabled={member.role === "OWNER"}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="py-4 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}

        <form
          onSubmit={handleAddCollaborator}
          className="flex items-end gap-2 py-2"
        >
          <div className="grid gap-2 flex-1">
            <Label htmlFor="email" className="text-sm">
              Add people
            </Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                placeholder="Email address"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
          </div>
          <Button disabled={isInviting} type="submit">
            {isInviting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Invite
          </Button>
        </form>

        <DialogFooter className="sm:justify-start">
          <div className="text-xs text-muted-foreground">
            People you invite will receive an email notification.
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
