import { MaterialIcons } from "@expo/vector-icons";
import { getDocumentAsync } from "expo-document-picker";
import {
  cacheDirectory,
  readAsStringAsync,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import { shareAsync } from "expo-sharing";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticPressable } from "@/components/HapticPressable";
import { StyledText } from "@/components/StyledText";
import { SwipeBackContainer } from "@/components/SwipeBackContainer";
import { Toast } from "@/components/Toast";
import { useComposer } from "@/contexts/ComposerContext";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { goBack } from "@/utils/navigation";
import { n } from "@/utils/scaling";

export default function ExportScreen() {
  const { invertColors } = useInvertColors();
  const { notes, folders, importBackup } = useComposer();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleExportBackup = async () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: "Composer",
      folders: folders.map(({ id, name, order }) => ({ id, name, order })),
      notes: notes.map(
        ({ id, title, body, folderId, createdAt, updatedAt }) => ({
          id,
          title,
          body,
          folderId,
          createdAt: new Date(createdAt).toISOString(),
          updatedAt: new Date(updatedAt).toISOString(),
        })
      ),
    };
    const filename = `composer-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const fileUri = `${cacheDirectory}${filename}`;
    await writeAsStringAsync(fileUri, JSON.stringify(backup, null, 2));
    await shareAsync(fileUri, { mimeType: "application/json" });
  };

  const handleImportBackup = async () => {
    const result = await getDocumentAsync({ type: "application/json" });
    if (result.canceled || !result.assets?.[0]) {
      return;
    }
    try {
      const raw = await readAsStringAsync(result.assets[0].uri);
      const parsed = JSON.parse(raw);
      const { importedNotes } = importBackup(parsed);
      showToast(
        importedNotes > 0
          ? `imported ${importedNotes} notes`
          : "nothing new to import"
      );
    } catch {
      showToast("invalid backup file");
    }
  };

  return (
    <SwipeBackContainer onSwipeBack={goBack}>
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
            Backup & Restore
          </StyledText>
          <View style={styles.headerBtn} />
        </View>

        <HapticPressable onPress={handleExportBackup} style={styles.optionRow}>
          <StyledText style={[styles.optionText, { color: textColor }]}>
            Export Backup
          </StyledText>
        </HapticPressable>

        <HapticPressable onPress={handleImportBackup} style={styles.optionRow}>
          <StyledText style={[styles.optionText, { color: textColor }]}>
            Import Backup
          </StyledText>
        </HapticPressable>
      </SafeAreaView>

      <Toast
        message={toastMessage}
        onHide={() => setToastVisible(false)}
        visible={toastVisible}
      />
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
    paddingTop: n(6),
    paddingRight: n(4),
  },
  headerTitle: {
    fontSize: n(20),
    paddingTop: n(2),
  },
  optionRow: {
    paddingHorizontal: n(22),
    paddingVertical: n(12),
  },
  optionText: {
    fontSize: n(30),
  },
});
