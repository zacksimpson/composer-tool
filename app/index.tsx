import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticPressable } from "@/components/HapticPressable";
import { PlusEditIcon } from "@/components/PlusEditIcon";
import { SettingsIcon } from "@/components/SettingsIcon";
import { StyledText } from "@/components/StyledText";
import { Toast } from "@/components/Toast";
import { useComposer } from "@/contexts/ComposerContext";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import {
  scrollIndicatorBaseStyles,
  useScrollIndicator,
} from "@/hooks/useScrollIndicator";
import { n } from "@/utils/scaling";
import { getDisplayTitle } from "@/utils/stripMarkdown";

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function NotesListScreen() {
  const { invertColors } = useInvertColors();
  const { notes, addNote, deleteNotes } = useComposer();
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const params = useLocalSearchParams<{ toast?: string }>();

  useFocusEffect(
    useCallback(() => {
      if (params.toast) {
        setToastMessage(params.toast);
        setToastVisible(true);
        router.setParams({ toast: undefined });
      }
    }, [params.toast])
  );

  const {
    handleScroll,
    scrollIndicatorHeight,
    scrollIndicatorPosition,
    setContentHeight,
    setScrollViewHeight,
  } = useScrollIndicator();

  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  const handleNewNote = () => {
    const id = addNote();
    router.push({ pathname: "/note/[id]", params: { id, autoFocus: "1" } });
  };

  const handleNotePress = (id: string) => {
    if (isEditMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    } else {
      router.push({ pathname: "/note/[id]", params: { id } });
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      setIsEditMode(false);
      setSelectedIds(new Set());
    } else {
      setIsEditMode(true);
    }
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) {
      return;
    }
    const ids = Array.from(selectedIds);
    deleteNotes(ids);
    setSelectedIds(new Set());
    setIsEditMode(false);
  };

  const deleteLabel =
    selectedIds.size > 0 ? `DELETE (${selectedIds.size})` : "DELETE";
  const deleteDisabled = selectedIds.size === 0;

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: bg }]}
    >
      {/* Notes list */}
      <View style={styles.scrollWrapper}>
        <Animated.ScrollView
          keyboardShouldPersistTaps="handled"
          onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
          onScroll={handleScroll}
          overScrollMode="never"
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <View onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}>
            {sorted.map((note) => {
              const isSelected = selectedIds.has(note.id);
              return (
                <HapticPressable
                  key={note.id}
                  onPress={() => handleNotePress(note.id)}
                  style={styles.noteRow}
                >
                  {isEditMode && (
                    <View style={styles.checkboxArea}>
                      {isSelected ? (
                        <MaterialIcons
                          color={textColor}
                          name="check-box"
                          size={n(24)}
                        />
                      ) : (
                        <MaterialIcons
                          color={textColor}
                          name="check-box-outline-blank"
                          size={n(24)}
                        />
                      )}
                    </View>
                  )}
                  <View style={styles.noteText}>
                    <StyledText numberOfLines={1} style={styles.noteTitle}>
                      {getDisplayTitle(note.title, note.body)}
                    </StyledText>
                    <View style={styles.noteMeta}>
                      <MaterialIcons
                        color={textColor}
                        name="edit"
                        size={n(14)}
                        style={styles.editIcon}
                      />
                      <StyledText style={styles.noteDate}>
                        {formatDate(note.updatedAt)}
                      </StyledText>
                    </View>
                  </View>
                </HapticPressable>
              );
            })}
          </View>
        </Animated.ScrollView>

        {scrollIndicatorHeight > 0 && (
          <View style={[styles.scrollTrack, { backgroundColor: textColor }]}>
            <Animated.View
              style={[
                styles.scrollThumb,
                {
                  backgroundColor: textColor,
                  height: scrollIndicatorHeight,
                  transform: [{ translateY: scrollIndicatorPosition }],
                },
              ]}
            />
          </View>
        )}
      </View>

      {/* Bottom toolbar */}
      <View style={[styles.toolbar, { backgroundColor: bg }]}>
        {isEditMode ? (
          <>
            {/* Cancel (left) */}
            <HapticPressable onPress={handleEditToggle}>
              <MaterialIcons color={textColor} name="close" size={n(40)} />
            </HapticPressable>

            {/* Delete (center) */}
            <HapticPressable disabled={deleteDisabled} onPress={handleDelete}>
              <StyledText
                style={[
                  styles.toolbarLabel,
                  { color: textColor, opacity: deleteDisabled ? 0.3 : 1 },
                ]}
              >
                {deleteLabel}
              </StyledText>
            </HapticPressable>

            {/* Done (right) */}
            <HapticPressable onPress={handleEditToggle}>
              <StyledText style={[styles.toolbarLabel, { color: textColor }]}>
                DONE
              </StyledText>
            </HapticPressable>
          </>
        ) : (
          <>
            {/* Settings (left) */}
            <HapticPressable onPress={() => router.push("/settings")}>
              <SettingsIcon color={textColor} size={40} />
            </HapticPressable>

            {/* Edit mode (center) */}
            <HapticPressable onPress={handleEditToggle}>
              <StyledText style={[styles.toolbarLabel, { color: textColor }]}>
                EDIT
              </StyledText>
            </HapticPressable>

            {/* New note (right) */}
            <HapticPressable onPress={handleNewNote}>
              <PlusEditIcon color={textColor} size={40} />
            </HapticPressable>
          </>
        )}
      </View>

      <Toast
        message={toastMessage}
        onHide={() => setToastVisible(false)}
        visible={toastVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollWrapper: { flex: 1, flexDirection: "row", position: "relative" },
  scrollTrack: scrollIndicatorBaseStyles.track,
  scrollThumb: scrollIndicatorBaseStyles.thumb,
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: n(22),
    paddingVertical: n(11),
    paddingRight: n(32),
  },
  checkboxArea: {
    marginRight: n(12),
  },
  noteText: {
    flex: 1,
  },
  noteTitle: {
    fontSize: n(30),
  },
  noteMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: n(2),
  },
  editIcon: {
    marginRight: n(5),
    opacity: 0.7,
  },
  noteDate: {
    fontSize: n(14),
    opacity: 0.7,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: n(11),
    paddingHorizontal: n(20),
  },
  toolbarLabel: {
    fontFamily: "PublicSans-Regular",
    fontSize: n(23),
    letterSpacing: n(3),
  },
});
