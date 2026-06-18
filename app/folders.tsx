import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticPressable } from "@/components/HapticPressable";
import { PlusEditIcon } from "@/components/PlusEditIcon";
import { SettingsIcon } from "@/components/SettingsIcon";
import { StyledText } from "@/components/StyledText";
import { useComposer } from "@/contexts/ComposerContext";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import {
  scrollIndicatorBaseStyles,
  useScrollIndicator,
} from "@/hooks/useScrollIndicator";
import { n } from "@/utils/scaling";
import { sharedStyles } from "@/utils/sharedStyles";

function formatFolderCount(count: number): string {
  if (count === 0) {
    return "No Notes";
  }
  return count === 1 ? "1 Note" : `${count} Notes`;
}

export default function FoldersScreen() {
  const { invertColors } = useInvertColors();
  const { folders, notes, addNote, moveFolderUp, moveFolderDown } =
    useComposer();
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const params = useLocalSearchParams<{ startReorder?: string }>();
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    if (params.startReorder === "true") {
      setIsReordering(true);
      router.setParams({ startReorder: undefined });
    }
  }, [params.startReorder]);

  const {
    handleScroll,
    scrollIndicatorHeight,
    scrollIndicatorPosition,
    setContentHeight,
    setScrollViewHeight,
  } = useScrollIndicator();

  const sorted = [...folders].sort((a, b) => a.order - b.order);

  const noteCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const note of notes) {
      if (note.folderId) {
        map.set(note.folderId, (map.get(note.folderId) ?? 0) + 1);
      }
    }
    return map;
  }, [notes]);

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: bg }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={sharedStyles.headerBtn} />
        <StyledText style={[styles.headerTitle, { color: textColor }]}>
          Folders
        </StyledText>
        {isReordering ? (
          <HapticPressable onPress={() => setIsReordering(false)}>
            <View style={sharedStyles.headerBtn}>
              <MaterialIcons color={textColor} name="check" size={n(28)} />
            </View>
          </HapticPressable>
        ) : (
          <HapticPressable onPress={() => router.push("/folder-new")}>
            <View style={sharedStyles.headerBtn}>
              <MaterialIcons color={textColor} name="add" size={n(28)} />
            </View>
          </HapticPressable>
        )}
      </View>

      {/* Folder list */}
      <View style={styles.scrollWrapper}>
        {sorted.length === 0 ? (
          <View style={styles.emptyContainer}>
            <StyledText style={[styles.emptyText, { color: textColor }]}>
              no folders
            </StyledText>
          </View>
        ) : (
          <>
            <Animated.ScrollView
              onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
              onScroll={handleScroll}
              overScrollMode="never"
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
            >
              <View
                onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
              >
                {sorted.map((folder, idx) => (
                  <HapticPressable
                    delayLongPress={400}
                    key={folder.id}
                    onLongPress={() => {
                      if (!isReordering) {
                        router.push({
                          pathname: "/folder-actions/[id]",
                          params: { id: folder.id },
                        });
                      }
                    }}
                    onPress={() => {
                      if (!isReordering) {
                        router.push({
                          pathname: "/folder/[id]",
                          params: { id: folder.id },
                        });
                      }
                    }}
                    style={styles.folderRow}
                  >
                    <View style={styles.folderInfo}>
                      <StyledText
                        numberOfLines={1}
                        style={[styles.folderName, { color: textColor }]}
                      >
                        {folder.name}
                      </StyledText>
                      <View style={styles.folderMeta}>
                        <MaterialCommunityIcons
                          color={textColor}
                          name="folder-outline"
                          size={n(18)}
                          style={styles.folderMetaIcon}
                        />
                        <StyledText
                          style={[styles.folderCount, { color: textColor }]}
                        >
                          {formatFolderCount(noteCounts.get(folder.id) ?? 0)}
                        </StyledText>
                      </View>
                    </View>
                    {isReordering && (
                      <View style={styles.arrowGroup}>
                        <HapticPressable
                          disabled={idx === 0}
                          onPress={() => moveFolderUp(folder.id)}
                        >
                          <MaterialIcons
                            color={textColor}
                            name="keyboard-arrow-up"
                            size={n(32)}
                            style={idx === 0 && styles.arrowDisabled}
                          />
                        </HapticPressable>
                        <HapticPressable
                          disabled={idx === sorted.length - 1}
                          onPress={() => moveFolderDown(folder.id)}
                        >
                          <MaterialIcons
                            color={textColor}
                            name="keyboard-arrow-down"
                            size={n(32)}
                            style={
                              idx === sorted.length - 1 && styles.arrowDisabled
                            }
                          />
                        </HapticPressable>
                      </View>
                    )}
                  </HapticPressable>
                ))}
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
        <HapticPressable onPress={() => router.push("/settings")}>
          <SettingsIcon color={textColor} size={40} />
        </HapticPressable>
        <HapticPressable onPress={() => router.replace("/")}>
          <StyledText style={[styles.toolbarLabel, { color: textColor }]}>
            NOTES
          </StyledText>
        </HapticPressable>
        <HapticPressable
          onPress={() => {
            const id = addNote();
            router.push({
              pathname: "/note/[id]",
              params: { id, autoFocus: "1" },
            });
          }}
        >
          <PlusEditIcon color={textColor} size={38} />
        </HapticPressable>
      </View>
    </SafeAreaView>
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: n(24),
  },
  scrollTrack: scrollIndicatorBaseStyles.track,
  scrollThumb: scrollIndicatorBaseStyles.thumb,
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: n(26),
    paddingVertical: n(11),
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: n(30),
  },
  folderMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: n(2),
  },
  folderMetaIcon: {
    marginRight: n(5),
  },
  folderCount: {
    fontSize: n(16),
  },
  arrowGroup: {
    flexDirection: "row",
    gap: n(8),
    paddingRight: n(4),
  },
  arrowDisabled: {
    opacity: 0.2,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: n(11),
    paddingHorizontal: n(26),
  },
  toolbarLabel: {
    fontFamily: "PublicSans-Regular",
    fontSize: n(25),
    letterSpacing: n(3),
  },
});
