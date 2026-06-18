import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticPressable } from "@/components/HapticPressable";
import { StyledText } from "@/components/StyledText";
import { SwipeBackContainer } from "@/components/SwipeBackContainer";
import { useComposer } from "@/contexts/ComposerContext";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { goBack } from "@/utils/navigation";
import { n } from "@/utils/scaling";
import { sharedStyles } from "@/utils/sharedStyles";

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
    if (!canSave) {
      return;
    }
    renameFolder(id, name.trim());
    Keyboard.dismiss();
    router.dismissTo("/folders");
  }, [canSave, id, name, renameFolder]);

  if (!folder) {
    return null;
  }

  return (
    <SwipeBackContainer onSwipeBack={goBack}>
      <View style={[styles.fill, { backgroundColor: bg }]}>
        <KeyboardAvoidingView behavior="padding" style={styles.fill}>
          <SafeAreaView edges={["top"]} style={styles.fill}>
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
              <StyledText style={[styles.headerTitle, { color: textColor }]}>
                Rename
              </StyledText>
              {canSave ? (
                <HapticPressable onPress={handleSave}>
                  <View style={sharedStyles.headerBtn}>
                    <MaterialIcons
                      color={textColor}
                      name="check"
                      size={n(28)}
                    />
                  </View>
                </HapticPressable>
              ) : (
                <View style={sharedStyles.headerBtn} />
              )}
            </View>

            <View style={styles.inputArea}>
              <TextInput
                allowFontScaling={false}
                autoFocus
                cursorColor={textColor}
                onChangeText={setName}
                onSubmitEditing={handleSave}
                paddingLeft={0}
                returnKeyType="done"
                selectionColor={textColor}
                style={[
                  styles.input,
                  { color: textColor, borderBottomColor: textColor },
                ]}
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
    paddingVertical: n(5),
  },
  headerTitle: {
    fontSize: n(20),
    paddingTop: n(2),
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
