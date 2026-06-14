import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticPressable } from "@/components/HapticPressable";
import { StyledText } from "@/components/StyledText";
import { SwipeBackContainer } from "@/components/SwipeBackContainer";
import { useComposer } from "@/contexts/ComposerContext";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { goBack } from "@/utils/navigation";
import { n } from "@/utils/scaling";

export default function NoteRenameScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { invertColors } = useInvertColors();
  const { notes, renameNote } = useComposer();
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const note = notes.find((n) => n.id === id);
  const [title, setTitle] = useState(note?.title ?? "");

  const canSave = title.trim().length > 0;

  const handleSave = useCallback(() => {
    if (!canSave) {
      return;
    }
    renameNote(id, title.trim());
    if (from === "actions") {
      router.dismiss(2);
    } else {
      router.back();
    }
  }, [canSave, id, title, from, renameNote]);

  return (
    <SwipeBackContainer onSwipeBack={goBack}>
      <SafeAreaView
        edges={["top"]}
        style={[styles.container, { backgroundColor: bg }]}
      >
        {/* Header */}
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
            Edit Note Title
          </StyledText>
          <HapticPressable disabled={!canSave} onPress={handleSave}>
            <View style={styles.headerBtn}>
              <MaterialIcons
                color={textColor}
                name="check"
                size={n(28)}
                style={{ opacity: canSave ? 1 : 0.3 }}
              />
            </View>
          </HapticPressable>
        </View>

        {/* Input */}
        <View style={styles.inputArea}>
          <TextInput
            allowFontScaling={false}
            autoFocus
            cursorColor={textColor}
            onChangeText={setTitle}
            onSubmitEditing={handleSave}
            paddingLeft={0}
            returnKeyType="done"
            selectionColor={textColor}
            style={[
              styles.input,
              { color: textColor, borderBottomColor: textColor },
            ]}
            value={title}
          />
        </View>
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
  headerBtn: {
    width: n(32),
    height: n(32),
    alignItems: "center",
    justifyContent: "center",
    paddingTop: n(2),
  },
  headerTitle: {
    fontSize: n(20),
  },
  inputArea: {
    paddingHorizontal: n(26),
    paddingTop: n(24),
  },
  input: {
    fontFamily: "PublicSans-Regular",
    fontSize: n(30),
    paddingBottom: n(8),
    borderBottomWidth: n(1),
  },
});
