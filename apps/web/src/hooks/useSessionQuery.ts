import { QueryClient, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { authClient } from "@/lib/authClient";

export const QUERY_KEY = ["session"];

export const queryOptions: UseQueryOptions<
  Awaited<ReturnType<typeof authClient.getSession>>
> = {
  queryKey: QUERY_KEY,
  queryFn: async () => {
    const result = await authClient.getSession();
    return result.data;
  },
  staleTime: 5 * 60 * 1000,
};

export function useSessionQuery() {
  return useQuery(queryOptions);
}

export function invalidateSessionQuery(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEY });
}
