import { Editor } from "@tiptap/core";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EditorStatusBar } from "@/components/noteEditor/EditorStatusBar";
import EditorToolbar from "@/components/noteEditor/EditorToolbar";
import { useBreakpointSM } from "@/hooks/useBreakpointSM";
import { EditorMobileHeader } from "./EditorMobileHeader";

export function EditorSkeleton() {
  const isMobile = useBreakpointSM();

  const fakeEditor = useMemo(() => {
    return {
      isActive: (what: string) => {
        if (what === "noteTitle") {
          return true;
        }

        return false;
      },
      chain: () => ({
        run: () => {},
      }),
      can: () => false,
      storage: {
        collaborationCursor: {
          users: [],
        },
      },
    };
  }, []);

  return (
    <div className="absolute flex flex-col left-0 top-0 w-full h-full bg-background">
      {isMobile && (
        <EditorMobileHeader editor={fakeEditor as unknown as Editor} />
      )}
      <div className="w-full hidden sm:block">
        <EditorToolbar editor={fakeEditor as unknown as Editor} />
      </div>
      <div className="flex-1 min-h-0 flex flex-col p-4 pt-6 sm:p-16 gap-4">
        <Skeleton className="w-96 max-w-full h-8" />
        <Skeleton className="w-86 max-w-1/2 h-8" />
      </div>
      <div className="w-screen block sm:hidden overflow-y-hidden overflow-x-auto border-t border-border/50 bg-accent/10">
        <EditorToolbar editor={fakeEditor as unknown as Editor} isMobile />
      </div>
      <div className="hidden sm:block">
        <EditorStatusBar editor={fakeEditor as unknown as Editor} note={null} />
      </div>
    </div>
  );
}
