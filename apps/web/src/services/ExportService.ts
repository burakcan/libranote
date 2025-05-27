import { gfm } from "@joplin/turndown-plugin-gfm";
import { Editor } from "@tiptap/core";
import { Collaboration } from "@tiptap/extension-collaboration";
import JSZip from "jszip";
import TurndownService from "turndown";
import * as Y from "yjs";
import { baseExtensions } from "@/components/noteEditor/baseExtensions";
import { IndexeddbPersistence as YIndexeddbPersistence } from "@/services/db/yIndexedDb";
import { ClientCollection, ClientNote } from "@/types/Entities";

export const EXPORT_STARTED_EVENT = "export-started";
export const EXPORT_COMPLETED_EVENT = "export-completed";

const turndownService = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "_",
  strongDelimiter: "**",
  linkStyle: "inlined",
  hr: "---",
  br: "\n",
});
turndownService.use(gfm);

turndownService.use(function (s) {
  s.addRule("note-title", {
    filter: (node) =>
      node.nodeName === "H1" && node.classList.contains("note-title"),
    replacement: (_, node) => {
      const metadata = `
---
title: ${node.textContent?.trim() ?? ""}
id: {{%id%}}
collection: {{%collection%}}
collectionId: {{%collectionId%}}
created: {{%created%}}
updated: {{%updated%}}
tool: {{%tool%}}
---
`;

      return metadata;
    },
  });
});

turndownService.use(function (s) {
  s.addRule("task-list", {
    filter: (node) =>
      node.nodeName === "UL" && node.classList.contains("task-list"),
    replacement: (_, node) => {
      const taskItems = node.querySelectorAll("li.task-item");

      return Array.from(taskItems)
        .map((taskItem) => {
          const checkbox = taskItem.querySelector("input[type='checkbox']");
          const checked = checkbox?.getAttribute("checked") === "true";
          const text = taskItem.textContent?.trim() ?? "";

          return `- [${checked ? "x" : " "}] ${text}`;
        })
        .join("\n");
    },
  });
});

class ExportService extends EventTarget {
  isExporting = false;

  async getNoteMarkdown(
    note: ClientNote,
    collectionMap: Map<string, ClientCollection>
  ) {
    console.debug(
      `ExportService: 📝 Converting note "${note.title}" to markdown...`
    );
    const yDoc = new Y.Doc();
    const persistence = new YIndexeddbPersistence(note.id, yDoc);

    console.debug(`ExportService: 🔄 Syncing note data from IndexedDB...`);
    await persistence.whenSynced;

    const editor = new Editor({
      extensions: [
        ...baseExtensions,
        Collaboration.configure({ document: yDoc }),
      ],
    });

    console.debug(`ExportService: 🔄 Converting HTML to markdown...`);
    const html = editor.getHTML();
    let markdown = turndownService.turndown(html);

    console.debug(`ExportService: 📋 Adding metadata to markdown...`);
    // Fill in the metadata
    markdown = markdown.replace(/{{%id%}}/, note.id);
    markdown = markdown.replace(
      /{{%created%}}/,
      new Date(note.createdAt).toISOString()
    );
    markdown = markdown.replace(
      /{{%updated%}}/,
      new Date(note.updatedAt).toISOString()
    );

    const collection = collectionMap.get(note.collectionId ?? "");
    markdown = markdown.replace(/{{%collection%}}/, collection?.title ?? "");
    markdown = markdown.replace(/{{%collectionId%}}/, collection?.id ?? "");

    markdown = markdown.replace(/{{%tool%}}/, "libranote");

    console.debug(`ExportService: ✅ Successfully converted note to markdown`);
    return markdown;
  }

  async downloadNoteMarkdown(
    note: ClientNote,
    collectionMap: Map<string, ClientCollection>
  ) {
    console.debug(
      `ExportService: 📥 Starting download for note "${note.title}"...`
    );
    const markdown = await this.getNoteMarkdown(note, collectionMap);

    console.debug(`ExportService: 💾 Creating downloadable file...`);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title.replace(/ /g, "-")}.md`;
    a.click();

    URL.revokeObjectURL(url);
    a.remove();

    console.debug(`ExportService: ✅ Download initiated for "${note.title}"`);
    return blob;
  }

  async exportNotes(notes: ClientNote[], collections: ClientCollection[]) {
    if (this.isExporting) {
      console.debug(`ExportService: ❌ Export already in progress!`);
      return;
    }

    this.isExporting = true;
    this.dispatchEvent(new Event(EXPORT_STARTED_EVENT));

    console.debug(
      `ExportService: 📦 Starting bulk export of ${notes.length} notes...`
    );

    const collectionMap = new Map<string, ClientCollection>();
    for (const collection of collections) {
      collectionMap.set(collection.id, collection);
    }

    const zip = new JSZip();

    for (const note of notes) {
      console.debug(`ExportService: 📝 Processing note "${note.title}"...`);

      const markdown = await this.getNoteMarkdown(note, collectionMap);
      const fileName = `${note.title.replace(/ /g, "-").toLowerCase()}.md`;

      zip.file(fileName, markdown);

      console.debug(`ExportService: ✅ Added "${fileName}" to zip archive`);
    }

    console.debug(`ExportService: 🔄 Generating zip file...`);

    await zip.generateAsync({ type: "blob" }).then((blob) => {
      console.debug(
        `ExportService: 💾 Saving zip file as "libranote-export.zip"...`
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "libranote-export.zip";
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    });

    this.isExporting = false;
    this.dispatchEvent(new Event(EXPORT_COMPLETED_EVENT));

    console.debug(`ExportService: ✨ Export completed successfully!`);
  }
}

export const exportService = new ExportService();
