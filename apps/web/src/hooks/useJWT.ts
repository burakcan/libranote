import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ApiService } from "@/services/ApiService";
import { useStore } from "./useStore";

export const QUERY_KEY = ["jwt"];

export const queryOptions = {
  queryKey: QUERY_KEY,
  queryFn: async () => {
    const jwt = await ApiService.getJWT();
    return jwt;
  },
  staleTime: 1000 * 60 * 1, // 15 minutes
  refetchInterval: 1000 * 55 * 1, // 14 minutes
  refetchIntervalInBackground: true,
};

export function useJWT() {
  const setJWT = useStore((state) => state.setJWT);

  const query = useQuery(queryOptions);

  useEffect(() => {
    setJWT(query.data || "");
  }, [query.data, setJWT]);

  return query;
}
