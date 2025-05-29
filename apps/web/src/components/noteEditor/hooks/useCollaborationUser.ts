import { useMemo } from "react";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { getUserColors } from "@/lib/utils";

interface CollaborationUser {
  name?: string;
  id?: string;
  color: string;
}

export const useCollaborationUser = (): CollaborationUser => {
  const { data: sessionData } = useSessionQuery();

  return useMemo(() => {
    return {
      name: sessionData?.user.name,
      id: sessionData?.user.id,
      color: getUserColors(sessionData?.user.id ?? "")[0],
    };
  }, [sessionData]);
};
