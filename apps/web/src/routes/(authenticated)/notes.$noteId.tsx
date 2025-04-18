import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { NoteEditorPanel } from "@/components/noteEditor/NoteEditorPanel";
import { useStore } from "@/hooks/useStore";
import { useSyncContext } from "@/hooks/useSyncContext";

export const Route = createFileRoute("/(authenticated)/notes/$noteId")({
  component: RouteComponent,
  notFoundComponent: () => <div>Note not found</div>,
});

function RouteComponent() {
  const { noteId } = Route.useParams();
  const navigate = useNavigate();
  const { isSynced } = useSyncContext();
  const note = useStore((state) =>
    state.notes.data.find((note) => note.id === noteId)
  );

  useEffect(() => {
    if (isSynced && !note) {
      navigate({ to: "/notes" });
    }
  }, [isSynced, note, navigate]);

  return <NoteEditorPanel key={noteId} noteId={noteId} />;
}
