import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { createContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useManageThemes } from "@/hooks/useManageThemes";
import { useViewportSize } from "@/hooks/useViewportSize";
import { getDeviceOS } from "@/lib/utils";

export const Route = createFileRoute("/(authenticated)/settings")({
  component: RouteComponent,
});

export const SetTitleContext = createContext<((title: string) => void) | null>(
  null
);

function RouteComponent() {
  const [title, setTitle] = useState("Settings");
  useManageThemes();

  const viewportSize = useViewportSize();

  useEffect(() => {
    document.body.style.height = `${viewportSize?.[1]}px`;
  }, [viewportSize]);

  const router = useRouter();

  return (
    <main
      className={
        "flex flex-col [view-transition-name:main-content] fixed top-0 inset-x-0 transition-[height] ease-in-out duration-200 bg-background"
      }
      style={{
        height: viewportSize?.[1],
      }}
    >
      <div className="flex flex-col flex-1 h-full max-h-full">
        <div className="flex flex-1 h-full">
          <aside className="w-full sm:w-72 2xl:w-96 flex flex-col border-r border-sidebar-border/70 bg-sidebar">
            <div className="sticky top-0 z-10 flex p-4 pl-2 pr-2 gap-2 h-14 justify-between items-center border-b border-sidebar-border/70 bg-accent">
              <div className="flex-1">
                <Button
                  variant="outline"
                  className="h-10"
                  onClick={() => {
                    if (getDeviceOS() === "ios") {
                      document.startViewTransition({
                        // @ts-expect-error - dom type definitions are not up to date
                        update: () => {
                          router.history.back();
                        },
                        types: ["navigate-backward"],
                      });
                    } else {
                      router.history.back();
                    }
                  }}
                >
                  <ChevronLeft className="size-4" />
                  Back
                </Button>
              </div>
              <div className="text-base font-medium text-center">
                {title || "Settings"}
              </div>
              <div className="flex-1" />
            </div>
            <ScrollArea className="flex-1 min-h-0 ">
              <SetTitleContext.Provider value={setTitle}>
                <Outlet />
              </SetTitleContext.Provider>
            </ScrollArea>
          </aside>
        </div>
      </div>
    </main>
  );
}
