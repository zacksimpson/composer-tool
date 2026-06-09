import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
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
  const { id, autoFocus, action, toast } = useLocalSearchParams<{
    id: string;
    autoFocus?: string;
    action?: string;
    toast?: string;
  }>();

  const { invertColors } = useInvertColors();
  const { notes, updateNote, renameNote, deleteNote } = useComposer();
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const note = notes.find((n) => n.id === id);

  const [body, setBody] = useState(note?.body ?? "");
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(note?.title ?? "");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const webViewRef = useRef<WebView>(null);
  const titleInputRef = useRef<TextInput>(null);
  const persistDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const bodyRef = useRef(body);
  bodyRef.current = body;
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
        if (isEmpty) {
          deleteNoteRef.current(idRef.current);
        } else {
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

  // Handle params returned from note-actions screen
  useFocusEffect(
    useCallback(() => {
      if (action === "rename") {
        setIsTitleEditing(true);
        setTitleDraft(note?.title ?? "");
        setTimeout(() => titleInputRef.current?.focus(), 100);
        router.setParams({ action: undefined });
      }
      if (toast) {
        setToastMessage(toast);
        setToastVisible(true);
        router.setParams({ toast: undefined });
      }
    }, [action, toast, note?.title])
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

  const handleTitleBlur = () => {
    setIsTitleEditing(false);
    const trimmed = titleDraft.trim() || null;
    renameNote(id, trimmed);
  };

  const handleTitlePress = () => {
    setIsTitleEditing(true);
    setTitleDraft(note?.title ?? "");
    setTimeout(() => titleInputRef.current?.focus(), 50);
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
          {isTitleEditing ? (
            <TextInput
              allowFontScaling={false}
              autoCapitalize="none"
              autoCorrect={false}
              cursorColor={textColor}
              onBlur={handleTitleBlur}
              onChangeText={setTitleDraft}
              onSubmitEditing={handleTitleBlur}
              placeholder="Title"
              placeholderTextColor={textColor}
              ref={titleInputRef}
              returnKeyType="done"
              selectionColor={textColor}
              style={[styles.titleInput, { color: textColor }]}
              value={titleDraft}
            />
          ) : (
            <HapticPressable
              onPress={handleTitlePress}
              style={styles.titlePressable}
            >
              <StyledText numberOfLines={1} style={styles.titleText}>
                {displayTitle}
              </StyledText>
            </HapticPressable>
          )}

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
  titleInput: {
    flex: 1,
    fontFamily: "PublicSans-Regular",
    fontSize: n(20),
    paddingHorizontal: n(8),
    paddingLeft: 0,
    paddingVertical: 0,
    textAlign: "center",
  },
  webView: {
    flex: 1,
  },
});
