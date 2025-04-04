import { useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { ClientCollection, ClientNote } from "@/types/Entities";

export const useCollectionNotes = (
  collectionId: ClientCollection["id"] | null
): ClientNote[] => {
  const allNotes = useStore((state) => state.notes.data);

  return useMemo(() => {
    const filteredNotes = collectionId
      ? allNotes.filter((note) => note.collectionId === collectionId)
      : allNotes;

    return [...filteredNotes].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [collectionId, allNotes]);
};
