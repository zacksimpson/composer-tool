import "./style.css";
import { Editor, defaultValueCtx, rootCtx } from "@milkdown/core";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { commonmark } from "@milkdown/preset-commonmark";

// These string literals are replaced by React Native before the HTML is
// passed to the WebView — see note/[id].tsx editorHtml computation.
// They must remain as plain string literals so the replacement is reliable.
const INITIAL_CONTENT = "COMPOSER_INIT";

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (msg: string) => void };
    composerBridge: {
      setTheme: (bg: string, textColor: string) => void;
      focus: () => void;
      setKeyboardHeight: (height: number) => void;
    };
  }
}

async function main() {
  await Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, document.getElementById("app")!);
      ctx.set(defaultValueCtx, INITIAL_CONTENT);
      ctx.get(listenerCtx).markdownUpdated((_ctx, markdown) => {
        window.ReactNativeWebView?.postMessage(
          JSON.stringify({ type: "change", markdown })
        );
      });
    })
    .use(commonmark)
    .use(listener)
    .create();

  let keyboardHeight = 0;

  function scrollCursorIntoView() {
    if (keyboardHeight === 0) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    let rect = range.getBoundingClientRect();
    // Empty paragraphs (e.g. after pressing Enter) return a zero rect — fall
    // back to the parent element which has a measurable height from line-height.
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

  // Expose bridge for post-init updates from RN
  window.composerBridge = {
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
}

main();
