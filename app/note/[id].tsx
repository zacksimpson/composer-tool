import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { WebViewMessageEvent } from "react-native-webview";
import WebView from "react-native-webview";
import { MILKDOWN_EDITOR_HTML } from "@/assets/milkdown-editor";
import { HapticPressable } from "@/components/HapticPressable";
import { StyledText } from "@/components/StyledText";
import { SwipeBackContainer } from "@/components/SwipeBackContainer";
import { Toast } from "@/components/Toast";
import { useComposer } from "@/contexts/ComposerContext";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { goBack } from "@/utils/navigation";
import { n } from "@/utils/scaling";
import { getDisplayTitle } from "@/utils/stripMarkdown";

const PERSIST_DEBOUNCE_MS = 600;

export default function NoteEditorScreen() {
  const { id, autoFocus, toast } = useLocalSearchParams<{
    id: string;
    autoFocus?: string;
    toast?: string;
  }>();

  const { invertColors } = useInvertColors();
  const { notes, updateNote, deleteNote } = useComposer();
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const note = notes.find((n) => n.id === id);

  const [body, setBody] = useState(note?.body ?? "");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const webViewRef = useRef<WebView>(null);
  const persistDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const bodyRef = useRef(body);
  bodyRef.current = body;
  const initialBodyRef = useRef(note?.body ?? "");
  const idRef = useRef(id);
  idRef.current = id;
  const updateNoteRef = useRef(updateNote);
  updateNoteRef.current = updateNote;
  const deleteNoteRef = useRef(deleteNote);
  deleteNoteRef.current = deleteNote;
  const noteTitleRef = useRef(note?.title ?? null);
  noteTitleRef.current = note?.title ?? null;

  // Stamp initial content and theme into the HTML once on mount.
  // Replacing string literals in the bundle avoids an async init roundtrip —
  // the editor starts with the correct content and colors immediately.
  const editorHtml = useRef(
    MILKDOWN_EDITOR_HTML.replace(
      '"COMPOSER_INIT"',
      JSON.stringify(note?.body ?? "")
    )
      .replaceAll("COMPOSER_BG", bg)
      .replaceAll("COMPOSER_TEXT", textColor)
  ).current;

  // Save on unmount — delete if body is empty and no custom title was set
  useEffect(
    () => () => {
      if (persistDebounceRef.current) {
        clearTimeout(persistDebounceRef.current);
      }
      if (idRef.current) {
        const isEmpty =
          bodyRef.current.trim() === "" && noteTitleRef.current === null;
        const bodyChanged = bodyRef.current !== initialBodyRef.current;
        if (isEmpty) {
          deleteNoteRef.current(idRef.current);
        } else if (bodyChanged) {
          updateNoteRef.current(idRef.current, {
            body: bodyRef.current,
            updatedAt: Date.now(),
          });
        }
      }
    },
    []
  );

  // Push theme changes into the live editor after invertColors toggles
  useEffect(() => {
    webViewRef.current?.injectJavaScript(
      `window.composerBridge?.setTheme(${JSON.stringify(bg)}, ${JSON.stringify(textColor)}); true;`
    );
  }, [bg, textColor]);

  // Consume toast param returned from other screens
  useFocusEffect(
    useCallback(() => {
      if (toast) {
        setToastMessage(toast);
        setToastVisible(true);
        router.setParams({ toast: undefined });
      }
    }, [toast])
  );

  const handleWebViewLoad = () => {
    if (autoFocus === "1") {
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(
          "window.composerBridge?.focus(); true;"
        );
      }, 150);
    }
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type: string;
        markdown?: string;
      };
      if (data.type === "change" && data.markdown !== undefined) {
        const { markdown } = data;
        setBody(markdown);
        bodyRef.current = markdown;
        if (persistDebounceRef.current) {
          clearTimeout(persistDebounceRef.current);
        }
        persistDebounceRef.current = setTimeout(() => {
          updateNote(id, { body: markdown, updatedAt: Date.now() });
        }, PERSIST_DEBOUNCE_MS);
      }
    } catch {
      // non-JSON WebView message — ignore
    }
  };

  const handleBack = () => {
    webViewRef.current?.injectJavaScript(
      "document.activeElement?.blur(); true;"
    );
    goBack();
  };

  const handleTitlePress = () => {
    router.push({ pathname: "/note-rename/[id]", params: { id } });
  };

  const displayTitle = note ? getDisplayTitle(note.title, body) : "Untitled";

  if (!note) {
    return null;
  }

  return (
    <SwipeBackContainer onSwipeBack={handleBack}>
      <SafeAreaView
        edges={["top"]}
        style={[styles.container, { backgroundColor: bg }]}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: bg }]}>
          {/* Back */}
          <HapticPressable onPress={handleBack}>
            <View style={styles.headerBtn}>
              <MaterialIcons
                color={textColor}
                name="arrow-back-ios"
                size={n(28)}
              />
            </View>
          </HapticPressable>

          {/* Title */}
          <HapticPressable
            onPress={handleTitlePress}
            style={styles.titlePressable}
          >
            <StyledText numberOfLines={1} style={styles.titleText}>
              {displayTitle}
            </StyledText>
          </HapticPressable>

          {/* Hamburger */}
          <HapticPressable
            onPress={() =>
              router.push({
                pathname: "/note-actions/[id]",
                params: { id },
              })
            }
          >
            <View style={styles.headerBtn}>
              <MaterialIcons color={textColor} name="menu" size={n(28)} />
            </View>
          </HapticPressable>
        </View>

        {/* Editor */}
        <WebView
          backgroundColor={bg}
          onError={(e) =>
            console.warn("[Editor] WebView error:", e.nativeEvent.description)
          }
          onLoad={handleWebViewLoad}
          onMessage={handleMessage}
          originWhitelist={["*"]}
          overScrollMode="never"
          ref={webViewRef}
          scrollEnabled
          showsVerticalScrollIndicator={false}
          source={{ html: editorHtml }}
          style={[styles.webView, { backgroundColor: bg }]}
        />
      </SafeAreaView>

      <Toast
        message={toastMessage}
        onHide={() => setToastVisible(false)}
        visible={toastVisible}
      />
    </SwipeBackContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: n(22),
    paddingVertical: n(5),
    zIndex: 1,
  },
  headerBtn: {
    width: n(32),
    height: n(32),
    alignItems: "center",
    paddingTop: n(6),
    paddingRight: n(4),
  },
  titlePressable: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: n(8),
  },
  titleText: {
    fontSize: n(20),
    paddingTop: n(2),
  },
  webView: {
    flex: 1,
  },
});
