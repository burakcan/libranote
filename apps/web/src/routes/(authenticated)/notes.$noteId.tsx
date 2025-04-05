import { createFileRoute } from "@tanstack/react-router";
import { NotePanel } from "@/components/note/NotePanel";

export const Route = createFileRoute("/(authenticated)/notes/$noteId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { noteId } = Route.useParams();

  return <NotePanel noteId={noteId} />;
}
