import { Stack } from "expo-router";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { Animated, StatusBar, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { MILKDOWN_EDITOR_HTML } from "@/assets/milkdown-editor";
import { ComposerProvider, useComposer } from "@/contexts/ComposerContext";
import { EditorProvider, useEditor } from "@/contexts/EditorContext";
import {
  InvertColorsProvider,
  useInvertColors,
} from "@/contexts/InvertColorsContext";
import { scrollIndicatorBaseStyles } from "@/hooks/useScrollIndicator";
import { n } from "@/utils/scaling";

preventAutoHideAsync();

// Height of the note editor header: paddingTop(5) + headerBtn(32) + paddingBottom(20)
const HEADER_HEIGHT = n(57);

function RootLayout() {
  const { invertColors } = useInvertColors();
  const {
    webViewRef,
    activeNote,
    handleMessage,
    keyboardVisible,
    scrollIndicatorHeight,
    scrollIndicatorPosition,
  } = useEditor();
  const insets = useSafeAreaInsets();

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

  // Sync theme changes into the live editor
  useEffect(() => {
    webViewRef.current?.injectJavaScript(
      `window.composerBridge?.setTheme(${JSON.stringify(bg)}, ${JSON.stringify(textColor)}); true;`
    );
  }, [bg, textColor, webViewRef]);

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {/* Pre-warmed WebView — always mounted, positioned behind the Stack */}
      <View
        pointerEvents="box-none"
        style={[StyleSheet.absoluteFillObject, { top: bodyTop }]}
      >
        <WebView
          backgroundColor={bg}
          onMessage={handleMessage}
          originWhitelist={["*"]}
          overScrollMode="never"
          pointerEvents={activeNote ? "auto" : "none"}
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

      {/* Stack renders on top of the WebView; note screen body is transparent */}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
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
});
