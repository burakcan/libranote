import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/auth-client";

export const QUERY_KEY = ["jwt"];

export function useJWT() {
  return useQuery<string | null>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      let jwt: string | null = null;

      await authClient.getSession({
        fetchOptions: {
          onSuccess: (ctx) => {
            jwt = ctx.response.headers.get("set-auth-jwt") ?? null;
          },
        },
      });

      return jwt;
    },
  });
}
