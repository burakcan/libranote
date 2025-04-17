import { BubbleMenu, Editor } from "@tiptap/react";
import { Check, Edit, Unlink, X } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LinkBubbleMenuProps {
  editor: Editor | null;
}

export function LinkBubbleMenu({ editor }: LinkBubbleMenuProps) {
  const bubbleMenuRef = useRef<HTMLDivElement>(null);
  const [showEditLink, setShowEditLink] = useState(false);
  const [linkHref, setLinkHref] = useState("");

  return (
    <div ref={bubbleMenuRef}>
      {editor && bubbleMenuRef.current && (
        <BubbleMenu
          shouldShow={({ editor }) => editor?.isActive("link") ?? false}
          updateDelay={0}
          editor={editor}
          tippyOptions={{
            placement: "top",
            appendTo: bubbleMenuRef.current,
            onHidden: () => setShowEditLink(false),
          }}
        >
          {showEditLink ? (
            <div className="flex items-center bg-card border gap-1 p-1 pl-3 rounded-md shadow-md">
              <Input
                value={linkHref}
                onChange={(e) => {
                  setLinkHref(e.target.value);
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .extendMarkRange("link")
                    .setLink({ href: linkHref })
                    .run();

                  setShowEditLink(false);
                  setLinkHref("");
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowEditLink(false);
                  setLinkHref("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center bg-card border gap-1 p-1 pl-3 rounded-md shadow-md">
              <a
                href={editor.getAttributes("link").href}
                target="_blank"
                className="text-card-foreground whitespace-nowrap max-w-[200px] truncate underline"
              >
                {editor.getAttributes("link").href}
              </a>
              <div className="flex items-center gap-1 border-l pl-2 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowEditLink(true);
                    setLinkHref(editor.getAttributes("link").href);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    console.log("unlinking");
                    editor.commands.unsetLink();
                  }}
                >
                  <Unlink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </BubbleMenu>
      )}
    </div>
  );
}
