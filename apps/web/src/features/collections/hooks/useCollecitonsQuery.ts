import { useQuery } from "@tanstack/react-query";

export const collectionsQueryKey = ["collections"];

export function useCollectionsQuery() {
  return useQuery({
    queryKey: collectionsQueryKey,
    queryFn: () => fetch("/api/collections").then((res) => res.json()),
  });
}
