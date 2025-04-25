import { useContext } from "react";
import { CollectionListContext } from "@/components/collections/CollectionListContext";

export function useCollectionListContext() {
  const context = useContext(CollectionListContext);

  if (!context) {
    throw new Error(
      "useCollectionListContext must be used within a CollectionListContextProvider"
    );
  }

  return context;
}
