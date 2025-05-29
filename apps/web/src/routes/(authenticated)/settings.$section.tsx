import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useContext } from "react";
import { MobileSettingsSection } from "@/components/settings/MobileSettingsSection";
import type { SettingsTab } from "@/components/settings/types";
import { getSectionInfo } from "@/components/settings/utils";
import { SetTitleContext } from "./settings";

export const Route = createFileRoute("/(authenticated)/settings/$section")({
  component: RouteComponent,
});

function RouteComponent() {
  const { section } = Route.useParams();
  const setTitle = useContext(SetTitleContext);

  useEffect(() => {
    const sectionInfo = getSectionInfo(section as SettingsTab);
    setTitle?.(sectionInfo?.label || "Settings");
  }, [section, setTitle]);

  return <MobileSettingsSection section={section as SettingsTab} />;
}
