import { Editor } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import { Mutex } from "es-toolkit";
import { Charset, Document, IndexedDB } from "flexsearch";
import * as Y from "yjs";
import { baseExtensions } from "@/components/noteEditor/baseExtensions";
import { IndexeddbPersistence as YIndexeddbPersistence } from "@/services/db/yIndexedDb";
import { ClientNote } from "@/types/Entities";
import {
  EnrichedDocumentSearchResults,
  NoteSearchResult,
} from "@/types/FlexSearch";

export const SEARCH_INDEXING_EVENT = "search:indexing";
export const SEARCH_INDEXING_END_EVENT = "search:indexing-end";

export class SearchService extends EventTarget {
  operationsInProgress = 0;
  notesIndexMutex = new Mutex();

  notesIndex = new Document({
    encoder: Charset.LatinBalance,
    document: {
      store: true,
      index: [
        {
          field: "title",
          tokenize: "forward",
        },
        {
          field: "content",
          tokenize: "forward",
        },
      ],
    },
    context: true,
  });

  notesDb = new IndexedDB({
    name: "libranote-search-notes",
  });

  constructor() {
    super();

    this.notesIndex.mount(this.notesDb);
  }

  get isIndexing() {
    return this.operationsInProgress > 0;
  }

  onIndexing() {
    this.operationsInProgress++;
    this.dispatchEvent(new CustomEvent(SEARCH_INDEXING_EVENT));
  }

  onIndexingEnd() {
    this.operationsInProgress--;
    this.dispatchEvent(new CustomEvent(SEARCH_INDEXING_END_EVENT));
  }

  async getNoteContentFromYDoc(noteId: string) {
    const yDoc = new Y.Doc();
    const persistence = new YIndexeddbPersistence(noteId, yDoc);

    await persistence.whenSynced;

    const editor = new Editor({
      extensions: [
        ...baseExtensions,
        Collaboration.configure({ document: yDoc }),
      ],
    });

    const fullText = editor.getText();
    const [title, ...content] = fullText.split("\n");

    return {
      title,
      content: content.join("\n"),
    };
  }

  async addNote({
    id,
    title,
    content,
  }: {
    id: string;
    title: string;
    content: string;
  }) {
    this.onIndexing();

    await this.notesIndexMutex.acquire();
    console.log("searchService: Adding note to search index", id, title);

    try {
      await this.notesIndex.add({
        id,
        title,
        content,
      });
      await this.notesIndex.commit();
    } catch (error) {
      console.error("searchService: Error adding note to search index", error);
    } finally {
      this.notesIndexMutex.release();
      this.onIndexingEnd();
    }
  }

  async addNoteFromYDoc(note: ClientNote) {
    this.onIndexing();

    const { title, content } = await this.getNoteContentFromYDoc(note.id);

    await this.addNote({
      id: note.id,
      title,
      content,
    });

    this.onIndexingEnd();
  }

  async removeNote(id: string) {
    this.onIndexing();

    await this.notesIndexMutex.acquire();
    console.log("searchService: Removing note from search index", id);

    try {
      await this.notesIndex.remove(id);
      await this.notesIndex.commit();
    } catch (error) {
      console.error(
        "searchService: Error removing note from search index",
        error
      );
    } finally {
      this.notesIndexMutex.release();
      this.onIndexingEnd();
    }
  }

  async updateNote({
    id,
    title,
    content,
  }: {
    id: string;
    title: string;
    content: string;
  }) {
    this.onIndexing();

    await this.notesIndexMutex.acquire();
    console.log("searchService: Updating note in search index", id, title);

    try {
      await this.notesIndex.update(id, {
        title,
        content,
      });
      await this.notesIndex.commit();
    } catch (error) {
      console.error(
        "searchService: Error updating note in search index",
        error
      );
    } finally {
      this.notesIndexMutex.release();
      this.onIndexingEnd();
    }
  }

  async updateNoteFromYDoc(noteId: string) {
    this.onIndexing();

    const { title, content } = await this.getNoteContentFromYDoc(noteId);

    await this.updateNote({
      id: noteId,
      title,
      content,
    });

    this.onIndexingEnd();
  }

  shortenMarkedText(text: string, charsBefore = 10, charsAfter = 100) {
    const matches = text.match(/<mark>(.*?)<\/mark>/g);

    if (!matches) return text;

    const match = matches[0];

    const start = text.indexOf(match);
    const end = start + match.length;

    const startIndex = Math.max(0, start - charsBefore);
    const endIndex = Math.min(text.length, end + charsAfter);
    const shortened = text.slice(startIndex, endIndex);

    let withEllipsis = shortened;

    if (start > charsBefore) {
      withEllipsis = `...${withEllipsis}`;
    }

    if (end < text.length - charsAfter) {
      withEllipsis = `${withEllipsis}...`;
    }

    return withEllipsis;
  }

  async searchNotes({ query }: { query: string }): Promise<NoteSearchResult[]> {
    let searchResults: EnrichedDocumentSearchResults;

    try {
      searchResults = (await this.notesIndex.search({
        query,
        suggest: true,
        enrich: true,
        highlight: `<mark>$1</mark>`,
      })) as EnrichedDocumentSearchResults;
    } catch (error) {
      console.error("searchService: Error searching notes", error);
      return [];
    }

    // Merge results by ID
    const mergedResultsMap = new Map<string, NoteSearchResult>();

    searchResults.forEach((group) => {
      group.result.forEach(async (item) => {
        if (!item.doc) return;

        if (!mergedResultsMap.has(item.id)) {
          mergedResultsMap.set(item.id, {
            id: item.id,
            doc: {
              title: item.doc.title as string,
              content: item.doc.content as string,
            },
            titleHighlight: undefined,
            contentHighlight: undefined,
            totalMatches: 0,
          });
        }

        const mergedItem = mergedResultsMap.get(item.id);

        // Keep highlight if it exists
        if (item.highlight && group.field && mergedItem) {
          if (group.field === "title") {
            mergedItem.titleHighlight = item.highlight;
          } else if (group.field === "content") {
            mergedItem.contentHighlight = this.shortenMarkedText(
              item.highlight
            );
          }

          mergedItem.totalMatches += item.highlight.split("<mark>").length - 1;
        }
      });
    });

    // Convert map to array and sort by relevance (maintaining original order)
    const mergedResults: NoteSearchResult[] = Array.from(
      mergedResultsMap.values()
    ).filter((result) => {
      return result.totalMatches > 0;
    });

    return mergedResults;
  }

  async clearNotesIndex() {
    await this.notesIndexMutex.acquire();
    await this.notesDb.destroy();
    this.notesDb = new IndexedDB({
      name: "libranote-search-notes",
    });
    await this.notesIndex.mount(this.notesDb);
    this.notesIndexMutex.release();
  }

  async rebuildSearchIndex(notes: ClientNote[]) {
    await this.clearNotesIndex();

    console.log("HELLO: Add notes to search index", notes.length);

    for (const note of notes) {
      await this.addNoteFromYDoc(note);
      console.log("HELLO: Added note to search index", note.id);
    }
  }
}

export const searchService = new SearchService();
