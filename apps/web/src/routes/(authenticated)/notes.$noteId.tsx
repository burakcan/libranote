import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { NoteEditor } from "@/components/noteEditor/NoteEditor";
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

  return <NoteEditor key={noteId} noteId={noteId} />;
}
