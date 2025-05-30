import { useQuery } from "@tanstack/react-query";
import { ApiService } from "@/services/ApiService";

export const QUERY_KEY = ["jwt"];

export const queryOptions = {
  queryKey: QUERY_KEY,
  queryFn: async () => {
    const jwt = await ApiService.getJWT();
    return jwt;
  },
  staleTime: 1000 * 60 * 5, // 15 minutes
  refetchInterval: 1000 * 60 * 4, // 14 minutes
  refetchIntervalInBackground: true,
};

export function useJWT() {
  const query = useQuery(queryOptions);

  return query;
}
