import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiService } from "../services/ApiService";
import { ClientCollectionMember } from "@/types/Entities";

export const QUERY_KEYS = {
  collectionInvites: (collectionId: string) => [
    "collectionInvites",
    collectionId,
  ],
  userInvites: () => ["userInvites"],
  invitation: (invitationId: string) => ["invitation", invitationId],
};

export const useCollectionInvitesQuery = (
  collectionId: string,
  enabled: boolean
) => {
  return useQuery({
    queryKey: QUERY_KEYS.collectionInvites(collectionId),
    queryFn: () => ApiService.getCollectionInvitations(collectionId),
    enabled,
    initialData: [],
  });
};

export const useUserInvitesQuery = (enabled: boolean) => {
  return useQuery({
    queryKey: QUERY_KEYS.userInvites(),
    queryFn: () => ApiService.getUserInvitations(),
    enabled,
    initialData: [],
  });
};

export const useInvitationQuery = (invitationId: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.invitation(invitationId ?? ""),
    queryFn: () => ApiService.getInvitation(invitationId ?? ""),
    retry: false,
    enabled: !!invitationId,
    initialData: undefined,
  });
};

export const useInviteCollectionMemberMutation = (collectionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["inviteCollectionMember", collectionId],
    mutationFn: (data: {
      email: string;
      role: ClientCollectionMember["role"];
      callbackUrl: string;
    }) =>
      ApiService.inviteCollectionMember(
        collectionId,
        data.email,
        data.role,
        data.callbackUrl
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.collectionInvites(collectionId),
      });
    },
  });
};

export const useCancelCollectionInvitationMutation = (collectionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      ApiService.cancelCollectionInvitation(collectionId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.collectionInvites(collectionId),
      });
    },
  });
};

export const useAcceptCollectionInvitationMutation = (
  collectionId: string,
  invitationId: string
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["acceptCollectionInvitation", collectionId, invitationId],
    mutationFn: () =>
      ApiService.acceptCollectionInvitation(collectionId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.invitation(invitationId),
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.collectionInvites(collectionId),
      });
    },
  });
};

export const useRejectCollectionInvitationMutation = (
  collectionId: string,
  invitationId: string
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["rejectCollectionInvitation", collectionId, invitationId],
    mutationFn: () =>
      ApiService.rejectCollectionInvitation(collectionId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.invitation(invitationId),
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.collectionInvites(collectionId),
      });
    },
  });
};
