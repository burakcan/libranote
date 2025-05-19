import { Editor } from "@tiptap/react";
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
  Unlink,
  Check,
  X,
  ListChecks,
  ImagePlus,
  CodeSquare,
  Pilcrow,
  Strikethrough,
  Underline,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { CollaboratorHeads } from "./CollaboratorHeads";
import { ToolbarButton } from "./ToolbarButton";

interface EditorToolbarProps {
  editor: Editor | null;
  isMobile?: boolean;
}

const textStyleIcons = {
  p: <Pilcrow className="size-4" />,
  h1: <Heading1 className="size-4" />,
  h2: <Heading2 className="size-4" />,
  h3: <Heading3 className="size-4" />,
};

export default function EditorToolbar({
  editor,
  isMobile,
}: EditorToolbarProps) {
  const [textStyleMenuOpen, setTextStyleMenuOpen] = useState(false);
  const [listStyleMenuOpen, setListStyleMenuOpen] = useState(false);
  const [textFormattingMenuOpen, setTextFormattingMenuOpen] = useState(false);

  const isNoteTitle = editor?.isActive("noteTitle");
  const isLink = editor?.isActive("link");
  const isTaskList = editor?.isActive("taskList");
  const [linkHref, setLinkHref] = useState("");
  const [showEditLink, setShowEditLink] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [imageSrc, setImageSrc] = useState("");

  const currentTextStyle = (() => {
    if (editor?.isActive("heading", { level: 1 })) return "h1";
    if (editor?.isActive("heading", { level: 2 })) return "h2";
    if (editor?.isActive("heading", { level: 3 })) return "h3";
    return "p";
  })();

  const currentTextStyleIcon = textStyleIcons[currentTextStyle];

  return (
    <div className="border-b border-border/50 p-2 h-14 pr-5 flex items-center gap-1 z-10">
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<Undo className="size-4" />}
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo?.()}
          tooltip="Undo"
        />
        <ToolbarButton
          icon={<Redo className="size-4" />}
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo?.()}
          tooltip="Redo"
        />
      </div>
      <Separator orientation="vertical" className="mx-1 h-6" />

      <div className="flex sm:hidden items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-12"
          onClick={(e) => {
            e.preventDefault();
            editor?.chain().focus().run();
            setTextStyleMenuOpen(!textStyleMenuOpen);
          }}
        >
          {currentTextStyleIcon}
          <ChevronRight
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              textStyleMenuOpen && "rotate-180"
            )}
          />
        </Button>
      </div>

      <AnimatePresence>
        {(!isMobile || textStyleMenuOpen) && (
          <motion.div
            className="flex items-center gap-1"
            initial={{
              opacity: 0,
              x: 10,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: 10,
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            <ToolbarButton
              icon={<Pilcrow className="size-4" />}
              onClick={() => {
                editor?.chain().focus().setParagraph().run();
                setTextStyleMenuOpen(false);
              }}
              tooltip="Paragraph"
              active={editor?.isActive("paragraph")}
              disabled={isNoteTitle || isTaskList}
            />
            <ToolbarButton
              icon={<Heading1 className="size-4" />}
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: 1 }).run();
                setTextStyleMenuOpen(false);
              }}
              tooltip="Heading 1"
              active={editor?.isActive("heading", { level: 1 })}
              disabled={isNoteTitle || isTaskList}
            />
            <ToolbarButton
              icon={<Heading2 className="size-4" />}
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: 2 }).run();
                setTextStyleMenuOpen(false);
              }}
              tooltip="Heading 2"
              active={editor?.isActive("heading", { level: 2 })}
              disabled={isNoteTitle || isTaskList}
            />
            <ToolbarButton
              icon={<Heading3 className="size-4" />}
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: 3 }).run();
                setTextStyleMenuOpen(false);
              }}
              tooltip="Heading 3"
              active={editor?.isActive("heading", { level: 3 })}
              disabled={isNoteTitle || isTaskList}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <div className="flex sm:hidden items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-12"
          onClick={(e) => {
            e.preventDefault();
            editor?.chain().focus().run();
            setListStyleMenuOpen(!listStyleMenuOpen);
          }}
        >
          <List className="size-4" />
          <ChevronRight
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              listStyleMenuOpen && "rotate-180"
            )}
          />
        </Button>
      </div>

      <AnimatePresence>
        {(!isMobile || listStyleMenuOpen) && (
          <motion.div
            className="flex items-center gap-1"
            initial={{
              opacity: 0,
              x: 10,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: 10,
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            <ToolbarButton
              icon={<List className="size-4" />}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              tooltip="Bullet List"
              active={editor?.isActive("bulletList")}
              disabled={isNoteTitle}
            />
            <ToolbarButton
              icon={<ListOrdered className="size-4" />}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              tooltip="Ordered List"
              active={editor?.isActive("orderedList")}
              disabled={isNoteTitle}
            />
            <ToolbarButton
              icon={<ListChecks className="size-4" />}
              onClick={() => editor?.chain().focus().toggleTaskList().run()}
              tooltip="Task List"
              active={editor?.isActive("taskList")}
              disabled={isNoteTitle}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <div className="flex sm:hidden items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-12"
          onClick={(e) => {
            e.preventDefault();
            editor?.chain().focus().run();
            setTextFormattingMenuOpen(!textFormattingMenuOpen);
          }}
        >
          <Bold className="size-4" />
          <ChevronRight
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              textFormattingMenuOpen && "rotate-180"
            )}
          />
        </Button>
      </div>

      <AnimatePresence>
        {(!isMobile || textFormattingMenuOpen) && (
          <motion.div className="flex items-center gap-1">
            <ToolbarButton
              icon={<Bold className="size-4" />}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              tooltip="Bold"
              active={editor?.isActive("bold")}
              disabled={isNoteTitle}
            />
            <ToolbarButton
              icon={<Italic className="size-4" />}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              tooltip="Italic"
              active={editor?.isActive("italic")}
              disabled={isNoteTitle}
            />
            <ToolbarButton
              icon={<Strikethrough className="size-4" />}
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              tooltip="Strikethrough"
              active={editor?.isActive("strike")}
              disabled={isNoteTitle}
            />
            <ToolbarButton
              icon={<Underline className="size-4" />}
              onClick={() =>
                editor?.chain().focus().toggleMark("underline").run()
              }
              tooltip="Underline"
              active={editor?.isActive("underline")}
              disabled={isNoteTitle}
            />
            <ToolbarButton
              icon={<Code className="size-4" />}
              onClick={() => {
                editor
                  ?.chain()
                  .focus()
                  .extendMarkRange("code")
                  .toggleCode()
                  .run();
              }}
              tooltip="Code"
              active={editor?.isActive("code")}
              disabled={isNoteTitle}
            />
            <ToolbarButton
              icon={<CodeSquare className="size-4" />}
              onClick={() => {
                editor?.commands.toggleCodeBlock();
                editor?.chain().focus().run();
              }}
              tooltip="Code Block"
              active={editor?.isActive("codeBlock")}
              disabled={isNoteTitle}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-1">
        <Popover open={showImage} onOpenChange={setShowImage}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", showImage && "bg-accent")}
              onClick={() => setShowImage(true)}
              disabled={isNoteTitle}
            >
              <ImagePlus className="size-4" />
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
                <Check className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowImage(false);
                  setImageSrc("");
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {isLink && (
          <ToolbarButton
            icon={<Unlink className="size-4" />}
            onClick={() => editor?.chain().focus().unsetLink().run()}
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
                <Link className="size-4" />
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
                  <Check className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowEditLink(false);
                    setLinkHref("");
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {!isMobile && <CollaboratorHeads editor={editor} />}
    </div>
  );
}
