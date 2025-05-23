import { User } from "@repo/db";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/authClient";
import { invalidateSessionQuery } from "./useSessionQuery";

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["updateUser"],
    mutationFn: (user: Partial<User>) => authClient.updateUser(user),
    onSuccess: () => {
      invalidateSessionQuery(queryClient);
    },
  });
}
