import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, shadow, spacing } from "@/src/theme";

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | null>(null);

  const handleLogin = (provider: "google" | "apple") => {
    // Connexion simulée pour le MVP — remplacer par une vraie auth sociale plus tard.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingProvider(provider);
    setTimeout(() => {
      setLoadingProvider(null);
      router.push("/onboarding");
    }, 500);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom + spacing.xl }]}>
      <Animated.View entering={FadeInUp.duration(500)} style={styles.logoWrap}>
        <Text style={styles.logoText} testID="login-logo-text">
          babyface ai
        </Text>
        <Text style={styles.tagline}>Découvrez à quoi ressemblera votre futur bébé</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.buttons}>
        <Pressable
          testID="login-google-button"
          onPress={() => handleLogin("google")}
          disabled={loadingProvider !== null}
          style={({ pressed }) => [styles.button, styles.googleButton, pressed && styles.pressed]}
        >
          {loadingProvider === "google" ? (
            <ActivityIndicator color={colors.onSurface} />
          ) : (
            <>
              <Ionicons name="logo-google" size={22} color={colors.onSurface} />
              <Text style={styles.googleText}>Continuer avec Google</Text>
            </>
          )}
        </Pressable>

        <Pressable
          testID="login-apple-button"
          onPress={() => handleLogin("apple")}
          disabled={loadingProvider !== null}
          style={({ pressed }) => [styles.button, styles.appleButton, pressed && styles.pressed]}
        >
          {loadingProvider === "apple" ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <>
              <Ionicons name="logo-apple" size={24} color={colors.surface} />
              <Text style={styles.appleText}>Continuer avec Apple</Text>
            </>
          )}
        </Pressable>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>En continuant, tu acceptes nos conditions d'utilisation</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
  },
  logoWrap: {
    alignItems: "center",
    marginTop: spacing.xxxl,
    gap: spacing.md,
  },
  logoText: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    color: colors.onSurfaceTertiary,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 22,
  },
  buttons: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.lg,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    height: 56,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  googleButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  appleButton: {
    backgroundColor: "#0f172a",
  },
  googleText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.onSurface,
  },
  appleText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
  },
});
