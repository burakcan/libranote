import { FaCircle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Collection } from "@/lib/prisma";

export function CollectionListItem({ collection }: { collection: Collection }) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start bg-accent text-accent-foreground dark:bg-accent/50"
    >
      <FaCircle className="size-3 text-muted-foreground" />
      {collection.title}
    </Button>
  );
}
