import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
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
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="baby-face" size={72} color={colors.brand} />
        </View>
        <Text style={styles.logoText}>babyface ai</Text>
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
  iconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -0.5,
  },
});
