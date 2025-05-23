import { useCustomizedProseClasses } from "@/hooks/useCustomizedProseClasses";
import { useSetting } from "@/hooks/useSetting";
import { cn } from "@/lib/utils";

export function TextPreview() {
  const proseClasses = useCustomizedProseClasses();
  const lineHeight = useSetting("appearance.lineHeight").value;

  return (
    <div
      className={cn("p-4 border rounded-md space-y-3 prose", proseClasses)}
      style={{ lineHeight: `${lineHeight}em` }}
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
