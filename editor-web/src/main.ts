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

  // Expose bridge for post-init updates from RN
  window.composerBridge = {
    setTheme(bg, textColor) {
      document.body.style.background = bg;
      document.body.style.color = textColor;
    },
    focus() {
      document.querySelector<HTMLElement>(".ProseMirror")?.focus();
    },
  };

  // Tap anywhere in the editor area to focus ProseMirror
  document.getElementById("app")?.addEventListener("click", (e) => {
    const pm = document.querySelector<HTMLElement>(".ProseMirror");
    if (pm && !pm.contains(e.target as Node)) {
      pm.focus();
    }
  });

  // Scroll cursor into view when keyboard appears
  window.visualViewport?.addEventListener("resize", () => {
    setTimeout(() => {
      const focusNode = window.getSelection()?.focusNode;
      if (focusNode) {
        const el =
          focusNode.nodeType === Node.TEXT_NODE
            ? (focusNode as Text).parentElement
            : (focusNode as Element);
        el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 100);
  });
}

main();
