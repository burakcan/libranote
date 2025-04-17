import { useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { ClientCollection, ClientNote } from "@/types/Entities";

export const UNCATEGORIZED_COLLECTION_ID = "uncategorized";
export const ALL_NOTES_COLLECTION_ID = "all-notes";

export const useCollectionNotes = (
  collectionId:
    | ClientCollection["id"]
    | typeof UNCATEGORIZED_COLLECTION_ID
    | typeof ALL_NOTES_COLLECTION_ID
): ClientNote[] => {
  const allNotes = useStore((state) => state.notes.data);

  return useMemo(() => {
    let filteredNotes: ClientNote[] = [];

    if (collectionId === UNCATEGORIZED_COLLECTION_ID) {
      filteredNotes = allNotes.filter((note) => !note.collectionId);
    } else if (collectionId === ALL_NOTES_COLLECTION_ID) {
      filteredNotes = allNotes;
    } else {
      filteredNotes = allNotes.filter(
        (note) => note.collectionId === collectionId
      );
    }

    return [...filteredNotes].sort((a, b) => {
      return (
        new Date(b.noteYDocState.updatedAt).getTime() -
        new Date(a.noteYDocState.updatedAt).getTime()
      );
    });
  }, [collectionId, allNotes]);
};
