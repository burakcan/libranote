interface TextPreviewProps {
  fontSize: string;
  headingFont: string;
  contentFont: string;
  codeFont: string;
  lineHeight: number;
}

export function TextPreview({
  fontSize,
  headingFont,
  contentFont,
  codeFont,
  lineHeight,
}: TextPreviewProps) {
  // Map font values to actual font family CSS
  const getFontFamily = (font: string) => {
    const fontMap: Record<string, string> = {
      inter: "ui-sans-serif, system-ui, sans-serif",
      roboto: "Roboto, ui-sans-serif, system-ui, sans-serif",
      lato: "Lato, ui-sans-serif, system-ui, sans-serif",
      merriweather: "Merriweather, ui-serif, Georgia, serif",
      monospace:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    };

    return fontMap[font] || fontMap.inter;
  };

  // Map font size values to actual CSS classes
  const getFontSizeClass = (size: string) => {
    const sizeMap: Record<
      string,
      { heading: string; subheading: string; content: string }
    > = {
      small: {
        heading: "text-lg",
        subheading: "text-base",
        content: "text-sm",
      },
      medium: {
        heading: "text-xl",
        subheading: "text-lg",
        content: "text-base",
      },
      large: { heading: "text-2xl", subheading: "text-xl", content: "text-lg" },
    };

    return sizeMap[size] || sizeMap.medium;
  };

  const fontSizeClasses = getFontSizeClass(fontSize);

  return (
    <div className="p-4 border rounded-md space-y-3">
      <h2
        className={`font-bold ${fontSizeClasses.heading}`}
        style={{
          fontFamily: getFontFamily(headingFont),
          lineHeight: lineHeight,
        }}
      >
        Sample Heading
      </h2>
      <h3
        className={`font-semibold ${fontSizeClasses.subheading}`}
        style={{
          fontFamily: getFontFamily(headingFont),
          lineHeight: lineHeight,
        }}
      >
        Subheading Example
      </h3>
      <p
        className={fontSizeClasses.content}
        style={{
          fontFamily: getFontFamily(contentFont),
          lineHeight: lineHeight,
        }}
      >
        This is a preview of how your notes will look with the selected font
        settings. The text should be readable and comfortable for extended
        reading sessions. Good typography improves readability and reduces eye
        strain.
      </p>
      <pre
        className="bg-muted p-2 rounded text-sm overflow-x-auto"
        style={{
          fontFamily: getFontFamily(codeFont),
        }}
      >
        {`function example() {\n  return "This is code text";\n}`}
      </pre>
    </div>
  );
}
