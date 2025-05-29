import { Transaction } from "@tiptap/pm/state";

export const didTransactionChangeContent = (
  transaction: Transaction
): boolean => {
  const before = transaction.before;
  const after = transaction.doc;

  if (before.nodeSize !== after.nodeSize) {
    return true;
  }

  const now = performance.now();
  const result = before.textContent !== after.textContent;
  const time = performance.now() - now;
  console.info("NoteEditor: string comparison took", time, "ms");
  return result;
};
