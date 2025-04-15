import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const DECO_NAME = "onBlurHighlight";
const ACTION_TYPES = {
  BLUR: "blur",
  FOCUS: "focus",
};
export const OnBlurHighlight = Extension.create({
  name: DECO_NAME,

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey(DECO_NAME),

        state: {
          init() {
            return DecorationSet.empty;
          },

          apply: (transaction, oldState) => {
            const { selection, doc } = transaction;
            const decoTransform = transaction.getMeta(DECO_NAME);
            const hasSelection = selection && selection.from !== selection.to;

            if (!hasSelection || decoTransform?.action === ACTION_TYPES.FOCUS) {
              return DecorationSet.empty;
            }

            if (hasSelection && decoTransform?.action === ACTION_TYPES.BLUR) {
              const decoration = Decoration.inline(
                selection.from,
                selection.to,
                {
                  class: "blur-highlight",
                }
              );

              return DecorationSet.create(doc, [decoration]);
            }

            return oldState;
          },
        },

        props: {
          decorations(state) {
            return this.getState(state);
          },
          handleDOMEvents: {
            blur: (view) => {
              const { tr } = view.state;

              const transaction = tr.setMeta(DECO_NAME, {
                from: tr.selection.from,
                to: tr.selection.to,
                action: ACTION_TYPES.BLUR,
              });

              view.dispatch(transaction);
            },

            focus: (view) => {
              const { tr } = view.state;

              const transaction = tr.setMeta(DECO_NAME, {
                from: tr.selection.from,
                to: tr.selection.to,
                action: ACTION_TYPES.FOCUS,
              });

              view.dispatch(transaction);
            },
          },
        },
      }),
    ];
  },
});
