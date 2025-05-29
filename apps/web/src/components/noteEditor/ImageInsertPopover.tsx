import { Editor } from "@tiptap/react";
import { ImagePlus, Check, X, Upload, Link, Loader2 } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { compressImage, validateImageFile } from "./utils/imageUtils";

interface ImageInsertPopoverProps {
  editor: Editor | null;
  disabled?: boolean;
}

type TabType = "url" | "upload";

export function ImageInsertPopover({
  editor,
  disabled,
}: ImageInsertPopoverProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("url");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlInsert = useCallback(() => {
    if (!imageUrl.trim()) {
      toast.error("Please enter a valid image URL");
      return;
    }

    editor?.chain().focus().setImage({ src: imageUrl }).run();
    setOpen(false);
    setImageUrl("");
  }, [editor, imageUrl]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      setIsUploading(true);
      try {
        const base64 = await compressImage(file);
        editor?.chain().focus().setImage({ src: base64 }).run();
        setOpen(false);
      } catch (error) {
        console.error("Failed to compress image:", error);
        toast.error("Failed to process image. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [editor]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset the input value so the same file can be selected again
      e.target.value = "";
    },
    [handleFileSelect]
  );

  const handleCancel = useCallback(() => {
    setOpen(false);
    setImageUrl("");
    setActiveTab("url");
  }, []);

  const handleTabClick = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={isUploading}
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", open && "bg-accent")}
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80">
          <div className="space-y-3">
            {/* Tab Headers */}
            <div className="flex rounded-lg bg-muted p-1">
              <Button
                variant={activeTab === "url" ? "default" : "ghost"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => handleTabClick("url")}
              >
                <Link className="size-4" />
                URL
              </Button>
              <Button
                variant={activeTab === "upload" ? "default" : "ghost"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => handleTabClick("upload")}
              >
                <Upload className="size-4" />
                Upload
              </Button>
            </div>

            {/* URL Tab Content */}
            {activeTab === "url" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Input
                    type="url"
                    placeholder="Enter image URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleUrlInsert();
                      }
                    }}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    <X className="size-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUrlInsert}
                    disabled={!imageUrl.trim()}
                  >
                    <Check className="size-4 mr-1" />
                    Insert
                  </Button>
                </div>
              </div>
            )}

            {/* Upload Tab Content */}
            {activeTab === "upload" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full h-auto py-4 flex-col gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-6 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Choose image file</p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 50MB
                      </p>
                    </div>
                  </Button>
                </div>

                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    <X className="size-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
