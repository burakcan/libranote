import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CollectionsPanel } from "@/components/collections/CollectionsPanel";
import { Header } from "@/components/header/Header";
import { NotesPanel } from "@/components/notes/NotesPanel";
import { useBreakpointSM } from "@/hooks/useBreakpointSM";

export const Route = createFileRoute("/(authenticated)/notes")({
  component: RouteComponent,
  notFoundComponent: () => <div>Notes not found</div>,
});

function RouteComponent() {
  const isMobile = useBreakpointSM();

  return (
    <main className="h-dvh flex relative flex-col [view-transition-name:main-content]">
      {!isMobile && <Header />}
      <div className="flex flex-1 min-h-0">
        {!isMobile && (
          <>
            <CollectionsPanel />
            <NotesPanel />
          </>
        )}
        <div className="flex-1 flex flex-col h-full max-h-full max-w-screen min-w-0">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
