import { useMemo } from "react";
import { useStore } from "@/components/providers/StoreProvider";
import { Note, Collection } from "@/lib/db/prisma";

export const useCollectionNotes = (
  collectionId: Collection["id"] | null
): Note[] => {
  const allNotes = useStore((state) => state.notes.data);

  return useMemo(() => {
    return collectionId
      ? allNotes.filter((note) => note.collectionId === collectionId)
      : allNotes;
  }, [collectionId, allNotes]);
};
