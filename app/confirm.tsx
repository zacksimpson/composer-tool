import { MaterialIcons } from "@expo/vector-icons";
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
import { sharedStyles } from "@/utils/sharedStyles";

export default function ConfirmScreen() {
  const { invertColors } = useInvertColors();
  const { deleteNote, deleteNotes, deleteFolder } = useComposer();
  const params = useLocalSearchParams<{
    title: string;
    message: string;
    confirmText: string;
    action: string;
    returnPath: string;
  }>();

  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const handleConfirm = () => {
    // Execute the action before navigating
    if (params.action?.startsWith("delete-notes:")) {
      const ids = params.action.replace("delete-notes:", "").split(",");
      deleteNotes(ids);
    } else if (params.action?.startsWith("delete-note:")) {
      const noteId = params.action.replace("delete-note:", "");
      deleteNote(noteId);
    } else if (params.action?.startsWith("delete-folder:")) {
      const folderId = params.action.replace("delete-folder:", "");
      deleteFolder(folderId);
    }

    const path = params.returnPath || "/";
    router.dismissTo(`${path}?toast=deleted`);
  };

  return (
    <SwipeBackContainer enabled onSwipeBack={goBack}>
      <SafeAreaView
        edges={["top"]}
        style={[styles.container, { backgroundColor: bg }]}
      >
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
            {params.title}
          </StyledText>
          <View style={sharedStyles.headerBtn} />
        </View>

        <View style={styles.messageContainer}>
          <StyledText style={[styles.messageText, { color: textColor }]}>
            {params.message}
          </StyledText>
        </View>

        <HapticPressable onPress={handleConfirm} style={styles.confirmBtn}>
          <StyledText style={[styles.confirmText, { color: textColor }]}>
            {(params.confirmText || "Confirm").toUpperCase()}
          </StyledText>
        </HapticPressable>
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
    flex: 1,
    fontSize: n(20),
    paddingTop: n(2),
    textAlign: "center",
    paddingHorizontal: n(8),
  },
  messageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: n(40),
    paddingHorizontal: n(40),
  },
  messageText: {
    fontSize: n(22),
    textAlign: "center",
    lineHeight: n(32),
  },
  confirmBtn: {
    alignItems: "center",
    paddingBottom: n(28),
  },
  confirmText: {
    fontSize: n(24),
    letterSpacing: n(5),
  },
});
