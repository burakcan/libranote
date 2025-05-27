import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useContext } from "react";
import { AccountSettings } from "@/components/settings/sections/AccountSettings";
import { AppearanceSettings } from "@/components/settings/sections/AppearanceSettings";
import { SecuritySettings } from "@/components/settings/sections/SecuritySettings";
import { SyncSettings } from "@/components/settings/sections/SyncSettings";
import { SetTitleContext } from "./settings";

export const Route = createFileRoute("/(authenticated)/settings/$section")({
  component: RouteComponent,
});

function RouteComponent() {
  const { section } = Route.useParams();
  const setTitle = useContext(SetTitleContext);

  useEffect(() => {
    switch (section) {
      case "account":
        setTitle?.("Account");
        break;
      case "appearance":
        setTitle?.("Appearance");
        break;
      case "sync":
        setTitle?.("Sync & Network");
        break;
      case "security":
        setTitle?.("Security");
        break;
      default:
        setTitle?.("Settings");
        break;
    }
  }, [section, setTitle]);

  return (
    <div className="flex flex-col flex-1 h-full max-h-full p-4">
      {section === "account" && <AccountSettings />}
      {section === "appearance" && <AppearanceSettings />}
      {section === "sync" && <SyncSettings />}
      {section === "security" && <SecuritySettings />}
    </div>
  );
}
