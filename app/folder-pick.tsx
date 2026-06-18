import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticPressable } from "@/components/HapticPressable";
import { StyledText } from "@/components/StyledText";
import { useComposer } from "@/contexts/ComposerContext";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { goBack } from "@/utils/navigation";
import { n } from "@/utils/scaling";

export default function FolderPickScreen() {
  const { noteIds, returnPath } = useLocalSearchParams<{
    noteIds: string;
    returnPath?: string;
  }>();
  const { invertColors } = useInvertColors();
  const { folders, moveNotesToFolder } = useComposer();
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const ids = noteIds ? noteIds.split(",").filter(Boolean) : [];
  const sorted = [...folders].sort((a, b) => a.order - b.order);

  const handlePick = (folderId: string) => {
    moveNotesToFolder(ids, folderId);
    if (returnPath) {
      router.replace(returnPath as never);
    } else {
      goBack();
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: bg }]}
    >
      <View style={styles.header}>
        <HapticPressable onPress={goBack}>
          <View style={styles.headerBtn}>
            <MaterialIcons
              color={textColor}
              name="arrow-back-ios"
              size={n(28)}
            />
          </View>
        </HapticPressable>
        <StyledText style={[styles.headerTitle, { color: textColor }]}>
          Move to Folder
        </StyledText>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.actions}>
        {sorted.map((folder) => (
          <HapticPressable
            key={folder.id}
            onPress={() => handlePick(folder.id)}
            style={styles.row}
          >
            <StyledText style={[styles.rowLabel, { color: textColor }]}>
              {folder.name}
            </StyledText>
          </HapticPressable>
        ))}

        {sorted.length === 0 && (
          <StyledText style={[styles.emptyText, { color: textColor }]}>
            No folders yet
          </StyledText>
        )}
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
  emptyText: {
    fontSize: n(20),
    paddingTop: n(20),
    opacity: 0.5,
  },
});
