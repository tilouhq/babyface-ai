import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LiquidGlassButton } from "@/src/components/LiquidGlassButton";
import { colors, spacing } from "@/src/theme";

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
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <Animated.View entering={FadeInUp.duration(500)} style={styles.logoWrap}>
        <Image
          testID="login-logo-image"
          source={require("@/assets/images/logo-wordmark.png")}
          style={styles.wordmark}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Découvrez à quoi ressemblera votre futur bébé</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.buttons}>
        <LiquidGlassButton
          testID="login-google-button"
          variant="light"
          onPress={() => handleLogin("google")}
          disabled={loadingProvider !== null}
          fullWidth
          height={58}
        >
          {loadingProvider === "google" ? (
            <ActivityIndicator color={colors.onSurface} />
          ) : (
            <>
              <Ionicons name="logo-google" size={22} color={colors.onSurface} />
              <Text style={styles.googleText}>Continuer avec Google</Text>
            </>
          )}
        </LiquidGlassButton>

        <LiquidGlassButton
          testID="login-apple-button"
          variant="dark"
          onPress={() => handleLogin("apple")}
          disabled={loadingProvider !== null}
          fullWidth
          height={58}
        >
          {loadingProvider === "apple" ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <>
              <Ionicons name="logo-apple" size={24} color={colors.surface} />
              <Text style={styles.appleText}>Continuer avec Apple</Text>
            </>
          )}
        </LiquidGlassButton>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>En continuant, tu acceptes nos conditions d’utilisation</Text>
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
  wordmark: {
    width: 260,
    height: 60,
  },
  tagline: {
    fontSize: 17,
    color: colors.onSurfaceTertiary,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  buttons: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.lg,
  },
  googleText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.onSurface,
  },
  appleText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.surface,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
  },
});
