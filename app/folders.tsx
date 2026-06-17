import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticPressable } from "@/components/HapticPressable";
import { PlusEditIcon } from "@/components/PlusEditIcon";
import { SettingsIcon } from "@/components/SettingsIcon";
import { StyledText } from "@/components/StyledText";
import { type Folder, useComposer } from "@/contexts/ComposerContext";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { triggerHaptic } from "@/utils/haptics";
import { n } from "@/utils/scaling";

const ITEM_HEIGHT = n(60);

export default function FoldersScreen() {
  const { invertColors } = useInvertColors();
  const { folders, notes, addNote, reorderFolders } = useComposer();
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const sorted = [...folders].sort((a, b) => a.order - b.order);

  // Drag state — kept in refs to avoid stale closures in gesture callbacks
  const liveOrderRef = useRef<string[]>(sorted.map((f) => f.id));
  const draggingIdRef = useRef<string | null>(null);
  const startIndexRef = useRef(0);
  const listTopRef = useRef(0);

  const [displayOrder, setDisplayOrder] = useState<string[]>(
    sorted.map((f) => f.id)
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Keep liveOrderRef in sync when folders change externally (add/delete)
  const folderMap = new Map(folders.map((f) => [f.id, f]));
  const displayFolders = displayOrder
    .map((id) => folderMap.get(id))
    .filter(Boolean) as Folder[];

  const noteCountForFolder = (folderId: string) =>
    notes.filter((n) => n.folderId === folderId).length;

  const createDragGesture = (folder: Folder, index: number) =>
    Gesture.Pan()
      .runOnJS(true)
      .minDistance(4)
      .onStart(() => {
        triggerHaptic();
        draggingIdRef.current = folder.id;
        startIndexRef.current = index;
        liveOrderRef.current = [...displayOrder];
        setDraggingId(folder.id);
      })
      .onUpdate((e) => {
        if (draggingIdRef.current !== folder.id) return;
        const targetIndex = Math.max(
          0,
          Math.min(
            liveOrderRef.current.length - 1,
            Math.round(startIndexRef.current + e.translationY / ITEM_HEIGHT)
          )
        );
        const currentIndex = liveOrderRef.current.indexOf(folder.id);
        if (targetIndex !== currentIndex) {
          const newOrder = [...liveOrderRef.current];
          newOrder.splice(currentIndex, 1);
          newOrder.splice(targetIndex, 0, folder.id);
          liveOrderRef.current = newOrder;
          setDisplayOrder([...newOrder]);
        }
      })
      .onFinalize(() => {
        if (draggingIdRef.current === folder.id) {
          reorderFolders(liveOrderRef.current);
          draggingIdRef.current = null;
          setDraggingId(null);
        }
      });

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: bg }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <StyledText style={[styles.headerTitle, { color: textColor }]}>
          Folders
        </StyledText>
        <HapticPressable onPress={() => router.push("/folder-new")}>
          <MaterialIcons color={textColor} name="add" size={n(36)} />
        </HapticPressable>
      </View>

      {/* Folder list */}
      <View
        style={styles.list}
        onLayout={(e) => {
          e.target.measure((_x, _y, _w, _h, _px, py) => {
            listTopRef.current = py;
          });
        }}
      >
        {displayFolders.map((folder, index) => {
          const isDragging = draggingId === folder.id;
          const count = noteCountForFolder(folder.id);
          const dragGesture = createDragGesture(folder, index);

          return (
            <View
              key={folder.id}
              style={[
                styles.folderRow,
                { height: ITEM_HEIGHT },
                isDragging && styles.folderRowDragging,
              ]}
            >
              <HapticPressable
                onPress={() =>
                  router.push({
                    pathname: "/folder/[id]",
                    params: { id: folder.id },
                  })
                }
                style={styles.folderRowContent}
              >
                <StyledText
                  numberOfLines={1}
                  style={[styles.folderName, { color: textColor }]}
                >
                  {folder.name}
                </StyledText>
                <StyledText style={[styles.folderCount, { color: textColor }]}>
                  {count}
                </StyledText>
              </HapticPressable>

              {/* Drag handle */}
              <GestureDetector gesture={dragGesture}>
                <View style={styles.dragHandle}>
                  <MaterialIcons
                    color={textColor}
                    name="drag-indicator"
                    size={n(28)}
                  />
                </View>
              </GestureDetector>
            </View>
          );
        })}

        {folders.length === 0 && (
          <StyledText style={[styles.emptyText, { color: textColor }]}>
            No folders yet
          </StyledText>
        )}
      </View>

      {/* Bottom toolbar */}
      <View style={[styles.toolbar, { backgroundColor: bg }]}>
        {/* Settings (left) */}
        <HapticPressable onPress={() => router.push("/settings")}>
          <SettingsIcon color={textColor} size={40} />
        </HapticPressable>

        {/* NOTES (center) — returns to notes list */}
        <HapticPressable onPress={() => router.replace("/")}>
          <StyledText style={[styles.toolbarLabel, { color: textColor }]}>
            NOTES
          </StyledText>
        </HapticPressable>

        {/* New note (right) */}
        <HapticPressable
          onPress={() => {
            const id = addNote();
            router.push({ pathname: "/note/[id]", params: { id, autoFocus: "1" } });
          }}
        >
          <PlusEditIcon color={textColor} size={40} />
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
    paddingTop: n(16),
    paddingBottom: n(8),
  },
  headerTitle: {
    fontSize: n(32),
    fontFamily: "PublicSans-Regular",
  },
  list: {
    flex: 1,
  },
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: n(22),
  },
  folderRowDragging: {
    opacity: 0.5,
  },
  folderRowContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: n(12),
    height: "100%",
  },
  folderName: {
    fontSize: n(24),
    flex: 1,
    marginRight: n(12),
  },
  folderCount: {
    fontSize: n(20),
  },
  dragHandle: {
    width: n(52),
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: n(20),
    paddingHorizontal: n(22),
    paddingTop: n(20),
    opacity: 0.5,
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
