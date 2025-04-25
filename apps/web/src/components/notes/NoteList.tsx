import { Smile } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/hooks/useStore";
import { useCollectionNotes } from "@/lib/store/useCollectionNotes";
import { NoteListItem } from "./NoteListItem";

export function NoteList() {
  const activeCollectionId = useStore(
    (state) => state.collections.activeCollectionId
  );
  const activeCollectionIdNotes = useCollectionNotes(activeCollectionId);

  return (
    <ScrollArea key={activeCollectionId} className="px-2 flex-1 min-h-0 ">
      <AnimatePresence>
        {activeCollectionIdNotes.length > 0 ? (
          <>
            {activeCollectionIdNotes.map((note) => (
              <motion.div key={note.id} layout className="last:mb-24">
                <NoteListItem note={note} />
              </motion.div>
            ))}
            {activeCollectionIdNotes.length > 10 && (
              <div className="h-24 w-full flex items-center justify-center text-primary-foreground">
                <Smile className="w-12 h-12" />
              </div>
            )}
          </>
        ) : (
          <div className="text-muted-foreground text-sm px-4 sm:px-2 py-4">
            No notes in this collection
          </div>
        )}
      </AnimatePresence>
    </ScrollArea>
  );
}
