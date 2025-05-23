import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userDatabaseService } from "@/services/db/userDatabaseService";
import { yjsDB } from "@/services/db/yIndexedDb";
import { SearchService } from "@/services/SearchService";
import { authClient } from "@/lib/authClient";
import { invalidateSessionQuery } from "./useSessionQuery";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["logout"],
    mutationFn: async () => {
      await yjsDB.delete();
      await SearchService.notesDb.destroy();
      await userDatabaseService.destroy();
      await authClient.signOut();
    },
    onSuccess: () => {
      invalidateSessionQuery(queryClient);
      window.location.reload();
    },
  });
}
