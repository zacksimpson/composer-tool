import { router } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticPressable } from "@/components/HapticPressable";
import { StyledText } from "@/components/StyledText";
import { useComposer } from "@/contexts/ComposerContext";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { goBack } from "@/utils/navigation";
import { n } from "@/utils/scaling";

export default function FolderNewScreen() {
  const { invertColors } = useInvertColors();
  const { addFolder } = useComposer();
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const [name, setName] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addFolder(trimmed);
    goBack();
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: bg }]}
    >
      <View style={styles.header}>
        <HapticPressable onPress={goBack} style={styles.cancelBtn}>
          <StyledText style={[styles.headerAction, { color: textColor }]}>
            Cancel
          </StyledText>
        </HapticPressable>
        <StyledText style={[styles.headerTitle, { color: textColor }]}>
          New Folder
        </StyledText>
        <HapticPressable
          onPress={handleSave}
          style={[styles.saveBtn, !name.trim() && styles.disabled]}
        >
          <StyledText style={[styles.headerAction, { color: textColor }]}>
            Save
          </StyledText>
        </HapticPressable>
      </View>

      <TextInput
        ref={inputRef}
        allowFontScaling={false}
        autoFocus
        cursorColor={textColor}
        onChangeText={setName}
        onSubmitEditing={handleSave}
        placeholderTextColor={textColor}
        returnKeyType="done"
        selectionColor={textColor}
        style={[styles.input, { color: textColor }]}
        value={name}
      />
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
    paddingBottom: n(16),
  },
  headerTitle: {
    fontSize: n(22),
    fontFamily: "PublicSans-Regular",
  },
  headerAction: {
    fontSize: n(20),
    fontFamily: "PublicSans-Regular",
  },
  cancelBtn: {
    minWidth: n(60),
  },
  saveBtn: {
    minWidth: n(60),
    alignItems: "flex-end",
  },
  disabled: {
    opacity: 0.3,
  },
  input: {
    fontFamily: "PublicSans-Regular",
    fontSize: n(28),
    paddingHorizontal: n(22),
    paddingTop: n(8),
    paddingLeft: 0,
    marginLeft: n(22),
  },
});
