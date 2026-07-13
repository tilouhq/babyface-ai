import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProvider, ToastHost } from "@/src/context/AppContext";
import { useAppFonts } from "@/src/hooks/use-app-fonts";
import { patchDefaultFont } from "@/src/lib/patch-default-font";

LogBox.ignoreAllLogs(true);

patchDefaultFont();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useAppFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <AppProvider>
            <StatusBar style="dark" backgroundColor="#ffffff" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#ffffff" },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="edit-profile" />
              <Stack.Screen name="generate" />
              <Stack.Screen name="generation/[id]" />
              <Stack.Screen
                name="settings"
                options={{
                  presentation: "modal",
                  animation: "slide_from_bottom",
                }}
              />
            </Stack>
            <ToastHost />
          </AppProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
