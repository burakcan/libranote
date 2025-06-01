import { Notebook } from "lucide-react";
import { useEffect } from "react";
import { usePrefersColorScheme } from "@/hooks/usePrefersColorScheme";

export function PagePending() {
  useEffect(() => {
    document.body.classList.add("theme-monochrome");
  }, []);

  usePrefersColorScheme();

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-8 animate-in fade-in-0 duration-500">
        {/* Logo/Brand Section */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
            <div className="w-12 h-12 p-2 rounded-lg bg-primary/30 animate-pulse">
              <Notebook className="size-8 rounded-md" />
            </div>
          </div>
          {/* Subtle outer ring animation */}
          <div className="absolute inset-0 rounded-2xl border-2 border-primary/10 animate-ping [animation-duration:2s]" />
        </div>
      </div>
    </div>
  );
}
