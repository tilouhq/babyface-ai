// Settings screen — opened from the top-right of the Profile tab.
// Two sections:
//   1. Language: fr | en | es (device locale is used by default; this overrides)
//   2. Danger zone: delete-my-account (with confirm modal). In the test/demo
//      environment this clears the local user + backend row, so the app
//      "starts from zero" and credits reset.

import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon3D } from "@/src/components/Icon3D";
import {
  LiquidGlassButton,
  LiquidGlassIconButton,
} from "@/src/components/LiquidGlassButton";
import { useApp } from "@/src/context/AppContext";
import {
  Language,
  LANGUAGE_FLAG,
  LANGUAGE_LABEL,
  SUPPORTED_LANGUAGES,
} from "@/src/lib/i18n";
import { colors, radius, spacing } from "@/src/theme";

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, setLanguage, deleteAccount, showToast, t } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const pickLang = async (l: Language) => {
    if (l === language) return;
    Haptics.selectionAsync();
    await setLanguage(l);
  };

  const confirmDelete = async () => {
    if (busy) return;
    setBusy(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await deleteAccount();
      showToast(t("settings_deleted_toast"));
      setShowConfirm(false);
      // Reset navigation to login — the app truly "starts from zero".
      router.replace("/login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <LiquidGlassIconButton
          testID="settings-close-button"
          onPress={() => router.back()}
          variant="ghost"
          size={42}
        >
          <Icon3D family="ionicons" name="chevron-down" size={22} variant="dark" />
        </LiquidGlassIconButton>
        <Text style={styles.headerTitle}>{t("settings_title")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("settings_language")}</Text>
          <View style={styles.langList}>
            {SUPPORTED_LANGUAGES.map((l) => {
              const selected = l === language;
              return (
                <LiquidGlassButton
                  key={l}
                  testID={`settings-lang-${l}`}
                  variant={selected ? "primary" : "light"}
                  height={56}
                  fullWidth
                  borderRadius={radius.md}
                  onPress={() => pickLang(l)}
                  contentStyle={styles.langContent}
                >
                  <Text style={styles.langFlag}>{LANGUAGE_FLAG[l]}</Text>
                  <Text
                    style={[
                      styles.langText,
                      selected && styles.langTextSelected,
                    ]}
                  >
                    {LANGUAGE_LABEL[l]}
                  </Text>
                  <View style={styles.langSpacer} />
                  {selected && (
                    <Icon3D
                      family="ionicons"
                      name="checkmark-circle"
                      size={22}
                      color={colors.surface}
                    />
                  )}
                </LiquidGlassButton>
              );
            })}
          </View>
          <Text style={styles.hint}>{t("settings_language_hint")}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, styles.dangerLabel]}>
            {t("settings_danger")}
          </Text>
          <LiquidGlassButton
            testID="settings-delete-button"
            variant="error"
            height={54}
            fullWidth
            borderRadius={radius.md}
            onPress={() => setShowConfirm(true)}
          >
            <Icon3D family="ionicons" name="trash" size={18} color={colors.surface} />
            <Text style={styles.deleteText}>{t("settings_delete")}</Text>
          </LiquidGlassButton>
        </View>
      </View>

      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => !busy && setShowConfirm(false)}
        >
          <Animated.View
            entering={SlideInDown.duration(280)}
            style={[
              styles.confirmSheet,
              { paddingBottom: insets.bottom + spacing.xl },
            ]}
          >
            <Pressable onPress={() => {}} style={styles.confirmInner}>
              <View style={styles.dangerCircle}>
                <Icon3D
                  family="ionicons"
                  name="alert-circle"
                  size={38}
                  variant="error"
                />
              </View>
              <Text style={styles.confirmTitle}>
                {t("settings_delete_confirm_title")}
              </Text>
              <Text style={styles.confirmText}>
                {t("settings_delete_confirm_text")}
              </Text>
              <LiquidGlassButton
                testID="settings-delete-confirm-button"
                variant="error"
                fullWidth
                onPress={confirmDelete}
                disabled={busy}
              >
                <Text style={styles.deleteText}>
                  {t("settings_delete_confirm_cta")}
                </Text>
              </LiquidGlassButton>
              <LiquidGlassButton
                testID="settings-delete-cancel-button"
                variant="ghost"
                fullWidth
                height={48}
                onPress={() => setShowConfirm(false)}
                disabled={busy}
              >
                <Text style={styles.cancelText}>{t("common_cancel")}</Text>
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
    paddingHorizontal: spacing.md,
  },
  headerSpacer: { width: 42, height: 42 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.onSurface,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.xxl,
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: colors.onSurfaceTertiary,
  },
  dangerLabel: { color: colors.error },
  langList: { gap: spacing.md },
  langContent: {
    justifyContent: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  langFlag: { fontSize: 22 },
  langText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.onSurface,
  },
  langTextSelected: {
    color: colors.onBrand,
    fontWeight: "700",
  },
  langSpacer: { flex: 1 },
  hint: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  deleteText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onSurfaceTertiary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  confirmSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  confirmInner: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  dangerCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#fdeceb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.onSurface,
    textAlign: "center",
  },
  confirmText: {
    fontSize: 15,
    color: colors.onSurfaceTertiary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.md,
  },
});
