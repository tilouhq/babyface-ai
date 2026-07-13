import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon3D } from "@/src/components/Icon3D";
import { LiquidGlassButton } from "@/src/components/LiquidGlassButton";
import { useApp } from "@/src/context/AppContext";
import { colors, genderColor, genderSoft, radius, spacing } from "@/src/theme";

export default function BabyFaceHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, gender, refreshUser, showToast, t } = useApp();
  const [showBuySheet, setShowBuySheet] = useState(false);

  // Keep the latest refreshUser in a ref so the useFocusEffect callback stays
  // stable and doesn't re-fire on every render (which would fight the fade).
  const refreshRef = useRef(refreshUser);
  refreshRef.current = refreshUser;

  // Fade the whole screen in every time the tab regains focus.
  const opacity = useSharedValue(1);
  useFocusEffect(
    useCallback(() => {
      opacity.value = 0;
      opacity.value = withTiming(1, { duration: 320 });
      refreshRef.current();
    }, [opacity]),
  );
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const credits = user?.credits ?? 0;
  const gColor = genderColor(gender);
  const gSoft = genderSoft(gender);

  const onStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (credits <= 0) {
      setShowBuySheet(true);
      return;
    }
    router.push("/generate");
  };

  return (
    <Animated.View
      style={[styles.container, { paddingTop: insets.top + spacing.md }, fadeStyle]}
    >
      <View style={styles.header}>
        <Text style={styles.logoText}>babyface ai</Text>
        <LiquidGlassButton
          testID="credits-badge"
          variant="light"
          height={38}
          borderRadius={radius.pill}
          onPress={() => credits <= 0 && setShowBuySheet(true)}
          contentStyle={styles.creditsContent}
        >
          <Icon3D family="ionicons" name="sparkles" size={16} variant="brand" />
          <Text style={styles.creditsText}>{credits}</Text>
        </LiquidGlassButton>
      </View>

      <View style={styles.center}>
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={[styles.babyCircle, { backgroundColor: gSoft }]}
        >
          <Icon3D
            family="material-community"
            name="baby-face"
            size={96}
            variant={gender === "boy" ? "blue" : "pink"}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.textBlock}>
          <Text style={styles.title}>{t("home_title")}</Text>
          <View style={[styles.genderChip, { backgroundColor: gSoft }]} testID="gender-indicator">
            <View style={[styles.genderDot, { backgroundColor: gColor }]} />
            <Text style={[styles.genderChipText, { color: gColor }]}>
              {gender === "boy" ? t("gender_boy") : t("gender_girl")}
            </Text>
          </View>
          <Text style={styles.hint}>{t("home_hint")}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.startWrap}>
          <LiquidGlassButton
            testID="start-generation-button"
            variant="primary"
            height={64}
            width={280}
            onPress={onStart}
          >
            <Text style={styles.startButtonText}>{t("home_start")}</Text>
          </LiquidGlassButton>
        </Animated.View>
      </View>

      <Modal
        visible={showBuySheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBuySheet(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowBuySheet(false)}>
          <Animated.View
            entering={SlideInDown.duration(300)}
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}
          >
            <Pressable onPress={() => {}} style={styles.sheetInner}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetIconCircle}>
                <Icon3D family="ionicons" name="sparkles" size={34} variant="brand" />
              </View>
              <Text style={styles.sheetTitle}>{t("home_buy_title")}</Text>
              <Text style={styles.sheetText}>{t("home_buy_text")}</Text>
              <LiquidGlassButton
                testID="buy-credits-button"
                variant="primary"
                fullWidth
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  showToast(t("home_buy_toast"));
                }}
              >
                <Text style={styles.buyButtonText}>{t("home_buy_cta")}</Text>
              </LiquidGlassButton>
              <LiquidGlassButton
                testID="close-buy-sheet-button"
                variant="ghost"
                fullWidth
                height={48}
                onPress={() => setShowBuySheet(false)}
              >
                <Text style={styles.closeSheetText}>{t("common_close")}</Text>
              </LiquidGlassButton>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  logoText: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -0.5,
  },
  creditsContent: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  creditsText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.brand,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.xxl,
  },
  babyCircle: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.onSurface,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  genderChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 36,
  },
  genderDot: { width: 10, height: 10, borderRadius: 5 },
  genderChipText: {
    fontSize: 15,
    fontWeight: "700",
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 280,
  },
  startWrap: {
    width: "100%",
    alignItems: "center",
  },
  startButtonText: {
    color: colors.onBrand,
    fontSize: 20,
    fontWeight: "800",
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  sheetInner: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    alignItems: "center",
    gap: spacing.md,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.lg,
  },
  sheetIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.onSurface,
  },
  sheetText: {
    fontSize: 15,
    color: colors.onSurfaceTertiary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  buyButtonText: {
    color: colors.onBrand,
    fontSize: 17,
    fontWeight: "700",
  },
  closeSheetText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onSurfaceTertiary,
  },
});
