import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticPressable } from "@/components/HapticPressable";
import { StyledText } from "@/components/StyledText";
import { SwipeBackContainer } from "@/components/SwipeBackContainer";
import { useComposer } from "@/contexts/ComposerContext";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { goBack } from "@/utils/navigation";
import { n } from "@/utils/scaling";

export default function FolderActionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { invertColors } = useInvertColors();
  const { folders } = useComposer();
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const folder = folders.find((f) => f.id === id);
  const folderName = folder?.name ?? "Folder";

  return (
    <SwipeBackContainer onSwipeBack={goBack}>
      <SafeAreaView
        edges={["top"]}
        style={[styles.container, { backgroundColor: bg }]}
      >
        <View style={styles.actions}>
          <HapticPressable
            onPress={() =>
              router.push({
                pathname: "/folder-rename/[id]",
                params: { id },
              })
            }
            style={styles.row}
          >
            <StyledText style={[styles.rowLabel, { color: textColor }]}>
              Rename
            </StyledText>
          </HapticPressable>

          <HapticPressable
            onPress={() =>
              router.replace({
                pathname: "/folders",
                params: { startReorder: "true" },
              })
            }
            style={styles.row}
          >
            <StyledText style={[styles.rowLabel, { color: textColor }]}>
              Reorder Folders
            </StyledText>
          </HapticPressable>

          <HapticPressable
            onPress={() =>
              router.push({
                pathname: "/confirm",
                params: {
                  message: `Delete ${folderName}? Notes inside will not be deleted.`,
                  confirmText: "Delete",
                  action: `delete-folder:${id}`,
                  returnPath: "/folders",
                },
              })
            }
            style={styles.row}
          >
            <StyledText style={[styles.rowLabel, { color: textColor }]}>
              Delete
            </StyledText>
          </HapticPressable>
        </View>
      </SafeAreaView>
    </SwipeBackContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  actions: {
    paddingHorizontal: n(22),
    paddingTop: n(20),
  },
  row: {
    paddingVertical: n(14),
  },
  rowLabel: {
    fontSize: n(30),
    fontFamily: "PublicSans-Regular",
  },
});
