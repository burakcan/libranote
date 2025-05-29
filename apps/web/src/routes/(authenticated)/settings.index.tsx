import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useContext, useEffect } from "react";
import { MobileSettingsList } from "@/components/settings/MobileSettings";
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

  const handleNavigateToSection = (section: string) => {
    document.startViewTransition({
      // @ts-expect-error - dom type definitions are not up to date
      update: () => {
        navigate({ to: "/settings/$section", params: { section } });
      },
      types: ["navigate-forward"],
    });
  };

  return <MobileSettingsList onNavigateToSection={handleNavigateToSection} />;
}
