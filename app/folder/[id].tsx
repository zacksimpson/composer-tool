import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticPressable } from "@/components/HapticPressable";
import { NoteEditIcon } from "@/components/NoteEditIcon";
import { PlusEditIcon } from "@/components/PlusEditIcon";
import { SettingsIcon } from "@/components/SettingsIcon";
import { StyledText } from "@/components/StyledText";
import { SwipeBackContainer } from "@/components/SwipeBackContainer";
import { Toast } from "@/components/Toast";
import { useComposer } from "@/contexts/ComposerContext";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import {
  scrollIndicatorBaseStyles,
  useScrollIndicator,
} from "@/hooks/useScrollIndicator";
import { formatDate } from "@/utils/formatDate";
import { triggerHaptic } from "@/utils/haptics";
import { goBack } from "@/utils/navigation";
import { n } from "@/utils/scaling";
import { sharedStyles } from "@/utils/sharedStyles";
import { getDisplayTitle } from "@/utils/stripMarkdown";

export default function FolderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { invertColors } = useInvertColors();
  const { notes, folders, addNote, moveNotesToFolder, settings } =
    useComposer();
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const folder = folders.find((f) => f.id === id);
  const folderNotes = notes.filter((n) => n.folderId === id);

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
        setIsEditMode(false);
        setSelectedIds(new Set());
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

  const sortKey = settings.sortOrder === "created" ? "createdAt" : "updatedAt";
  const sorted = [...folderNotes].sort((a, b) => b[sortKey] - a[sortKey]);

  const handleNewNote = () => {
    const noteId = addNote(id);
    router.push({
      pathname: "/note/[id]",
      params: { id: noteId, autoFocus: "1" },
    });
  };

  const handleNotePress = (noteId: string) => {
    if (isEditMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(noteId)) {
          next.delete(noteId);
        } else {
          next.add(noteId);
        }
        return next;
      });
    } else {
      router.push({ pathname: "/note/[id]", params: { id: noteId } });
    }
  };

  const handleNoteLongPress = (noteId: string) => {
    if (!isEditMode) {
      triggerHaptic();
      setIsEditMode(true);
      setSelectedIds(new Set([noteId]));
    }
  };

  const exitEditMode = () => {
    setIsEditMode(false);
    setSelectedIds(new Set());
  };

  const handleDelete = () => {
    const ids = Array.from(selectedIds);
    const count = ids.length;
    router.push({
      pathname: "/confirm",
      params: {
        message: count === 1 ? "Delete this note?" : `Delete ${count} notes?`,
        confirmText: "Delete",
        action: `delete-notes:${ids.join(",")}`,
        returnPath: `/folder/${id}`,
      },
    });
  };

  const handleRemove = () => {
    moveNotesToFolder(Array.from(selectedIds), null);
    exitEditMode();
  };

  if (!folder) {
    return null;
  }

  return (
    <SwipeBackContainer onSwipeBack={goBack}>
      <SafeAreaView
        edges={["top"]}
        style={[styles.container, { backgroundColor: bg }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <HapticPressable onPress={goBack}>
            <View style={sharedStyles.headerBtn}>
              <MaterialIcons
                color={textColor}
                name="arrow-back-ios"
                size={n(28)}
              />
            </View>
          </HapticPressable>
          <StyledText
            numberOfLines={1}
            style={[styles.headerTitle, { color: textColor }]}
          >
            {folder.name}
          </StyledText>
          <View style={sharedStyles.headerBtn} />
        </View>

        {/* Notes list */}
        <View style={styles.scrollWrapper}>
          {sorted.length === 0 ? (
            <View style={styles.emptyContainer}>
              <StyledText style={[styles.emptyText, { color: textColor }]}>
                no notes in this folder
              </StyledText>
            </View>
          ) : (
            <>
              <Animated.ScrollView
                keyboardShouldPersistTaps="handled"
                onLayout={(e) =>
                  setScrollViewHeight(e.nativeEvent.layout.height)
                }
                onScroll={handleScroll}
                overScrollMode="never"
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
              >
                <View
                  onLayout={(e) =>
                    setContentHeight(e.nativeEvent.layout.height)
                  }
                >
                  {sorted.map((note) => {
                    const isSelected = selectedIds.has(note.id);
                    return (
                      <HapticPressable
                        key={note.id}
                        onLongPress={() => handleNoteLongPress(note.id)}
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
                          <StyledText
                            numberOfLines={1}
                            style={[styles.noteTitle, { color: textColor }]}
                          >
                            {getDisplayTitle(note.title, note.body)}
                          </StyledText>
                          <View style={styles.noteMeta}>
                            <NoteEditIcon
                              color={textColor}
                              size={18}
                              style={styles.editIcon}
                            />
                            <StyledText
                              style={[styles.noteDate, { color: textColor }]}
                            >
                              {formatDate(note[sortKey])}
                            </StyledText>
                          </View>
                        </View>
                      </HapticPressable>
                    );
                  })}
                </View>
              </Animated.ScrollView>

              {scrollIndicatorHeight > 0 && (
                <View
                  style={[styles.scrollTrack, { backgroundColor: textColor }]}
                >
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
            </>
          )}
        </View>

        {/* Bottom toolbar */}
        <View style={[styles.toolbar, { backgroundColor: bg }]}>
          {isEditMode ? (
            <View style={styles.editToolbar}>
              {selectedIds.size > 0 ? (
                <HapticPressable
                  onPress={handleDelete}
                  style={styles.editToolbarLeft}
                >
                  <StyledText
                    style={[styles.toolbarLabel, { color: textColor }]}
                  >
                    DELETE
                  </StyledText>
                </HapticPressable>
              ) : (
                <View style={styles.editToolbarLeft} />
              )}

              {/* X — centered */}
              <HapticPressable onPress={exitEditMode}>
                <MaterialIcons color={textColor} name="close" size={n(40)} />
              </HapticPressable>

              {selectedIds.size > 0 ? (
                <HapticPressable
                  onPress={handleRemove}
                  style={styles.editToolbarRight}
                >
                  <StyledText
                    style={[styles.toolbarLabel, { color: textColor }]}
                  >
                    REMOVE
                  </StyledText>
                </HapticPressable>
              ) : (
                <View style={styles.editToolbarRight} />
              )}
            </View>
          ) : (
            <>
              <HapticPressable onPress={() => router.push("/settings")}>
                <SettingsIcon color={textColor} size={40} />
              </HapticPressable>

              <HapticPressable onPress={() => router.replace("/")}>
                <StyledText style={[styles.toolbarLabel, { color: textColor }]}>
                  NOTES
                </StyledText>
              </HapticPressable>

              <HapticPressable onPress={handleNewNote}>
                <PlusEditIcon color={textColor} size={38} />
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
  },
  headerTitle: {
    fontSize: n(20),
    paddingTop: n(2),
  },
  scrollWrapper: { flex: 1, flexDirection: "row", position: "relative" },
  scrollTrack: scrollIndicatorBaseStyles.track,
  scrollThumb: scrollIndicatorBaseStyles.thumb,
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: n(26),
    paddingVertical: n(11),
    paddingRight: n(36),
  },
  checkboxArea: { marginRight: n(12), paddingTop: n(5) },
  noteText: { flex: 1 },
  noteTitle: { fontSize: n(24), letterSpacing: n(0.5) },
  noteMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: n(2),
  },
  editIcon: { marginRight: n(5) },
  noteDate: { fontSize: n(16) },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: n(24),
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: n(11),
    paddingHorizontal: n(26),
  },
  editToolbar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editToolbarLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  editToolbarRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  toolbarLabel: {
    fontFamily: "PublicSans-Regular",
    fontSize: n(25),
    letterSpacing: n(3),
  },
});
