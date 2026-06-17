import { setStringAsync } from "expo-clipboard";
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
import { stripMarkdown } from "@/utils/stripMarkdown";


export default function NoteActionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { invertColors } = useInvertColors();
  const { notes, moveNotesToFolder } = useComposer();
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const note = notes.find((n) => n.id === id);

  const handleRename = () => {
    router.push({
      pathname: "/note-rename/[id]",
      params: { id, from: "actions" },
    });
  };

  const handleCopyMarkdown = async () => {
    await setStringAsync(note?.body ?? "");
    router.dismissTo(`/note/${id}?toast=Copied`);
  };

  const handleCopyPlainText = async () => {
    await setStringAsync(stripMarkdown(note?.body ?? ""));
    router.dismissTo(`/note/${id}?toast=Copied`);
  };

  const handleMoveToFolder = () => {
    router.push({
      pathname: "/folder-pick",
      params: { noteIds: id, returnPath: `/note/${id}` },
    });
  };

  const handleRemoveFromFolder = () => {
    moveNotesToFolder([id], null);
    goBack();
  };

  const handleDelete = () => {
    router.push({
      pathname: "/confirm",
      params: {
        message: "Delete this note?",
        confirmText: "Delete",
        action: `delete-note:${id}`,
        returnPath: "/",
      },
    });
  };

  return (
    <SwipeBackContainer onSwipeBack={goBack}>
      <SafeAreaView
        edges={["top"]}
        style={[styles.container, { backgroundColor: bg }]}
      >
        <View style={styles.actions}>
          <ActionRow
            label="Rename"
            onPress={handleRename}
            textColor={textColor}
          />
          <ActionRow
            label="Copy Markdown"
            onPress={handleCopyMarkdown}
            textColor={textColor}
          />
          <ActionRow
            label="Copy Plain Text"
            onPress={handleCopyPlainText}
            textColor={textColor}
          />
          {note?.folderId ? (
            <ActionRow
              label="Remove from Folder"
              onPress={handleRemoveFromFolder}
              textColor={textColor}
            />
          ) : (
            <ActionRow
              label="Move to Folder"
              onPress={handleMoveToFolder}
              textColor={textColor}
            />
          )}
          <ActionRow
            label="Delete"
            onPress={handleDelete}
            textColor={textColor}
          />
        </View>
      </SafeAreaView>
    </SwipeBackContainer>
  );
}

function ActionRow({
  label,
  onPress,
  textColor,
}: {
  label: string;
  onPress: () => void;
  textColor: string;
}) {
  return (
    <HapticPressable onPress={onPress} style={styles.row}>
      <StyledText style={[styles.rowLabel, { color: textColor }]}>
        {label}
      </StyledText>
    </HapticPressable>
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
  },
});
