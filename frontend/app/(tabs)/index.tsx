import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LiquidGlassButton } from "@/src/components/LiquidGlassButton";
import { useApp } from "@/src/context/AppContext";
import { colors, genderColor, genderSoft, radius, spacing } from "@/src/theme";

export default function BabyFaceHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, gender, refreshUser, showToast } = useApp();
  const [showBuySheet, setShowBuySheet] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser]),
  );

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
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
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
          <Ionicons name="sparkles" size={16} color={colors.brand} />
          <Text style={styles.creditsText}>{credits}</Text>
        </LiquidGlassButton>
      </View>

      <View style={styles.center}>
        <Animated.View entering={FadeIn.duration(500)} style={[styles.babyCircle, { backgroundColor: gSoft }]}>
          <MaterialCommunityIcons name="baby-face" size={88} color={gColor} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.textBlock}>
          <Text style={styles.title}>Découvrez votre futur bébé</Text>
          <View style={[styles.genderChip, { backgroundColor: gSoft }]} testID="gender-indicator">
            <View style={[styles.genderDot, { backgroundColor: gColor }]} />
            <Text style={[styles.genderChipText, { color: gColor }]}>
              {gender === "boy" ? "Garçon" : "Fille"}
            </Text>
          </View>
          <Text style={styles.hint}>Touche à nouveau l’onglet BabyFace AI pour changer le genre</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.startWrap}>
          <LiquidGlassButton
            testID="start-generation-button"
            variant="primary"
            height={64}
            width={280}
            onPress={onStart}
          >
            <Text style={styles.startButtonText}>Commencer</Text>
          </LiquidGlassButton>
        </Animated.View>
      </View>

      <Modal visible={showBuySheet} transparent animationType="fade" onRequestClose={() => setShowBuySheet(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowBuySheet(false)}>
          <Animated.View entering={SlideInDown.duration(300)} style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
            <Pressable onPress={() => {}} style={styles.sheetInner}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetIconCircle}>
                <Ionicons name="sparkles" size={32} color={colors.brand} />
              </View>
              <Text style={styles.sheetTitle}>Plus de crédits</Text>
              <Text style={styles.sheetText}>
                Tu as utilisé tous tes crédits gratuits. Achète-en d’autres pour continuer à générer des bébés.
              </Text>
              <LiquidGlassButton
                testID="buy-credits-button"
                variant="primary"
                fullWidth
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  showToast("Les achats de crédits arrivent bientôt");
                }}
              >
                <Text style={styles.buyButtonText}>Acheter des crédits</Text>
              </LiquidGlassButton>
              <LiquidGlassButton
                testID="close-buy-sheet-button"
                variant="ghost"
                fullWidth
                height={48}
                onPress={() => setShowBuySheet(false)}
              >
                <Text style={styles.closeSheetText}>Fermer</Text>
              </LiquidGlassButton>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
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
    width: 160,
    height: 160,
    borderRadius: 80,
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
  genderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
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
