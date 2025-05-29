import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/authClient";

export function useSessionsQuery() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const result = await authClient.listSessions();
      return result.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}
