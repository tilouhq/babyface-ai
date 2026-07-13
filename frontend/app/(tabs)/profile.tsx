import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon3D } from "@/src/components/Icon3D";
import {
  LiquidGlassButton,
  LiquidGlassIconButton,
} from "@/src/components/LiquidGlassButton";
import { useApp } from "@/src/context/AppContext";
import { api, GenerationSummary, dataUri } from "@/src/lib/api";
import { colors, radius, spacing } from "@/src/theme";

const { width: SW } = Dimensions.get("window");
const GRID_GAP = 3;
const CELL = (SW - spacing.lg * 2 - GRID_GAP * 2) / 3;

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser, t } = useApp();
  const [gens, setGens] = useState<GenerationSummary[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const list = await api.listGenerations(user.id);
      setGens(list);
    } catch {
      setGens([]);
    }
  }, [user]);

  // Keep latest load() in a ref so the focus effect stays stable.
  const loadRef = useRef(load);
  loadRef.current = load;

  const opacity = useSharedValue(1);
  useFocusEffect(
    useCallback(() => {
      opacity.value = 0;
      opacity.value = withTiming(1, { duration: 320 });
      loadRef.current();
    }, [opacity]),
  );
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshUser()]);
    setRefreshing(false);
  };

  const openEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/edit-profile");
  };

  const openSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/settings");
  };

  return (
    <Animated.View
      style={[styles.container, { paddingTop: insets.top + spacing.md }, fadeStyle]}
    >
      {/* Top bar with settings icon in the top-right. */}
      <View style={styles.topBar}>
        <View style={styles.topSpacer} />
        <LiquidGlassIconButton
          testID="profile-settings-button"
          variant="light"
          size={42}
          onPress={openSettings}
        >
          <Icon3D family="ionicons" name="settings-outline" size={20} variant="brand" />
        </LiquidGlassIconButton>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.avatarWrap}>
          {user?.avatar_base64 ? (
            <Image
              source={{ uri: dataUri(user.avatar_base64) }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Icon3D family="ionicons" name="person" size={52} variant="brand" />
            </View>
          )}
          <LiquidGlassIconButton
            testID="edit-avatar-pencil"
            variant="primary"
            size={32}
            onPress={openEdit}
            style={styles.pencilBadge}
          >
            <Icon3D family="ionicons" name="pencil" size={14} color={colors.surface} />
          </LiquidGlassIconButton>
        </View>
        <Text style={styles.name} testID="profile-name-text">
          {user?.name ?? ""}
        </Text>
        {user && (
          <Text style={styles.age}>{t("profile_age", { n: user.age })}</Text>
        )}
        <LiquidGlassButton
          testID="edit-profile-button"
          variant="light"
          height={44}
          onPress={openEdit}
          style={styles.editButtonWrap}
        >
          <Text style={styles.editButtonText}>{t("profile_edit")}</Text>
        </LiquidGlassButton>
      </View>

      <View style={styles.gridSection}>
        <Text style={styles.sectionLabel}>{t("profile_my_gens")}</Text>
        {gens === null ? (
          <View style={styles.gridLoading}>
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : gens.length === 0 ? (
          <View style={styles.emptyState} testID="empty-generations-state">
            <Icon3D
              family="material-community"
              name="baby-face-outline"
              size={48}
              variant="muted"
            />
            <Text style={styles.emptyText}>{t("profile_empty")}</Text>
          </View>
        ) : (
          <FlatList
            testID="generations-grid"
            data={gens}
            keyExtractor={(item) => item.id}
            numColumns={3}
            style={styles.grid}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.brand}
              />
            }
            renderItem={({ item }) => (
              <Pressable
                testID={`generation-cell-${item.id}`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/generation/${item.id}`);
                }}
                style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
              >
                <Image
                  source={{ uri: dataUri(item.baby_photo_base64) }}
                  style={styles.cellImage}
                  contentFit="cover"
                />
              </Pressable>
            )}
          />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  topSpacer: {
    width: 42,
    height: 42,
  },
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  avatarPlaceholder: {
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  pencilBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.onSurface,
    marginTop: spacing.md,
  },
  age: {
    fontSize: 15,
    color: colors.onSurfaceTertiary,
    marginTop: 2,
  },
  editButtonWrap: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  editButtonText: {
    color: colors.brand,
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
  },
  gridSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  grid: {
    flex: 1,
  },
  gridContent: {
    // Instagram-style: content anchored to the TOP, filling downward.
    gap: GRID_GAP,
    paddingTop: 0,
    paddingBottom: spacing.md,
  },
  gridRow: {
    gap: GRID_GAP,
  },
  gridLoading: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    paddingVertical: spacing.xxxl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 15,
    color: colors.muted,
    fontWeight: "600",
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: colors.surfaceTertiary,
  },
  cellPressed: {
    opacity: 0.8,
  },
  cellImage: {
    width: "100%",
    height: "100%",
  },
});
