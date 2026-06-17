import { MaterialIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticPressable } from "@/components/HapticPressable";
import { StyledText } from "@/components/StyledText";
import { SwipeBackContainer } from "@/components/SwipeBackContainer";
import { Toast } from "@/components/Toast";
import { useComposer } from "@/contexts/ComposerContext";
import { useEditor } from "@/contexts/EditorContext";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { goBack } from "@/utils/navigation";
import { n } from "@/utils/scaling";
import { getDisplayTitle } from "@/utils/stripMarkdown";

export default function NoteEditorScreen() {
  const { id, autoFocus, toast } = useLocalSearchParams<{
    id: string;
    autoFocus?: string;
    toast?: string;
  }>();

  const { invertColors } = useInvertColors();
  const { notes } = useComposer();
  const { body, keyboardVisible, openNote, closeNote, dismissKeyboard } =
    useEditor();
  const isFocused = useIsFocused();
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const note = notes.find((n) => n.id === id);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Capture mount-time values so the open effect doesn't re-fire on body updates
  const mountParamsRef = useRef({
    id,
    body: note?.body ?? "",
    title: note?.title ?? null,
    autoFocus: autoFocus === "1",
  });

  // Open the pre-warmed editor with this note's content; close on unmount
  useEffect(() => {
    const {
      id: noteId,
      body: initialBody,
      title,
      autoFocus: af,
    } = mountParamsRef.current;
    openNote({ id: noteId, body: initialBody, title, autoFocus: af });
    return closeNote;
  }, [openNote, closeNote]);

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

  const handleBack = () => {
    dismissKeyboard();
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
        pointerEvents="box-none"
        style={[styles.container, { backgroundColor: "transparent" }]}
      >
        {/* Header — opaque to cover the pre-warmed WebView; hidden when unfocused to prevent lingering over the incoming screen */}
        <View style={[styles.header, { backgroundColor: bg, opacity: isFocused ? 1 : 0 }]}>
          <HapticPressable onPress={handleBack}>
            <View style={styles.headerBtn}>
              <MaterialIcons
                color={textColor}
                name="arrow-back-ios"
                size={n(28)}
              />
            </View>
          </HapticPressable>

          <HapticPressable
            onPress={handleTitlePress}
            style={styles.titlePressable}
          >
            <StyledText numberOfLines={1} style={styles.titleText}>
              {displayTitle}
            </StyledText>
          </HapticPressable>

          {keyboardVisible ? (
            <HapticPressable onPress={dismissKeyboard}>
              <View style={styles.headerBtn}>
                <MaterialIcons
                  color={textColor}
                  name="keyboard-arrow-down"
                  size={n(28)}
                />
              </View>
            </HapticPressable>
          ) : (
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
          )}
        </View>

        {/* Transparent placeholder — the pre-warmed WebView shows through from _layout.tsx */}
        <View pointerEvents="none" style={styles.editorPlaceholder} />
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
    paddingTop: n(5),
    paddingBottom: n(20),
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
    paddingHorizontal: n(28),
  },
  titleText: {
    fontSize: n(20),
    paddingTop: n(2),
  },
  editorPlaceholder: { flex: 1 },
});
