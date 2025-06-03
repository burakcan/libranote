import { QueryClient, useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/authClient";

export const QUERY_KEY = ["accounts"];

export function useAccountsListQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await authClient.listAccounts();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function invalidateAccountsListQuery(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEY });
}
