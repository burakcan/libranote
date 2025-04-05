import { Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { useStore } from "@/hooks/useStore";

export function CreateCollectionButton() {
  const { data: session } = useSessionQuery();
  const userId = session?.user.id;

  const createCollection = useStore(
    (state) => state.collections.createCollection
  );

  const handleClick = () => {
    if (!userId) {
      return;
    }

    createCollection("New Collection", userId);
  };

  return (
    <Button disabled={!userId} onClick={handleClick} variant="outline">
      <Folder className="h-4 w-4 mr-1" />
      New
    </Button>
  );
}
