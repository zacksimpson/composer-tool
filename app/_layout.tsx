import { MaterialIcons } from "@expo/vector-icons";
import { router, Stack, usePathname } from "expo-router";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { useEffect, useMemo, useRef } from "react";
import { Animated, StatusBar, StyleSheet, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { MILKDOWN_EDITOR_HTML } from "@/assets/milkdown-editor";
import { HapticPressable } from "@/components/HapticPressable";
import { StyledText } from "@/components/StyledText";
import { ComposerProvider, useComposer } from "@/contexts/ComposerContext";
import { EditorProvider, useEditor } from "@/contexts/EditorContext";
import {
  InvertColorsProvider,
  useInvertColors,
} from "@/contexts/InvertColorsContext";
import { scrollIndicatorBaseStyles } from "@/hooks/useScrollIndicator";
import { triggerHaptic } from "@/utils/haptics";
import { goBack } from "@/utils/navigation";
import { n } from "@/utils/scaling";
import { getDisplayTitle } from "@/utils/stripMarkdown";

preventAutoHideAsync();

// Height of the note editor header: paddingTop(5) + headerBtn(32) + paddingBottom(20)
const HEADER_HEIGHT = n(57);

function RootLayout() {
  const { invertColors } = useInvertColors();
  const {
    webViewRef,
    handleMessage,
    activeNote,
    body,
    keyboardVisible,
    scrollIndicatorHeight,
    scrollIndicatorPosition,
    dismissKeyboard,
  } = useEditor();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isNoteScreen = pathname.startsWith("/note/");

  const bg = invertColors ? "white" : "black";
  const textColor = invertColors ? "black" : "white";
  const bodyTop = insets.top + HEADER_HEIGHT;

  // Stamp theme colors once at mount time; subsequent theme changes go through setTheme
  const editorHtml = useRef(
    MILKDOWN_EDITOR_HTML.replaceAll("COMPOSER_BG", bg).replaceAll(
      "COMPOSER_TEXT",
      textColor
    )
  ).current;

  // Swipe-back gesture for the note screen — lives here (above the WebView in z-order)
  // because the WebView intercepts all touches inside the Stack, making SwipeBackContainer
  // in note/[id].tsx unreachable.
  const swipeTriggeredRef = useRef(false);
  const swipeBackGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isNoteScreen)
        .activeOffsetX(12)
        .onBegin(() => {
          swipeTriggeredRef.current = false;
        })
        .onUpdate((event) => {
          if (swipeTriggeredRef.current) {
            return;
          }
          const absX = Math.abs(event.translationX);
          const absY = Math.abs(event.translationY);
          if (absY > absX * 1.5) {
            return;
          }
          if (event.translationX > 80) {
            swipeTriggeredRef.current = true;
            triggerHaptic();
            dismissKeyboard();
            goBack();
          }
        })
        .onFinalize(() => {
          swipeTriggeredRef.current = false;
        })
        .runOnJS(true),
    [isNoteScreen, dismissKeyboard]
  );

  // Sync theme changes into the live editor
  useEffect(() => {
    webViewRef.current?.injectJavaScript(
      `window.composerBridge?.setTheme(${JSON.stringify(bg)}, ${JSON.stringify(textColor)}); true;`
    );
  }, [bg, textColor, webViewRef]);

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {/* Stack renders first (behind the WebView in z-order) */}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />

      {/* Pre-warmed WebView — always mounted, rendered above the Stack so touches
          reach it directly. Hidden and non-interactive on all non-editor screens. */}
      <View
        pointerEvents={isNoteScreen ? "auto" : "none"}
        style={[
          StyleSheet.absoluteFillObject,
          { top: bodyTop, opacity: isNoteScreen ? 1 : 0 },
        ]}
      >
        <WebView
          backgroundColor={bg}
          onMessage={handleMessage}
          originWhitelist={["*"]}
          overScrollMode="never"
          ref={webViewRef}
          scrollEnabled
          showsVerticalScrollIndicator={false}
          source={{ html: editorHtml }}
          style={[StyleSheet.absoluteFillObject, { backgroundColor: bg }]}
          textZoom={100}
        />
        {scrollIndicatorHeight > 0 && !keyboardVisible && (
          <View
            pointerEvents="none"
            style={[
              scrollIndicatorBaseStyles.track,
              { backgroundColor: textColor },
            ]}
          >
            <Animated.View
              style={[
                scrollIndicatorBaseStyles.thumb,
                {
                  backgroundColor: textColor,
                  height: scrollIndicatorHeight,
                  transform: [{ translateY: scrollIndicatorPosition }],
                },
              ]}
            />
          </View>
        )}
      </View>

      {/* Left-edge swipe-back strip — rendered above the WebView so RNGH can intercept
          before the WebView consumes the touch. Only active on the note screen. */}
      <GestureDetector gesture={swipeBackGesture}>
        <View
          pointerEvents={isNoteScreen ? "auto" : "none"}
          style={[StyleSheet.absoluteFillObject, { width: n(30) }]}
        />
      </GestureDetector>

      {/* Note editor header — lives here (not in note/[id].tsx) so it disappears in the
          same render pass as the WebView when navigating away, eliminating the JS-timing
          flicker that plagued the useIsFocused approach in release builds. */}
      {isNoteScreen && (
        <View
          style={[styles.noteHeader, { top: insets.top, backgroundColor: bg }]}
        >
          <HapticPressable
            onPress={() => {
              dismissKeyboard();
              goBack();
            }}
          >
            <View style={styles.headerBtn}>
              <MaterialIcons
                color={textColor}
                name="arrow-back-ios"
                size={n(28)}
              />
            </View>
          </HapticPressable>

          <HapticPressable
            onPress={() =>
              activeNote &&
              router.push({
                pathname: "/note-rename/[id]",
                params: { id: activeNote.id },
              })
            }
            style={styles.titlePressable}
          >
            <StyledText numberOfLines={1} style={styles.titleText}>
              {activeNote ? getDisplayTitle(activeNote.title, body) : ""}
            </StyledText>
          </HapticPressable>

          {keyboardVisible ? (
            <HapticPressable onPress={dismissKeyboard}>
              <View style={styles.headerBtn}>
                <MaterialIcons
                  color={textColor}
                  name="keyboard-arrow-down"
                  size={n(28)}
                />
              </View>
            </HapticPressable>
          ) : (
            <HapticPressable
              onPress={() =>
                activeNote &&
                router.push({
                  pathname: "/note-actions/[id]",
                  params: { id: activeNote.id },
                })
              }
            >
              <View style={styles.headerBtn}>
                <MaterialIcons color={textColor} name="menu" size={n(28)} />
              </View>
            </HapticPressable>
          )}
        </View>
      )}
    </View>
  );
}

function AppWithData() {
  const { loaded } = useComposer();

  useEffect(() => {
    if (loaded) {
      hideAsync();
    }
  }, [loaded]);

  return (
    <>
      <StatusBar hidden />
      <RootLayout />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <InvertColorsProvider>
        <ComposerProvider>
          <EditorProvider>
            <AppWithData />
          </EditorProvider>
        </ComposerProvider>
      </InvertColorsProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  noteHeader: {
    position: "absolute",
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: n(22),
    paddingTop: n(5),
    paddingBottom: n(20),
  },
  headerBtn: {
    width: n(32),
    height: n(32),
    alignItems: "center",
    paddingTop: n(6),
    paddingRight: n(4),
  },
  titlePressable: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: n(28),
  },
  titleText: {
    fontSize: n(20),
    paddingTop: n(2),
  },
});
