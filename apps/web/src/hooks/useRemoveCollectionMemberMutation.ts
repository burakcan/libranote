import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiService } from "@/lib/ApiService";
import { getQueryKey as getCollectionMembersQueryKey } from "./useCollectionMembersQuery";
import { ClientCollectionMember } from "@/types/Entities";

export const useRemoveCollectionMemberMutation = (collectionId: string) => {
  const queryClient = useQueryClient();
  const queryKey = getCollectionMembersQueryKey(collectionId);

  return useMutation({
    mutationKey: ["removeCollectionMember", collectionId],
    mutationFn: (userId: string) =>
      ApiService.removeCollectionMember(collectionId, userId),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey });

      const previousCollaborators =
        queryClient.getQueryData<ClientCollectionMember[]>(queryKey);

      queryClient.setQueryData(queryKey, (oldData: ClientCollectionMember[]) =>
        oldData.filter((member) => member.id !== userId)
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
