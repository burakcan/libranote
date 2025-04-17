import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/(authenticated)/notes/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center">
        <div className="p-3 rounded-full bg-muted mb-4">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No note selected</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Select a note or create a new one
        </p>
      </div>
    </div>
  );
}
