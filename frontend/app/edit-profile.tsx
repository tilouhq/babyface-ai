import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/src/context/AppContext";
import { dataUri } from "@/src/lib/api";
import { colors, radius, shadow, spacing } from "@/src/theme";

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser, showToast } = useApp();

  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState<string | null>(user?.avatar_base64 ?? null);
  const [saving, setSaving] = useState(false);

  const pickAvatar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
        base64: true,
      });
      if (!res.canceled && res.assets[0]?.base64) {
        setAvatar(res.assets[0].base64);
      }
    } catch {
      showToast("Impossible d'ouvrir la galerie");
    }
  };

  const save = async () => {
    if (name.trim().length < 2) {
      showToast("Entre un nom valide");
      return;
    }
    setSaving(true);
    try {
      await updateUser({
        name: name.trim(),
        ...(avatar ? { avatar_base64: avatar } : {}),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Profil mis à jour");
      router.back();
    } catch {
      showToast("Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Pressable testID="edit-profile-back-button" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={120}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          {avatar ? (
            <Image source={{ uri: dataUri(avatar) }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={48} color={colors.brand} />
            </View>
          )}
          <Pressable
            testID="change-avatar-button"
            onPress={pickAvatar}
            style={({ pressed }) => [styles.changePhotoButton, pressed && styles.pressed]}
          >
            <Ionicons name="image-outline" size={18} color={colors.brand} />
            <Text style={styles.changePhotoText}>Changer la photo</Text>
          </Pressable>
        </View>

        <Text style={styles.inputLabel}>Nom</Text>
        <TextInput
          testID="edit-name-input"
          style={styles.input}
          placeholder="Ton nom"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
        />
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: spacing.lg }}>
        <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Pressable
            testID="save-profile-button"
            onPress={save}
            disabled={saving}
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
          >
            {saving ? (
              <ActivityIndicator color={colors.onBrand} />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            )}
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
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.onSurface,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
  },
  changePhotoText: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "700",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.lg,
    fontSize: 17,
    fontWeight: "600",
    color: colors.onSurface,
  },
  ctaWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
  },
  saveButton: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  saveButtonText: {
    color: colors.onBrand,
    fontSize: 17,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
