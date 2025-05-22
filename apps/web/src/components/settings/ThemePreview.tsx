import { cn } from "@/lib/utils";

interface ThemePreviewProps {
  theme: string;
  isDark?: boolean;
}

export function ThemePreview({ theme, isDark = false }: ThemePreviewProps) {
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-md border overflow-hidden flex-shrink-0",
        isDark && "dark",
        `theme-${theme}`
      )}
    >
      <div className="flex h-full">
        <div className="w-1/3 h-full bg-primary"></div>
        <div className="w-1/3 h-full bg-accent"></div>
        <div className="w-1/3 h-full bg-secondary"></div>
      </div>
    </div>
  );
}
