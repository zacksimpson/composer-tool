import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticPressable } from "@/components/HapticPressable";
import { StyledText } from "@/components/StyledText";
import { SwipeBackContainer } from "@/components/SwipeBackContainer";
import { type NoteSortOrder, useComposer } from "@/contexts/ComposerContext";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { goBack } from "@/utils/navigation";
import { n } from "@/utils/scaling";

const OPTIONS: { label: string; value: NoteSortOrder }[] = [
  { label: "Date Edited", value: "edited" },
  { label: "Date Created", value: "created" },
];

export default function SortOrderScreen() {
  const { invertColors } = useInvertColors();
  const { settings, updateSettings } = useComposer();
  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";

  const handleSelect = (value: NoteSortOrder) => {
    updateSettings({ sortOrder: value });
    router.back();
  };

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
            Sort Notes By
          </StyledText>
          <View style={styles.headerBtn} />
        </View>

        {OPTIONS.map((option) => {
          const isSelected = settings.sortOrder === option.value;
          return (
            <HapticPressable
              key={option.value}
              onPress={() => handleSelect(option.value)}
              style={styles.optionRow}
            >
              <StyledText
                style={[
                  styles.optionText,
                  { color: textColor },
                  isSelected && styles.optionSelected,
                ]}
              >
                {option.label}
              </StyledText>
            </HapticPressable>
          );
        })}
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
  optionRow: {
    paddingHorizontal: n(22),
    paddingVertical: n(12),
  },
  optionText: {
    fontSize: n(30),
  },
  optionSelected: {
    textDecorationLine: "underline",
  },
});
