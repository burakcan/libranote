import { Editor } from "@tiptap/core";
import ReactTimeAgo from "react-time-ago";
import { ClientNote } from "@/types/Entities";

interface EditorStatusBarProps {
  editor: Editor | null;
  note: ClientNote | null;
}

export function EditorStatusBar({ editor, note }: EditorStatusBarProps) {
  return (
    <div className="border-t border-border/50 p-2 px-4 flex justify-between items-center text-xs text-muted-foreground">
      <div>
        Last edited:{" "}
        <ReactTimeAgo date={note?.noteYDocState?.updatedAt || new Date()} />
      </div>
      <div>
        {editor?.storage.characterCount?.words()} words /{" "}
        {editor?.storage.characterCount?.characters()} characters
      </div>
    </div>
  );
}
