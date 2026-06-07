import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticPressable } from "@/components/HapticPressable";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
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
  const { notes, updateNote, renameNote } = useComposer();
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const note = notes.find((n) => n.id === id);

  const [body, setBody] = useState(note?.body ?? "");
  // Start in preview for existing notes with content, edit for new/empty notes
  const [isPreviewMode, setIsPreviewMode] = useState(
    autoFocus !== "1" && (note?.body ?? "").trim() !== ""
  );
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(note?.title ?? "");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const bodyInputRef = useRef<TextInput>(null);
  const titleInputRef = useRef<TextInput>(null);
  const persistDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const bodyRef = useRef(body);
  bodyRef.current = body;
  const idRef = useRef(id);
  idRef.current = id;
  const updateNoteRef = useRef(updateNote);
  updateNoteRef.current = updateNote;

  // Save on unmount
  useEffect(
    () => () => {
      if (persistDebounceRef.current) {
        clearTimeout(persistDebounceRef.current);
      }
      if (idRef.current) {
        updateNoteRef.current(idRef.current, {
          body: bodyRef.current,
          updatedAt: Date.now(),
        });
      }
    },
    []
  );

  // Auto-focus body for new notes
  useEffect(() => {
    if (autoFocus === "1") {
      const t = setTimeout(() => bodyInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

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

  const handleBodyChange = (text: string) => {
    setBody(text);
    bodyRef.current = text;

    if (persistDebounceRef.current) {
      clearTimeout(persistDebounceRef.current);
    }
    persistDebounceRef.current = setTimeout(() => {
      updateNote(id, { body: text, updatedAt: Date.now() });
    }, PERSIST_DEBOUNCE_MS);
  };

  const handleTogglePreview = () => {
    if (!isPreviewMode) {
      Keyboard.dismiss();
    }
    setIsPreviewMode((prev) => !prev);
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
    <SwipeBackContainer
      onSwipeBack={() => {
        Keyboard.dismiss();
        goBack();
      }}
    >
      <SafeAreaView
        edges={["top"]}
        style={[styles.container, { backgroundColor: bg }]}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: bg }]}>
          {/* Back */}
          <HapticPressable
            onPress={() => {
              Keyboard.dismiss();
              goBack();
            }}
          >
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

          {/* Right: preview toggle + hamburger */}
          <View style={styles.headerRight}>
            <HapticPressable onPress={handleTogglePreview}>
              <View style={styles.headerBtn}>
                <MaterialIcons
                  color={textColor}
                  name={isPreviewMode ? "edit" : "visibility"}
                  size={n(24)}
                />
              </View>
            </HapticPressable>
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
        </View>

        {/* Body */}
        <ScrollView
          contentContainerStyle={styles.bodyContent}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          style={styles.bodyScroll}
        >
          {isPreviewMode ? (
            <MarkdownRenderer textColor={textColor}>
              {body.trim() ? body : " "}
            </MarkdownRenderer>
          ) : (
            <TextInput
              allowFontScaling={false}
              autoCapitalize="sentences"
              autoCorrect
              blurOnSubmit={false}
              cursorColor={textColor}
              multiline
              onChangeText={handleBodyChange}
              paddingLeft={0}
              placeholder="Type type type"
              placeholderTextColor={textColor}
              ref={bodyInputRef}
              scrollEnabled={false}
              selectionColor={textColor}
              style={[styles.bodyInput, { color: textColor }]}
              textAlignVertical="top"
              value={body}
            />
          )}
        </ScrollView>
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
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
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: n(22),
    paddingTop: n(10),
    paddingBottom: n(40),
    flexGrow: 1,
  },
  bodyInput: {
    fontFamily: "PublicSans-Regular",
    fontSize: n(18),
    lineHeight: n(28),
    minHeight: n(200),
    paddingLeft: 0,
  },
  placeholder: {
    fontSize: n(18),
    opacity: 0.4,
  },
});
