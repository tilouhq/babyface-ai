import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/src/context/AppContext";
import { colors, radius, shadow, spacing } from "@/src/theme";

type Step = "name" | "age" | "source" | "loading" | "done";

const SOURCES = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "x", label: "X" },
  { key: "ami", label: "Un ami" },
  { key: "autre", label: "Autre" },
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createUser, showToast } = useApp();

  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [source, setSource] = useState<string | null>(null);
  const [otherSource, setOtherSource] = useState("");
  const [error, setError] = useState<string | null>(null);

  const goNext = () => {
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === "name") {
      if (name.trim().length < 2) {
        setError("Entre ton nom (au moins 2 caractères)");
        return;
      }
      setStep("age");
    } else if (step === "age") {
      const a = parseInt(age, 10);
      if (!a || a < 13 || a > 100) {
        setError("Entre un âge valide (13 à 100 ans)");
        return;
      }
      setStep("source");
    } else if (step === "source") {
      if (!source) {
        setError("Choisis une option");
        return;
      }
      if (source === "autre" && otherSource.trim().length < 2) {
        setError("Précise comment tu nous as connus");
        return;
      }
      setStep("loading");
    }
  };

  useEffect(() => {
    if (step !== "loading") return;
    const finalSource = source === "autre" ? otherSource.trim() : source!;
    const start = Date.now();
    (async () => {
      try {
        await createUser(name.trim(), parseInt(age, 10), finalSource);
        const wait = Math.max(0, 1400 - (Date.now() - start));
        setTimeout(() => setStep("done"), wait);
      } catch {
        showToast("Une erreur est survenue, réessaie");
        setStep("source");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const stepIndex = step === "name" ? 0 : step === "age" ? 1 : 2;

  if (step === "loading") {
    return (
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.container, styles.loadingContainer, { paddingBottom: insets.bottom + spacing.xxxl }]}
        testID="onboarding-loading-screen"
      >
        <View style={styles.loadingSpacer} />
        <ActivityIndicator size="small" color={colors.brand} />
      </Animated.View>
    );
  }

  if (step === "done") {
    return (
      <Animated.View
        entering={FadeIn.duration(450)}
        style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}
        testID="onboarding-done-screen"
      >
        <View style={styles.doneCenter}>
          <Text style={styles.doneTitle}>Tout est configuré</Text>
          <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.checkCircle}>
            <Ionicons name="checkmark" size={48} color={colors.surface} />
          </Animated.View>
        </View>
        <Pressable
          testID="onboarding-continue-button"
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace("/(tabs)");
          }}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>Continuer</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.progressRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]}
          />
        ))}
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={120}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === "name" && (
          <Animated.View key="name" entering={FadeIn.duration(350)} exiting={FadeOut.duration(150)}>
            <Text style={styles.title}>Comment t'appelles-tu ?</Text>
            <Text style={styles.subtitle}>On utilisera ton nom dans ton profil</Text>
            <TextInput
              testID="onboarding-name-input"
              style={styles.input}
              placeholder="Ton nom"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={goNext}
            />
          </Animated.View>
        )}

        {step === "age" && (
          <Animated.View key="age" entering={FadeIn.duration(350)} exiting={FadeOut.duration(150)}>
            <Text style={styles.title}>Quel âge as-tu ?</Text>
            <Text style={styles.subtitle}>Ton âge reste privé</Text>
            <TextInput
              testID="onboarding-age-input"
              style={styles.input}
              placeholder="Ton âge"
              placeholderTextColor={colors.muted}
              value={age}
              onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              maxLength={3}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={goNext}
            />
          </Animated.View>
        )}

        {step === "source" && (
          <Animated.View key="source" entering={FadeIn.duration(350)} exiting={FadeOut.duration(150)}>
            <Text style={styles.title}>Comment as-tu connu babyface ai ?</Text>
            <Text style={styles.subtitle}>Ça nous aide à grandir</Text>
            <View style={styles.sourceList}>
              {SOURCES.map((s) => {
                const selected = source === s.key;
                return (
                  <Pressable
                    key={s.key}
                    testID={`onboarding-source-${s.key}`}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSource(s.key);
                      setError(null);
                    }}
                    style={[styles.sourceChip, selected && styles.sourceChipSelected]}
                  >
                    <Text style={[styles.sourceChipText, selected && styles.sourceChipTextSelected]}>
                      {s.label}
                    </Text>
                    {selected && <Ionicons name="checkmark-circle" size={20} color={colors.brand} />}
                  </Pressable>
                );
              })}
            </View>
            {source === "autre" && (
              <Animated.View entering={FadeIn.duration(250)}>
                <TextInput
                  testID="onboarding-other-source-input"
                  style={[styles.input, styles.otherInput]}
                  placeholder="Précise..."
                  placeholderTextColor={colors.muted}
                  value={otherSource}
                  onChangeText={setOtherSource}
                  autoFocus
                />
              </Animated.View>
            )}
          </Animated.View>
        )}

        {error && (
          <Text style={styles.errorText} testID="onboarding-error-text">
            {error}
          </Text>
        )}
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: spacing.lg }}>
        <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Pressable
            testID="onboarding-next-button"
            onPress={goNext}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>Continuer</Text>
          </Pressable>
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  progressDot: {
    width: 28,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
  },
  progressDotActive: {
    backgroundColor: colors.brand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.onSurfaceTertiary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  input: {
    height: 60,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.lg,
    fontSize: 18,
    fontWeight: "600",
    color: colors.onSurface,
  },
  otherInput: {
    marginTop: spacing.lg,
  },
  sourceList: {
    gap: spacing.md,
  },
  sourceChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  sourceChipSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  sourceChipText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  sourceChipTextSelected: {
    color: colors.brand,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: "600",
    marginTop: spacing.md,
  },
  ctaWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
  },
  primaryButton: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.xl,
    ...shadow.soft,
  },
  primaryButtonText: {
    color: colors.onBrand,
    fontSize: 17,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  loadingContainer: {
    justifyContent: "flex-end",
    alignItems: "center",
  },
  loadingSpacer: {
    flex: 1,
  },
  doneCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
  },
  doneTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
});
