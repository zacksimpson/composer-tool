import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticPressable } from "@/components/HapticPressable";
import { StyledText } from "@/components/StyledText";
import { SwipeBackContainer } from "@/components/SwipeBackContainer";
import { ToggleSwitch } from "@/components/ToggleSwitch";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { goBack } from "@/utils/navigation";
import { n } from "@/utils/scaling";

export default function SettingsScreen() {
  const { invertColors, setInvertColors } = useInvertColors();
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
});
