import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { NotesPanel } from "@/components/notes/NotesPanel";
import { useBreakpointSM } from "@/hooks/useBreakpointSM";

export const Route = createFileRoute("/(authenticated)/notes/")({
  component: RouteComponent,
});

function RouteComponent() {
  const isMobile = useBreakpointSM();

  return (
    <div className="flex flex-col flex-1 h-full max-h-full">
      {isMobile ? (
        <div className="flex flex-1 h-full">
          <NotesPanel />
        </div>
      ) : (
        <div className="hidden sm:flex flex-col items-center justify-center h-full w-full p-6 text-center">
          <div className="p-3 rounded-full bg-muted mb-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No note selected</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Select a note or create a new one
          </p>
        </div>
      )}
    </div>
  );
}
