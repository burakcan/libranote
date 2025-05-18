import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CollectionsPanel } from "@/components/collections/CollectionsPanel";
import { Header } from "@/components/header/Header";
import { NotesPanel } from "@/components/notes/NotesPanel";
import { useBreakpointSM } from "@/hooks/useBreakpointSM";
import { useIosScrollHack } from "@/hooks/useIosScrollHack";
import { useViewportSize } from "@/hooks/useViewportSize";

export const Route = createFileRoute("/(authenticated)/notes")({
  component: RouteComponent,
  notFoundComponent: () => <div>Notes not found</div>,
});

function RouteComponent() {
  const isMobile = useBreakpointSM();
  const viewportSize = useViewportSize();

  useIosScrollHack();

  return (
    <main
      className={
        "flex flex-col [view-transition-name:main-content] fixed top-0 left-0 w-screen transition-[height] duration-200"
      }
      style={{
        height: viewportSize?.[1],
      }}
    >
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
