import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/note/EmptyState";

export const Route = createFileRoute("/(authenticated)/notes/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <EmptyState />;
}
