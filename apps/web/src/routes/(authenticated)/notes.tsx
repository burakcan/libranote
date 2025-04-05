import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CollectionsPanel } from "@/components/collections/CollectionsPanel";
import { Header } from "@/components/header/Header";
import { NotesPanel } from "@/components/notes/NotesPanel";

export const Route = createFileRoute("/(authenticated)/notes")({
  component: RouteComponent,
  pendingComponent: () => (
    <main className="h-screen flex flex-col">
      <header className="h-12 flex-shrink-0 border-b border-sidebar-border/70 bg-sidebar" />
      <div className="flex flex-1">
        <aside className="w-72 flex flex-col border-r border-sidebar-border/70 bg-accent/40" />
        <aside className="w-96 flex flex-col border-r border-sidebar-border/70 bg-sidebar" />
      </div>
    </main>
  ),
});

function RouteComponent() {
  return (
    <main className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <CollectionsPanel />
        <NotesPanel />
        <Outlet />
      </div>
    </main>
  );
}
