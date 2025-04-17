type FieldName = string;
type Id = string;

type DocumentValue = string | number | boolean | null | DocumentData;

type DocumentData = {
  [key: string]: DocumentValue | DocumentValue[];
};

export type EnrichedDocumentSearchResults = Array<{
  field?: FieldName;
  tag?: FieldName;
  result: Array<{
    id: Id;
    doc: DocumentData | null;
    highlight?: string;
  }>;
}>;

export type NoteSearchResult = {
  id: string;
  doc: {
    title: string;
    content: string;
  };
  titleHighlight?: string;
  contentHighlight?: string;
  totalMatches: number;
};
