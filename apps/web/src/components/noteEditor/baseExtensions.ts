import { Node } from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Document } from "@tiptap/extension-document";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Underline } from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { createLowlight, common } from "lowlight";
import { OnBlurHighlight } from "./OnBlurHighlightExtension";

const lowlight = createLowlight(common);

// Document title rendering a h2
const NoteTitle = Node.create({
  name: "noteTitle",
  content: "text*",
  parseHTML: () => [{ tag: "h1" }],
  renderHTML: () => ["h1", { class: "note-title" }, 0],
});

export const baseExtensions = [
  Document.extend({
    content: "noteTitle block+",
  }),
  NoteTitle,
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "noteTitle") {
        return "Untitled note";
      }

      return "Add some content";
    },
    showOnlyCurrent: false,
  }),
  CharacterCount,
  Image.configure({
    allowBase64: true,
    HTMLAttributes: {
      class: "note-image",
    },
  }),
  Link.configure({
    openOnClick: false,
  }),
  OnBlurHighlight,
  TaskList.configure({
    HTMLAttributes: {
      class: "task-list",
    },
  }),
  TaskItem.configure({
    HTMLAttributes: {
      class: "task-item",
    },
  }),
  CodeBlockLowlight.configure({
    lowlight,
  }),
  StarterKit.configure({
    history: false,
    document: false,
    codeBlock: false,
  }),
  Underline,
];
