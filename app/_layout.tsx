import { Stack } from "expo-router";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ComposerProvider, useComposer } from "@/contexts/ComposerContext";
import {
  InvertColorsProvider,
  useInvertColors,
} from "@/contexts/InvertColorsContext";

preventAutoHideAsync();

function RootLayout() {
  const { invertColors } = useInvertColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "none",
        contentStyle: {
          backgroundColor: invertColors ? "white" : "black",
        },
      }}
    />
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <InvertColorsProvider>
        <ComposerProvider>
          <AppWithData />
        </ComposerProvider>
      </InvertColorsProvider>
    </GestureHandlerRootView>
  );
}
