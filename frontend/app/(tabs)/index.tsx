import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/src/context/AppContext";
import { colors, genderColor, genderSoft, radius, shadow, spacing } from "@/src/theme";

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
        <Pressable
          testID="credits-badge"
          onPress={() => credits <= 0 && setShowBuySheet(true)}
          style={styles.creditsBadge}
        >
          <Ionicons name="sparkles" size={16} color={colors.brand} />
          <Text style={styles.creditsText}>{credits}</Text>
        </Pressable>
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
          <Text style={styles.hint}>Touche à nouveau l'onglet BabyFace AI pour changer le genre</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.startWrap}>
          <Pressable
            testID="start-generation-button"
            onPress={onStart}
            style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
          >
            <Text style={styles.startButtonText}>Commencer</Text>
          </Pressable>
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
                Tu as utilisé tous tes crédits gratuits. Achète-en d'autres pour continuer à générer des bébés.
              </Text>
              {/* Point d'accroche pour le futur système d'achat de crédits (prix à définir) */}
              <Pressable
                testID="buy-credits-button"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  showToast("Les achats de crédits arrivent bientôt");
                }}
                style={({ pressed }) => [styles.buyButton, pressed && styles.pressed]}
              >
                <Text style={styles.buyButtonText}>Acheter des crédits</Text>
              </Pressable>
              <Pressable
                testID="close-buy-sheet-button"
                onPress={() => setShowBuySheet(false)}
                style={({ pressed }) => [styles.closeSheetButton, pressed && styles.pressed]}
              >
                <Text style={styles.closeSheetText}>Fermer</Text>
              </Pressable>
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
    fontSize: 22,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -0.5,
  },
  creditsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 36,
  },
  creditsText: {
    fontSize: 15,
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
    fontSize: 24,
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
    fontSize: 14,
    fontWeight: "700",
  },
  hint: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 260,
  },
  startWrap: {
    width: "100%",
    alignItems: "center",
  },
  startButton: {
    width: "80%",
    maxWidth: 320,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  startButtonText: {
    color: colors.onBrand,
    fontSize: 18,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
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
    fontSize: 22,
    fontWeight: "800",
    color: colors.onSurface,
  },
  sheetText: {
    fontSize: 14,
    color: colors.onSurfaceTertiary,
    textAlign: "center",
    lineHeight: 21,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  buyButton: {
    width: "100%",
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  buyButtonText: {
    color: colors.onBrand,
    fontSize: 16,
    fontWeight: "700",
  },
  closeSheetButton: {
    marginTop: spacing.md,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  closeSheetText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.onSurfaceTertiary,
  },
});
