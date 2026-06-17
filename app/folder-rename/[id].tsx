import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { KeyboardAvoidingView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticPressable } from "@/components/HapticPressable";
import { StyledText } from "@/components/StyledText";
import { SwipeBackContainer } from "@/components/SwipeBackContainer";
import { useComposer } from "@/contexts/ComposerContext";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { goBack } from "@/utils/navigation";
import { n } from "@/utils/scaling";

export default function FolderRenameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { invertColors } = useInvertColors();
  const { folders, renameFolder } = useComposer();
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const folder = folders.find((f) => f.id === id);
  const [name, setName] = useState(folder?.name ?? "");
  const canSave = name.trim().length > 0;

  const handleSave = useCallback(() => {
    if (!canSave) return;
    renameFolder(id, name.trim());
    router.navigate("/folders");
  }, [canSave, id, name, renameFolder]);

  if (!folder) return null;

  return (
    <SwipeBackContainer onSwipeBack={goBack}>
      <View style={[styles.fill, { backgroundColor: bg }]}>
        <KeyboardAvoidingView behavior="padding" style={styles.fill}>
          <SafeAreaView edges={["top"]} style={styles.fill}>
            {/* Header */}
            <View style={styles.header}>
              <HapticPressable onPress={goBack} style={styles.headerSide}>
                <StyledText style={[styles.headerAction, { color: textColor }]}>
                  Cancel
                </StyledText>
              </HapticPressable>
              <StyledText style={[styles.headerTitle, { color: textColor }]}>
                Rename
              </StyledText>
              <HapticPressable
                onPress={handleSave}
                style={[styles.headerSide, styles.headerRight, !canSave && styles.disabled]}
              >
                <StyledText style={[styles.headerAction, { color: textColor }]}>
                  Save
                </StyledText>
              </HapticPressable>
            </View>

            <View style={styles.inputArea}>
              <TextInput
                allowFontScaling={false}
                autoFocus
                cursorColor={textColor}
                onChangeText={setName}
                onSubmitEditing={handleSave}
                returnKeyType="done"
                selectionColor={textColor}
                style={[styles.input, { color: textColor }]}
                value={name}
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </SwipeBackContainer>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: n(22),
    paddingTop: n(8),
    paddingBottom: n(8),
  },
  headerTitle: {
    fontSize: n(22),
    fontFamily: "PublicSans-Regular",
  },
  headerAction: {
    fontSize: n(20),
    fontFamily: "PublicSans-Regular",
  },
  headerSide: { minWidth: n(60) },
  headerRight: { alignItems: "flex-end" },
  disabled: { opacity: 0.3 },
  inputArea: {
    paddingHorizontal: n(22),
    paddingTop: n(24),
  },
  input: {
    fontSize: n(30),
    fontFamily: "PublicSans-Regular",
    paddingBottom: n(8),
  },
});
