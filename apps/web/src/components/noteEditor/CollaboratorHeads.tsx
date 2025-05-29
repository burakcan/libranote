import { Editor } from "@tiptap/react";
import Avatar from "boring-avatars";
import { AnimatePresence, motion } from "motion/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getUserColors } from "@/lib/utils";

interface CollaboratorHeadsProps {
  editor: Editor | null;
}

export function CollaboratorHeads(props: CollaboratorHeadsProps) {
  const { editor } = props;
  const collaborators:
    | (
        | {
            clientId: string;
            name: string;
            id: string;
            color: string;
          }
        | undefined
      )[]
    | undefined = editor?.storage.collaborationCursor?.users;

  return (
    <motion.div className="flex flex-auto items-center justify-end gap-2">
      <AnimatePresence mode="popLayout">
        {collaborators?.map(
          (user) =>
            user && (
              <motion.div
                key={user.clientId}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{
                  damping: 10,
                  stiffness: 100,
                  type: "spring",
                }}
                layout
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar
                      name={user.id}
                      key={user.clientId}
                      size={28}
                      className="outline-1 outline-offset-1 rounded-full"
                      style={{ outlineColor: user.color }}
                      variant="beam"
                      colors={[...getUserColors(user.id ?? "")]}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="font-semibold">
                    {user.name}
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            )
        )}
      </AnimatePresence>
    </motion.div>
  );
}
