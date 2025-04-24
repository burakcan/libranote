import { useQuery } from "@tanstack/react-query";
import { ApiService } from "@/services/ApiService";

export const getQueryKey = (collectionId: string) => [
  "collection-members",
  collectionId,
];

export const useCollectionMembersQuery = (
  collectionId: string,
  enabled: boolean
) => {
  return useQuery({
    queryKey: getQueryKey(collectionId),
    queryFn: () => ApiService.getCollectionMembers(collectionId),
    enabled,
    initialData: [],
  });
};
