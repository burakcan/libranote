import { QueryClient, useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/authClient";

export const QUERY_KEY = ["session"];

export const queryOptions = {
  queryKey: QUERY_KEY,
  queryFn: async () => {
    const result = await authClient.getSession();
    return result.data;
  },
  staleTime: 5 * 60 * 1000,
};

// We use this instead of useSession from better-auth because it fetches the
// session from the server on each use.
export function useSessionQuery() {
  return useQuery(queryOptions);
}

export function invalidateSessionQuery(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEY });
}
