import "./style.css";
import {
  Editor,
  defaultValueCtx,
  editorViewCtx,
  parserCtx,
  rootCtx,
} from "@milkdown/core";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { commonmark } from "@milkdown/preset-commonmark";

// COMPOSER_BG and COMPOSER_TEXT are replaced at render time by RN.
// The editor starts with empty content; content is injected via composerBridge.setContent().

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (msg: string) => void };
    composerBridge: {
      setContent: (markdown: string) => void;
      setTheme: (bg: string, textColor: string) => void;
      focus: () => void;
      setKeyboardHeight: (height: number) => void;
    };
  }
}

async function main() {
  let suppressChange = false;

  const editor = await Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, document.getElementById("app")!);
      ctx.set(defaultValueCtx, "");
      ctx.get(listenerCtx).markdownUpdated((_ctx, markdown) => {
        if (suppressChange) return;
        window.ReactNativeWebView?.postMessage(
          JSON.stringify({ type: "change", markdown })
        );
      });
    })
    .use(commonmark)
    .use(listener)
    .create();

  // Signal that Milkdown is initialized and ready to receive content
  window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "editorReady" }));

  let keyboardHeight = 0;

  function scrollCursorIntoView() {
    if (keyboardHeight === 0) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    let rect = range.getBoundingClientRect();
    // Empty paragraphs return a zero rect — fall back to parent element
    if (rect.top === 0 && rect.bottom === 0) {
      const node = range.startContainer;
      const el =
        node.nodeType === Node.TEXT_NODE
          ? (node as Text).parentElement
          : (node as Element);
      if (el) rect = el.getBoundingClientRect();
    }
    const visibleBottom = window.innerHeight - keyboardHeight - 16;
    if (rect.bottom > visibleBottom) {
      window.scrollBy({ top: rect.bottom - visibleBottom, behavior: "instant" });
    }
  }

  window.composerBridge = {
    setContent(markdown) {
      suppressChange = true;
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const parse = ctx.get(parserCtx);
        const doc = parse(markdown);
        if (!doc) return;
        const { state } = view;
        view.dispatch(
          state.tr.replaceWith(0, state.doc.content.size, doc.content)
        );
      });
      window.scrollTo(0, 0);
      requestAnimationFrame(() => {
        suppressChange = false;
        window.ReactNativeWebView?.postMessage(
          JSON.stringify({
            type: "scroll",
            scrollTop: 0,
            scrollHeight: document.documentElement.scrollHeight,
            clientHeight: document.documentElement.clientHeight,
          })
        );
      });
    },
    setTheme(bg, textColor) {
      document.body.style.background = bg;
      document.body.style.color = textColor;
    },
    focus() {
      document.querySelector<HTMLElement>(".ProseMirror")?.focus();
    },
    setKeyboardHeight(height) {
      keyboardHeight = height;
      scrollCursorIntoView();
    },
  };

  // Tap anywhere in the editor area to focus ProseMirror
  document.getElementById("app")?.addEventListener("click", (e) => {
    const pm = document.querySelector<HTMLElement>(".ProseMirror");
    if (pm && !pm.contains(e.target as Node)) {
      pm.focus();
    }
  });

  const pm = document.querySelector(".ProseMirror");
  if (pm) {
    const observer = new MutationObserver(() => {
      requestAnimationFrame(scrollCursorIntoView);
    });
    observer.observe(pm, { childList: true, subtree: true, characterData: true });
  }

  // Post initial scroll metrics after first paint
  requestAnimationFrame(() => {
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({
        type: "scroll",
        scrollTop: 0,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      })
    );
  });

  // Post scroll metrics to RN for the scroll indicator
  let rafPending = false;
  document.addEventListener(
    "scroll",
    () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        window.ReactNativeWebView?.postMessage(
          JSON.stringify({
            type: "scroll",
            scrollTop: Math.round(window.scrollY),
            scrollHeight: document.documentElement.scrollHeight,
            clientHeight: document.documentElement.clientHeight,
          })
        );
      });
    },
    { passive: true }
  );
}

main();
