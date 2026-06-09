import { MaterialIcons } from "@expo/vector-icons";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { HapticPressable } from "@/components/HapticPressable";
import { StyledText } from "@/components/StyledText";
import { goBack } from "@/utils/navigation";
import { n } from "@/utils/scaling";

// Milkdown WYSIWYG proof-of-concept.
// Loads from CDN — device needs internet access.
// We're testing:
//   1. Does WYSIWYG inline rendering feel right?
//   2. Does the keyboard behave on LP3?
//   3. Is WebView performance acceptable?
const EDITOR_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #000;
      color: #fff;
      font-family: 'Public Sans', sans-serif;
      -webkit-tap-highlight-color: transparent;
    }

    #app {
      padding: 10px 22px 400px;
    }

    .milkdown { outline: none; }
    .milkdown .ProseMirror { outline: none; }
    .milkdown .ProseMirror p { font-size: 18px; line-height: 28px; margin-bottom: 4px; }
    .milkdown .ProseMirror h1 { font-size: 30px; font-weight: 700; line-height: 1.3; margin: 12px 0 6px; }
    .milkdown .ProseMirror h2 { font-size: 24px; font-weight: 700; line-height: 1.3; margin: 10px 0 6px; }
    .milkdown .ProseMirror h3 { font-size: 20px; font-weight: 700; line-height: 1.3; margin: 8px 0 4px; }
    .milkdown .ProseMirror ul,
    .milkdown .ProseMirror ol { padding-left: 24px; margin-bottom: 4px; }
    .milkdown .ProseMirror li { font-size: 18px; line-height: 28px; }
    .milkdown .ProseMirror strong { font-weight: 700; }
    .milkdown .ProseMirror em { font-style: italic; }
    .milkdown .ProseMirror code { font-family: monospace; background: rgba(255,255,255,0.12); padding: 1px 5px; border-radius: 3px; font-size: 16px; }
    .milkdown .ProseMirror blockquote { border-left: 2px solid rgba(255,255,255,0.5); padding-left: 14px; margin: 0; }
    .milkdown .ProseMirror blockquote p { opacity: 0.8; }

    #status {
      color: rgba(255,255,255,0.4);
      font-size: 15px;
      padding: 24px 0;
    }
  </style>
</head>
<body>
  <div id="app">
    <div id="status">Loading Milkdown...</div>
  </div>

  <script type="module">
    import { Editor, rootCtx, defaultValueCtx } from 'https://esm.sh/@milkdown/core@7'
    import { commonmark } from 'https://esm.sh/@milkdown/preset-commonmark@7'
    import { listener, listenerCtx } from 'https://esm.sh/@milkdown/plugin-listener@7'

    const INITIAL = [
      '# Hello Milkdown',
      '',
      'Type **bold**, *italic*, or inline code.',
      '',
      '## Lists',
      '',
      '- First item',
      '- Second item',
      '',
      '> A blockquote looks like this.',
      '',
      'If this feels good on the LP3, we ship it.',
    ].join('\\n')

    const statusEl = document.getElementById('status')

    try {
      const editor = await Editor.make()
        .config(ctx => {
          ctx.set(rootCtx, document.getElementById('app'))
          ctx.set(defaultValueCtx, INITIAL)
          ctx.get(listenerCtx).markdownUpdated((_ctx, markdown) => {
            window.ReactNativeWebView?.postMessage(
              JSON.stringify({ type: 'content', markdown })
            )
          })
        })
        .use(commonmark)
        .use(listener)
        .create()

      statusEl?.remove()
      document.querySelector('.ProseMirror')?.focus()
    } catch (err) {
      if (statusEl) statusEl.textContent = 'Error: ' + err.message
    }

    // When the keyboard appears, scroll the cursor line into view.
    // The document scrolls naturally — no custom container needed.
    window.visualViewport?.addEventListener('resize', () => {
      setTimeout(() => {
        const focusNode = window.getSelection()?.focusNode
        if (focusNode) {
          const el = focusNode.nodeType === Node.TEXT_NODE
            ? focusNode.parentElement
            : focusNode
          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }, 100)
    })

    // Theme updates from React Native
    const onMsg = e => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'theme') {
          document.body.style.background = msg.bg
          document.body.style.color = msg.textColor
        }
      } catch {
        // non-JSON — ignore
      }
    }
    window.addEventListener('message', onMsg)
    document.addEventListener('message', onMsg)
  </script>
</body>
</html>`;

export default function EditorTestScreen() {
  const webViewRef = useRef<WebView>(null);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Minimal header */}
      <View style={styles.header}>
        <HapticPressable onPress={goBack}>
          <View style={styles.headerBtn}>
            <MaterialIcons color="white" name="arrow-back-ios" size={n(28)} />
          </View>
        </HapticPressable>
        <StyledText style={styles.headerTitle}>Editor PoC</StyledText>
        <HapticPressable
          onPress={() => {
            webViewRef.current?.injectJavaScript(
              "document.activeElement?.blur(); true;"
            );
          }}
        >
          <View style={styles.headerBtn}>
            <MaterialIcons color="white" name="check" size={n(28)} />
          </View>
        </HapticPressable>
      </View>

      <WebView
        // Transparent so our SafeAreaView bg shows through loading flash
        backgroundColor="black"
        // Keyboard / focus
        keyboardDisplayRequiresUserAction={false}
        mixedContentMode="always"
        // Errors
        onError={(e) =>
          console.warn("[EditorPoC] WebView error:", e.nativeEvent.description)
        }
        // Content updates from the editor back to RN
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "content") {
              // Just log for now — in real integration this would save the note
              console.log("[EditorPoC]", data.markdown.slice(0, 100));
            }
          } catch {
            // non-JSON message — ignore
          }
        }}
        // Allow loading CDN scripts
        originWhitelist={["*"]}
        overScrollMode="never"
        ref={webViewRef}
        // Scrolling lives inside the WebView
        scrollEnabled
        showsVerticalScrollIndicator={false}
        source={{ html: EDITOR_HTML }}
        style={styles.webView}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: n(22),
    paddingVertical: n(5),
  },
  headerBtn: {
    width: n(32),
    height: n(32),
    alignItems: "center",
    paddingTop: n(6),
    paddingRight: n(4),
  },
  headerTitle: {
    fontSize: n(20),
    paddingTop: n(2),
  },
  webView: {
    flex: 1,
    backgroundColor: "black",
  },
});
