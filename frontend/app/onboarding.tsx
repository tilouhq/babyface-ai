import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon3D } from "@/src/components/Icon3D";
import { LiquidGlassButton } from "@/src/components/LiquidGlassButton";
import { useApp } from "@/src/context/AppContext";
import { colors, radius, spacing } from "@/src/theme";

type Step = "name" | "age" | "source" | "loading" | "done";

const SOURCES = [
  { key: "tiktok", labelKey: "onb_source_tiktok" },
  { key: "instagram", labelKey: "onb_source_instagram" },
  { key: "x", labelKey: "onb_source_x" },
  { key: "ami", labelKey: "onb_source_ami" },
  { key: "autre", labelKey: "onb_source_autre" },
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createUser, showToast, t } = useApp();

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
        setError(t("onb_err_name"));
        return;
      }
      setStep("age");
    } else if (step === "age") {
      const a = parseInt(age, 10);
      if (!a || a < 13 || a > 100) {
        setError(t("onb_err_age"));
        return;
      }
      setStep("source");
    } else if (step === "source") {
      if (!source) {
        setError(t("onb_err_source_missing"));
        return;
      }
      if (source === "autre" && otherSource.trim().length < 2) {
        setError(t("onb_err_source_other"));
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
        showToast(t("onb_err_generic"));
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
          <Text style={styles.doneTitle}>{t("onb_done_title")}</Text>
          <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.checkCircle}>
            <Icon3D family="ionicons" name="checkmark" size={48} color={colors.surface} />
          </Animated.View>
        </View>
        <View style={styles.doneCta}>
          <LiquidGlassButton
            testID="onboarding-continue-button"
            variant="primary"
            fullWidth
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace("/(tabs)");
            }}
          >
            <Text style={styles.primaryButtonText}>{t("common_continue")}</Text>
          </LiquidGlassButton>
        </View>
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
            <Text style={styles.title}>{t("onb_name_title")}</Text>
            <Text style={styles.subtitle}>{t("onb_name_subtitle")}</Text>
            <TextInput
              testID="onboarding-name-input"
              style={styles.input}
              placeholder={t("onb_name_placeholder")}
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
            <Text style={styles.title}>{t("onb_age_title")}</Text>
            <Text style={styles.subtitle}>{t("onb_age_subtitle")}</Text>
            <TextInput
              testID="onboarding-age-input"
              style={styles.input}
              placeholder={t("onb_age_placeholder")}
              placeholderTextColor={colors.muted}
              value={age}
              onChangeText={(txt) => setAge(txt.replace(/[^0-9]/g, ""))}
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
            <Text style={styles.title}>{t("onb_source_title")}</Text>
            <Text style={styles.subtitle}>{t("onb_source_subtitle")}</Text>
            <View style={styles.sourceList}>
              {SOURCES.map((s) => {
                const selected = source === s.key;
                return (
                  <LiquidGlassButton
                    key={s.key}
                    testID={`onboarding-source-${s.key}`}
                    variant={selected ? "primary" : "light"}
                    height={56}
                    fullWidth
                    borderRadius={radius.md}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSource(s.key);
                      setError(null);
                    }}
                    contentStyle={styles.sourceContent}
                  >
                    <Text
                      style={[
                        styles.sourceChipText,
                        selected && styles.sourceChipTextSelected,
                      ]}
                    >
                      {t(s.labelKey)}
                    </Text>
                    {selected && (
                      <Icon3D family="ionicons" name="checkmark-circle" size={20} color={colors.surface} />
                    )}
                  </LiquidGlassButton>
                );
              })}
            </View>
            {source === "autre" && (
              <Animated.View entering={FadeIn.duration(250)}>
                <TextInput
                  testID="onboarding-other-source-input"
                  style={[styles.input, styles.otherInput]}
                  placeholder={t("onb_source_other_placeholder")}
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
          <LiquidGlassButton
            testID="onboarding-next-button"
            variant="primary"
            fullWidth
            onPress={goNext}
          >
            <Text style={styles.primaryButtonText}>{t("common_continue")}</Text>
          </LiquidGlassButton>
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
    fontSize: 30,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: colors.onSurfaceTertiary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  input: {
    height: 62,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.lg,
    fontSize: 20,
    color: colors.onSurface,
  },
  otherInput: {
    marginTop: spacing.lg,
  },
  sourceList: {
    gap: spacing.md,
  },
  sourceContent: {
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  sourceChipText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  sourceChipTextSelected: {
    color: colors.onBrand,
    fontWeight: "700",
  },
  errorText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: "600",
    marginTop: spacing.md,
  },
  ctaWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
  },
  primaryButtonText: {
    color: colors.onBrand,
    fontSize: 18,
    fontWeight: "700",
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
  doneCta: {
    paddingHorizontal: spacing.xl,
  },
  doneTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
});
