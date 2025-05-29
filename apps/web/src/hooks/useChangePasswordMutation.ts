import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiService } from "@/services/ApiService";
import { authClient } from "@/lib/authClient";

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions: boolean;
}

export function useChangePasswordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
      revokeOtherSessions,
    }: ChangePasswordData) => {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });

      // Check if the result indicates an error
      if (result.error) {
        throw new Error(result.error.message || "Failed to change password");
      }

      // Only call session refresh if password change was successful
      await ApiService.triggerClientSessionRefresh();

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error) => {
      console.error("Failed to change password:", error);
    },
  });
}
