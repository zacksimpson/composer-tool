import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticPressable } from "@/components/HapticPressable";
import { StyledText } from "@/components/StyledText";
import { SwipeBackContainer } from "@/components/SwipeBackContainer";
import { ToggleSwitch } from "@/components/ToggleSwitch";
import { useComposer } from "@/contexts/ComposerContext";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { goBack } from "@/utils/navigation";
import { n } from "@/utils/scaling";

const NEW_NOTE_FORMAT_LABELS: Record<string, string> = {
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  body: "Body",
};

const SORT_ORDER_LABELS: Record<string, string> = {
  edited: "Date Edited",
  created: "Date Created",
};

export default function SettingsScreen() {
  const { invertColors, setInvertColors } = useInvertColors();
  const { settings } = useComposer();
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  return (
    <SwipeBackContainer onSwipeBack={goBack}>
      <SafeAreaView
        edges={["top"]}
        style={[styles.container, { backgroundColor: bg }]}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: bg }]}>
          <HapticPressable onPress={goBack}>
            <View style={styles.headerBtn}>
              <MaterialIcons
                color={textColor}
                name="arrow-back-ios"
                size={n(28)}
              />
            </View>
          </HapticPressable>
          <StyledText style={styles.headerTitle}>Settings</StyledText>
          <View style={styles.headerBtn} />
        </View>

        {/* Settings */}
        <View style={styles.content}>
          {/* New Note Format */}
          <HapticPressable
            onPress={() => router.push("/settings/new-note-format")}
            style={styles.row}
          >
            <StyledText style={[styles.rowLabel, { color: textColor }]}>
              New Note Format
            </StyledText>
            <StyledText style={[styles.rowValue, { color: textColor }]}>
              {NEW_NOTE_FORMAT_LABELS[settings.newNoteFormat] ?? "Body"}
            </StyledText>
          </HapticPressable>

          {/* Sort Notes By */}
          <HapticPressable
            onPress={() => router.push("/settings/sort-order")}
            style={styles.row}
          >
            <StyledText style={[styles.rowLabel, { color: textColor }]}>
              Sort Notes By
            </StyledText>
            <StyledText style={[styles.rowValue, { color: textColor }]}>
              {SORT_ORDER_LABELS[settings.sortOrder] ?? "Date Edited"}
            </StyledText>
          </HapticPressable>

          <ToggleSwitch
            label="Inverted Colors"
            onValueChange={setInvertColors}
            value={invertColors}
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
    paddingTop: n(6),
    paddingRight: n(4),
  },
  headerTitle: {
    fontSize: n(20),
    paddingTop: n(2),
  },
  content: {
    paddingHorizontal: n(22),
    paddingTop: n(16),
  },
  row: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingVertical: n(16),
  },
  rowLabel: {
    fontSize: n(20),
    paddingTop: n(7.5),
    lineHeight: n(20),
  },
  rowValue: {
    fontSize: n(30),
    paddingBottom: n(10),
  },
});
