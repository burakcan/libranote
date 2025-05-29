import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiService } from "@/services/ApiService";
import { authClient } from "@/lib/authClient";

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
