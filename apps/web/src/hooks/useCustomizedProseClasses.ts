import { useMemo } from "react";
import { useSetting } from "./useSetting";

export const useCustomizedProseClasses = () => {
  const fontSize = useSetting("appearance.fontSize").value;
  const headingFont = useSetting("appearance.headingFontFamily").value;
  const contentFont = useSetting("appearance.contentFontFamily").value;
  const codeFont = useSetting("appearance.codeFontFamily").value;

  return useMemo(
    () => ({
      ["prose-base"]: fontSize === "small",
      ["prose-lg"]: fontSize === "medium",
      ["prose-xl"]: fontSize === "large",
      [`prose-headings_font-${headingFont}`]: headingFont !== "system",
      [`prose-p_font-${contentFont}`]: contentFont !== "system",
      [`prose-code_font-${codeFont}`]: codeFont !== "system",
      [`prose-pre_font-${codeFont}`]: codeFont !== "system",
    }),
    [fontSize, headingFont, contentFont, codeFont]
  );
};
