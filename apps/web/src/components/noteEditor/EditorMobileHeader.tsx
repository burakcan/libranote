import { useRouter } from "@tanstack/react-router";
import { Editor } from "@tiptap/core";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDeviceOS } from "@/lib/utils";
import { CollaboratorHeads } from "./CollaboratorHeads";

interface EditorMobileHeaderProps {
  editor: Editor | null;
}

export function EditorMobileHeader({ editor }: EditorMobileHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex p-4 pl-2 pr-2 gap-2 h-14 justify-between items-center border-b border-sidebar-border/70 bg-accent">
      <Button
        variant="outline"
        className="h-10"
        onClick={() => {
          if (getDeviceOS() === "ios") {
            document.startViewTransition({
              // @ts-expect-error - dom type definitions are not up to date
              update: () => {
                router.history.back();
              },
              types: ["navigate-backward"],
            });
          } else {
            router.history.back();
          }
        }}
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>

      {editor && <CollaboratorHeads editor={editor} />}
    </div>
  );
}
