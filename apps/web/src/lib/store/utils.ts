import { produce } from "immer";
import { Draft } from "immer";

// Type-safe produce utility
export const P = <T extends object>(
  set: (fn: (state: T) => T | Partial<T>) => void,
  fn: (draft: Draft<T>) => void
) => set(produce<T>(fn));
