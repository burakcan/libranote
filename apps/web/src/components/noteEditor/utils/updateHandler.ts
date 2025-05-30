import { Editor } from "@tiptap/core";
import { Transaction } from "@tiptap/pm/state";
import { debounce } from "es-toolkit";
import { RefObject } from "react";
import { searchService } from "@/services/SearchService";
import { didTransactionChangeContent } from "./transactionUtils";
import { ClientNote } from "@/types/Entities";

type UpdateNoteFunction = (
  update: Partial<ClientNote> & { id: ClientNote["id"] },
  noAction?: boolean
) => Promise<void>;

export const debouncedOnUpdate = debounce(
  (
    editor: RefObject<Editor | null>,
    transaction: Transaction,
    note: RefObject<ClientNote | null>,
    updateNote: RefObject<UpdateNoteFunction | null>
  ) => {
    if (!editor.current || !note.current || !updateNote.current) return;

    const didChangeContent = didTransactionChangeContent(transaction);

    if (!didChangeContent) return;

    const json = editor.current.getJSON();
    const text = editor.current.getText();

    const title = json?.content?.[0]?.content?.[0]?.text || "";

    let description = "";

    if (json?.content?.[1]?.type === "image") {
      description = "[Image] ";
    }

    description +=
      text
        .replace(title, "")
        .split("\n")
        .find((line: string) => line.trim() !== "")
        ?.slice(0, 75) || "";

    if (
      title !== note.current.title ||
      description !== note.current.description
    ) {
      updateNote.current({
        ...note.current,
        title: title || "",
        description: description || "",
      });
    }

    // Update the noteYDocState optimistically without creating an action
    updateNote.current(
      {
        id: note.current.id,
        noteYDocState: {
          ...note.current.noteYDocState,
          updatedAt: new Date(),
        },
      },
      true
    );

    console.log("updateHandler: Updating note from YDoc", note.current.id);
    searchService.updateNoteFromYDoc(note.current.id);
  },
  1000,
  {
    edges: ["trailing"],
  }
);
