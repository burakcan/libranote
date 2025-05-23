import { cn } from "@/lib/utils";

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
  return (
    <div
      className={cn("p-4 border rounded-md space-y-3 prose dark:prose-invert", {
        "prose-sm": fontSize === "small",
        "prose-base": fontSize === "medium",
        "prose-lg": fontSize === "large",
        [`prose-headings_font-${headingFont}`]: headingFont !== "system",
        [`prose-p_font-${contentFont}`]: contentFont !== "system",
        [`prose-code_font-${codeFont}`]: codeFont !== "system",
        [`prose-pre_font-${codeFont}`]: codeFont !== "system",
      })}
      style={{
        lineHeight: `${lineHeight}em`,
      }}
    >
      <h2>Sample Heading</h2>
      <h3>Subheading Example</h3>
      <p>
        This is a preview of how your notes will look with the selected font
        settings. The text should be readable and comfortable for extended
        reading sessions. Good typography improves readability and reduces eye
        strain.
      </p>
      <pre>{`function example() {\n  return "This is code text";\n}`}</pre>
    </div>
  );
}
