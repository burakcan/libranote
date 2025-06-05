import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiService } from "@/services/ApiService";
import { authClient } from "@/lib/authClient";

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionToken: string) => {
      await authClient.revokeSession({ token: sessionToken });
      await ApiService.triggerClientSessionRefresh();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error) => {
      console.error("Failed to revoke session:", error);
    },
  });
}

export function useRevokeOtherSessionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authClient.revokeOtherSessions();
      await ApiService.triggerClientSessionRefresh();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error) => {
      console.error("Failed to revoke other sessions:", error);
    },
  });
}
