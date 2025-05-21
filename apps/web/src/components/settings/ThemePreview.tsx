interface ThemePreviewProps {
  theme: string;
  isDark?: boolean;
}

export function ThemePreview({ theme, isDark = false }: ThemePreviewProps) {
  // Map theme names to color values
  const getThemeColors = (themeName: string, isDark: boolean) => {
    const themeMap: Record<
      string,
      { primary: string; secondary: string; accent: string; background: string }
    > = {
      default: isDark
        ? {
            primary: "#0ea5e9",
            secondary: "#64748b",
            accent: "#0284c7",
            background: "#1e293b",
          }
        : {
            primary: "#0ea5e9",
            secondary: "#64748b",
            accent: "#0284c7",
            background: "#f8fafc",
          },
      rose: isDark
        ? {
            primary: "#e11d48",
            secondary: "#64748b",
            accent: "#be123c",
            background: "#1e293b",
          }
        : {
            primary: "#e11d48",
            secondary: "#64748b",
            accent: "#be123c",
            background: "#f8fafc",
          },
      green: isDark
        ? {
            primary: "#10b981",
            secondary: "#64748b",
            accent: "#059669",
            background: "#1e293b",
          }
        : {
            primary: "#10b981",
            secondary: "#64748b",
            accent: "#059669",
            background: "#f8fafc",
          },
      blue: isDark
        ? {
            primary: "#3b82f6",
            secondary: "#64748b",
            accent: "#2563eb",
            background: "#1e293b",
          }
        : {
            primary: "#3b82f6",
            secondary: "#64748b",
            accent: "#2563eb",
            background: "#f8fafc",
          },
      orange: isDark
        ? {
            primary: "#f97316",
            secondary: "#64748b",
            accent: "#ea580c",
            background: "#1e293b",
          }
        : {
            primary: "#f97316",
            secondary: "#64748b",
            accent: "#ea580c",
            background: "#f8fafc",
          },
      purple: isDark
        ? {
            primary: "#8b5cf6",
            secondary: "#64748b",
            accent: "#7c3aed",
            background: "#1e293b",
          }
        : {
            primary: "#8b5cf6",
            secondary: "#64748b",
            accent: "#7c3aed",
            background: "#f8fafc",
          },
    };

    return themeMap[themeName] || themeMap.default;
  };

  const colors = getThemeColors(theme, isDark);

  return (
    <div
      className="w-8 h-8 rounded-md border overflow-hidden flex-shrink-0"
      style={{
        background: colors.background,
      }}
    >
      <div className="flex h-full">
        <div
          style={{ background: colors.primary }}
          className="w-1/3 h-full"
        ></div>
        <div
          style={{ background: colors.accent }}
          className="w-1/3 h-full"
        ></div>
        <div
          style={{ background: colors.secondary }}
          className="w-1/3 h-full"
        ></div>
      </div>
    </div>
  );
}
