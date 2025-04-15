import { Editor } from "@tiptap/react";
import Avatar from "boring-avatars";
import {
  Undo,
  Redo,
  Heading1,
  Heading2,
  Bold,
  Italic,
  Code,
  Link,
  List,
  ListOrdered,
  Heading3,
  ALargeSmall,
  Unlink,
  Check,
  X,
  ListChecks,
  ImagePlus,
  CodeSquare,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getUserColors } from "@/lib/utils";
import { Input } from "../ui/input";

interface EditorToolbarProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  tooltip?: string;
}

function ToolbarButton({
  icon,
  onClick,
  disabled,
  tooltip,
  active,
}: ToolbarButtonProps) {
  return (
    <Tooltip delayDuration={500}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", active && "bg-accent")}
          disabled={disabled}
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const isNoteTitle = editor?.isActive("noteTitle");
  const isLink = editor?.isActive("link");
  const isTaskList = editor?.isActive("taskList");
  const [linkHref, setLinkHref] = useState("");
  const [showEditLink, setShowEditLink] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [imageSrc, setImageSrc] = useState("");

  return (
    <div className="border-b border-border/50 p-2 pr-5 flex items-center gap-1">
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<Undo className="h-4 w-4" />}
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo?.()}
          tooltip="Undo"
        />
        <ToolbarButton
          icon={<Redo className="h-4 w-4" />}
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo?.()}
          tooltip="Redo"
        />
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<ALargeSmall className="h-4 w-4" />}
          onClick={() => editor?.chain().focus().setParagraph().run()}
          tooltip="Paragraph"
          active={editor?.isActive("paragraph")}
          disabled={isNoteTitle || isTaskList}
        />
        <ToolbarButton
          icon={<Heading1 className="h-4 w-4" />}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }
          tooltip="Heading 1"
          active={editor?.isActive("heading", { level: 1 })}
          disabled={isNoteTitle || isTaskList}
        />
        <ToolbarButton
          icon={<Heading2 className="h-4 w-4" />}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          tooltip="Heading 2"
          active={editor?.isActive("heading", { level: 2 })}
          disabled={isNoteTitle || isTaskList}
        />
        <ToolbarButton
          icon={<Heading3 className="h-4 w-4" />}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
          tooltip="Heading 3"
          active={editor?.isActive("heading", { level: 3 })}
          disabled={isNoteTitle || isTaskList}
        />
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<Bold className="h-4 w-4" />}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          tooltip="Bold"
          active={editor?.isActive("bold")}
          disabled={isNoteTitle}
        />
        <ToolbarButton
          icon={<Italic className="h-4 w-4" />}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          tooltip="Italic"
          active={editor?.isActive("italic")}
          disabled={isNoteTitle}
        />
        <ToolbarButton
          icon={<Code className="h-4 w-4" />}
          onClick={() => {
            editor?.chain().focus().extendMarkRange("code").toggleCode().run();
          }}
          tooltip="Code"
          active={editor?.isActive("code")}
          disabled={isNoteTitle}
        />
        <ToolbarButton
          icon={<CodeSquare className="h-4 w-4" />}
          onClick={() => {
            editor?.commands.toggleCodeBlock();
          }}
          tooltip="Code Block"
          active={editor?.isActive("codeBlock")}
          disabled={isNoteTitle}
        />
        <Popover open={showImage} onOpenChange={setShowImage}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", showImage && "bg-accent")}
              onClick={() => setShowImage(true)}
              disabled={isNoteTitle}
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="flex items-center gap-1">
              <Input
                type="url"
                placeholder="Enter image URL"
                value={imageSrc}
                onChange={(e) => setImageSrc(e.target.value)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  editor?.chain().focus().setImage({ src: imageSrc }).run();
                  setShowImage(false);
                  setImageSrc("");
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowImage(false);
                  setImageSrc("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {isLink && (
          <ToolbarButton
            icon={<Unlink className="h-4 w-4" />}
            onClick={() => editor?.commands.unsetLink()}
            tooltip="Unlink"
            disabled={isNoteTitle || !isLink}
          />
        )}
        {!isLink && (
          <Popover open={showEditLink} onOpenChange={setShowEditLink}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  showEditLink && "bg-accent",
                  isLink && "bg-accent"
                )}
                disabled={isNoteTitle}
                onClick={() => {
                  setShowEditLink(true);
                  setLinkHref(editor?.getAttributes("link").href ?? "");
                }}
              >
                <Link className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="flex items-center gap-1">
                <Input
                  type="url"
                  placeholder="Enter link URL"
                  value={linkHref}
                  onChange={(e) => {
                    setLinkHref(e.target.value);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const initialSelection = editor?.state.selection;

                    let posStart = initialSelection?.from ?? 0;
                    let posEnd = initialSelection?.to ?? 0;

                    if (initialSelection?.empty) {
                      // If the selection is empty, select the textblock start and end
                      editor?.chain().focus().selectTextblockStart().run();
                      posStart = editor?.state.selection.from ?? 0;

                      editor?.chain().focus().selectTextblockEnd().run();
                      posEnd = editor?.state.selection.to ?? 0;
                    }

                    editor
                      ?.chain()
                      .focus()
                      .setTextSelection({
                        from: posStart,
                        to: posEnd,
                      })
                      .setLink({ href: linkHref, target: "_blank" })
                      .setTextSelection({
                        from: initialSelection?.from ?? 0,
                        to: initialSelection?.to ?? 0,
                      })
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
            </PopoverContent>
          </Popover>
        )}
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<List className="h-4 w-4" />}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          tooltip="Bullet List"
          active={editor?.isActive("bulletList")}
          disabled={isNoteTitle}
        />
        <ToolbarButton
          icon={<ListOrdered className="h-4 w-4" />}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          tooltip="Ordered List"
          active={editor?.isActive("orderedList")}
          disabled={isNoteTitle}
        />
        <ToolbarButton
          icon={<ListChecks className="h-4 w-4" />}
          onClick={() => editor?.chain().focus().toggleTaskList().run()}
          tooltip="Task List"
          active={editor?.isActive("taskList")}
          disabled={isNoteTitle}
        />
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <div className="flex flex-auto items-center justify-end gap-2">
        {editor?.storage.collaborationCursor?.users.map(
          (user: {
            clientId: string;
            name: string;
            id: string;
            color: string;
          }) => (
            <Tooltip key={user.clientId}>
              <TooltipTrigger asChild>
                <Avatar
                  name={user.id}
                  key={user.clientId}
                  size={28}
                  className="outline-1 outline-offset-1 rounded-full"
                  style={{ outlineColor: user.color }}
                  variant="beam"
                  colors={[...getUserColors(user.id)]}
                />
              </TooltipTrigger>
              <TooltipContent className="font-semibold">
                {user.name}
              </TooltipContent>
            </Tooltip>
          )
        )}
      </div>
    </div>
  );
}
