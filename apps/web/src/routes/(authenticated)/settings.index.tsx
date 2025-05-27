import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useContext } from "react";
import { useEffect } from "react";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { SetTitleContext } from "./settings";

export const Route = createFileRoute("/(authenticated)/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  const setTitle = useContext(SetTitleContext);
  const navigate = useNavigate();

  useEffect(() => {
    setTitle?.("Settings");
  }, [setTitle]);

  return (
    <div className="flex flex-col flex-1 h-full max-h-full p-2">
      <SettingsSidebar
        onTabChange={(tab) => {
          document.startViewTransition({
            // @ts-expect-error - dom type definitions are not up to date
            update: () => {
              navigate({ to: "/settings/$section", params: { section: tab } });
            },
            types: ["navigate-forward"],
          });
        }}
        activeTab={null}
      />
    </div>
  );
}
