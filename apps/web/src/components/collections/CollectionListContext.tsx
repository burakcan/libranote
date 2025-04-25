import { createContext, useState } from "react";
import CollectionSharingModal from "./CollectionSharingModal";
import { CollectionsSideSheet } from "./CollectionsSideSheet";

export type CollectionListContextType = {
  showShareModal: (collectionId: string) => void;
  onShareModalOpenChange: (open: boolean) => void;
  isShareModalOpen: boolean;

  onSideSheetOpenChange: (open: boolean) => void;
  isSideSheetOpen: boolean;
};

export const CollectionListContext = createContext<CollectionListContextType>({
  showShareModal: () => {},
  onShareModalOpenChange: () => {},
  isShareModalOpen: false,

  onSideSheetOpenChange: () => {},
  isSideSheetOpen: false,
});

export function CollectionListContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [shareModalCollectionId, setShareModalCollectionId] = useState<
    string | undefined
  >(undefined);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);

  return (
    <CollectionListContext.Provider
      value={{
        isShareModalOpen,
        showShareModal: (collectionId) => {
          console.log("showShareModal", collectionId);
          setShareModalCollectionId(collectionId);
          setIsShareModalOpen(true);
        },
        onShareModalOpenChange: (open) => setIsShareModalOpen(open),

        isSideSheetOpen,
        onSideSheetOpenChange: (open) => setIsSideSheetOpen(open),
      }}
    >
      <CollectionSharingModal
        open={isShareModalOpen}
        setOpen={setIsShareModalOpen}
        collectionId={shareModalCollectionId ?? ""}
      />
      <CollectionsSideSheet
        open={isSideSheetOpen}
        onOpenChange={setIsSideSheetOpen}
      />
      {children}
    </CollectionListContext.Provider>
  );
}
