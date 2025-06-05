import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NoteEditorPanel } from "@/components/noteEditor/NoteEditorPanel";
import { EditorSkeleton } from "@/components/noteEditor/NoteEditorPanelSkeleton";
import { useStore } from "@/hooks/useStore";
import { useSyncContext } from "@/hooks/useSyncContext";

export const Route = createFileRoute("/(authenticated)/notes/$noteId")({
  component: RouteComponent,
  notFoundComponent: () => <div>Note not found</div>,
});

function RouteComponent() {
  const { noteId } = Route.useParams();
  const navigate = useNavigate();
  const { status: syncStatus } = useSyncContext();
  const note = useStore((state) =>
    state.notes.data.find((note) => note.id === noteId)
  );

  const [editorReady, setEditorReady] = useState(false);
  const [renderEditor, setRenderEditor] = useState(false);

  useEffect(() => {
    if (syncStatus.isSynced && !note) {
      navigate({ to: "/notes" });
    }
  }, [syncStatus.isSynced, note, navigate]);

  useEffect(() => {
    setRenderEditor(false);
    setEditorReady(false);

    const animationFrame = requestAnimationFrame(() => {
      setRenderEditor(true);
    });

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [noteId]);

  return (
    <div className="flex flex-col flex-1 h-full max-h-full relative sm:pt-2 sm:pl-2 lg:pt-4 lg:px-4 bg-gradient-to-t from-background to-accent/30">
      {renderEditor && (
        <NoteEditorPanel
          key={noteId}
          noteId={noteId}
          setEditorReady={setEditorReady}
        />
      )}

      {!editorReady && <EditorSkeleton />}
    </div>
  );
}
