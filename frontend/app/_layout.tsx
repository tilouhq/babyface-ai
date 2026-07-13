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

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true);

// Applies Instrument Serif to <Text> and <TextInput> globally as soon as this
// module is evaluated (font file is loaded a moment later by useAppFonts).
patchDefaultFont();

// Keep the native splash visible from cold start until fonts register.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useAppFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Fall through on error rather than wedging the app.
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
            />
            <ToastHost />
          </AppProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
