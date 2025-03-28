import { useMemo } from "react";
import { useStore } from "@/components/providers/StoreProvider";

export const useCollectionNotes = (
  collectionId: ClientCollection["id"] | null
): ClientNote[] => {
  const allNotes = useStore((state) => state.notes.data);

  return useMemo(() => {
    return collectionId
      ? allNotes.filter((note) => note.collectionId === collectionId)
      : allNotes;
  }, [collectionId, allNotes]);
};
