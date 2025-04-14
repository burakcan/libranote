import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { ApiService } from "@/lib/ApiService";
import { getQueryKey as getCollectionMembersQueryKey } from "./useCollectionMembersQuery";
import { ClientCollectionMember } from "@/types/Entities";

export const useChangeCollectionMemberRoleMutation = (collectionId: string) => {
  const queryClient = useQueryClient();
  const queryKey = getCollectionMembersQueryKey(collectionId);

  return useMutation({
    mutationKey: ["changeCollectionMemberRole", collectionId],
    mutationFn: (data: {
      userId: string;
      role: ClientCollectionMember["role"];
    }) => ApiService.updateMemberRole(collectionId, data.userId, data.role),
    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousCollaborators =
        queryClient.getQueryData<ClientCollectionMember[]>(queryKey);

      queryClient.setQueryData(queryKey, (oldData: ClientCollectionMember[]) =>
        oldData.map((member) =>
          member.id === userId ? { ...member, role } : member
        )
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
