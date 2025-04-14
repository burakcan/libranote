import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { ApiService } from "@/lib/ApiService";
import { getQueryKey as getCollectionMembersQueryKey } from "./useCollectionMembersQuery";
import { ClientCollectionMember } from "@/types/Entities";

export const useInviteCollectionMemberMutation = (collectionId: string) => {
  const queryClient = useQueryClient();
  const queryKey = getCollectionMembersQueryKey(collectionId);

  return useMutation({
    mutationKey: ["inviteCollectionMember", collectionId],
    mutationFn: (data: {
      email: string;
      role: ClientCollectionMember["role"];
    }) =>
      ApiService.inviteCollectionMember(collectionId, data.email, data.role),
    onSuccess: async (newCollaborator) => {
      await queryClient.cancelQueries({ queryKey });

      const previousCollaborators =
        queryClient.getQueryData<ClientCollectionMember[]>(queryKey);

      queryClient.setQueryData(
        queryKey,
        (oldData: ClientCollectionMember[]) => [...oldData, newCollaborator]
      );

      return previousCollaborators;
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(queryKey, context);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
