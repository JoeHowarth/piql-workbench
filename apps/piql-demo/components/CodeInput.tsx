import { python } from "@codemirror/lang-python";
import { EditorState, Prec } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { EditorView, minimalSetup } from "codemirror";
import { createEffect, onCleanup, onMount } from "solid-js";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  class?: string;
}

export function CodeInput(props: Props) {
  let containerRef: HTMLDivElement | undefined;
  let view: EditorView | undefined;

  onMount(() => {
    if (!containerRef) return;

    // Check for dark mode (class-based)
    const isDark = document.documentElement.classList.contains("dark");

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        props.onChange(update.state.doc.toString());
      }
    });

    // Handle Enter key: submit on Enter, newline on Shift+Enter
    // Use Prec.highest to override minimalSetup's Enter handling
    const enterKeymap = Prec.highest(
      keymap.of([
        {
          key: "Enter",
          run: () => {
            props.onSubmit();
            return true;
          },
        },
        {
          key: "Shift-Enter",
          run: (view) => {
            view.dispatch(view.state.replaceSelection("\n"));
            return true;
          },
        },
      ]),
    );

    const baseTheme = EditorView.theme(
      {
        "&": {
          fontSize: "14px",
          flex: "1",
          backgroundColor: "transparent",
        },
        ".cm-editor": {
          height: "100%",
        },
        ".cm-scroller": {
          overflow: "auto",
        },
        ".cm-content": {
          padding: "4px 8px",
          minHeight: "auto",
        },
        ".cm-line": {
          padding: "0",
        },
        "&.cm-focused": {
          outline: "none",
        },
        ".cm-gutters": {
          display: "none",
        },
      },
      { dark: isDark },
    );

    const state = EditorState.create({
      doc: props.value,
      extensions: [
        minimalSetup,
        python(),
        ...(isDark ? [oneDark] : []),
        baseTheme,
        updateListener,
        enterKeymap,
        EditorView.lineWrapping,
      ],
    });

    view = new EditorView({
      state,
      parent: containerRef,
    });
  });

  onCleanup(() => {
    view?.destroy();
  });

  // Update editor when value changes externally
  // (only if different from current content to avoid cursor jump)
  createEffect(() => {
    if (view && props.value !== view.state.doc.toString()) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: props.value,
        },
      });
    }
  });

  return (
    <div
      ref={containerRef}
      class={`border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 overflow-hidden ${props.class ?? ""}`}
    />
  );
}
