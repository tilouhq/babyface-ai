import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { useApp } from "@/src/context/AppContext";
import { colors, spacing } from "@/src/theme";

const MIN_SPLASH_MS = 1600;

export default function Splash() {
  const router = useRouter();
  const { ready, user } = useApp();
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    if (!ready) return;
    const elapsed = Date.now() - mountedAt.current;
    const wait = Math.max(0, MIN_SPLASH_MS - elapsed);
    const t = setTimeout(() => {
      if (user) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    }, wait);
    return () => clearTimeout(t);
  }, [ready, user, router]);

  return (
    <View style={styles.container} testID="splash-screen">
      <Animated.View entering={FadeIn.duration(600)} style={styles.logoWrap}>
        <Image
          source={require("@/assets/images/logo-icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    alignItems: "center",
    gap: spacing.lg,
  },
  logo: {
    width: 180,
    height: 180,
    borderRadius: 40,
  },
});
