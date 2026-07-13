import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/src/context/AppContext";
import { api, GenerationSummary, dataUri } from "@/src/lib/api";
import { colors, radius, shadow, spacing } from "@/src/theme";

const { width: SW } = Dimensions.get("window");
const GRID_GAP = 3;
const CELL = (SW - spacing.lg * 2 - GRID_GAP * 2) / 3;

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useApp();
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
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshUser()]);
    setRefreshing(false);
  };

  const openEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/edit-profile");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
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
              <Ionicons name="person" size={48} color={colors.brand} />
            </View>
          )}
          <Pressable testID="edit-avatar-pencil" onPress={openEdit} style={styles.pencilBadge}>
            <Ionicons name="pencil" size={14} color={colors.surface} />
          </Pressable>
        </View>
        <Text style={styles.name} testID="profile-name-text">
          {user?.name ?? ""}
        </Text>
        {user && <Text style={styles.age}>{user.age} ans</Text>}
        <Pressable
          testID="edit-profile-button"
          onPress={openEdit}
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
        >
          <Text style={styles.editButtonText}>Modifier</Text>
        </Pressable>
      </View>

      <View style={styles.gridSection}>
        <Text style={styles.sectionLabel}>Mes générations</Text>
        {gens === null ? (
          <View style={styles.gridLoading}>
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : gens.length === 0 ? (
          <View style={styles.emptyState} testID="empty-generations-state">
            <MaterialCommunityIcons name="baby-face-outline" size={48} color={colors.borderStrong} />
            <Text style={styles.emptyText}>Aucune génération pour l'instant</Text>
          </View>
        ) : (
          <FlatList
            testID="generations-grid"
            data={gens}
            keyExtractor={(item) => item.id}
            numColumns={3}
            style={styles.grid}
            // La grille se remplit du bas vers le haut : ordre chronologique,
            // contenu ancré en bas quand il y a peu d'éléments.
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
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
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadow.soft,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.onSurface,
    marginTop: spacing.md,
  },
  age: {
    fontSize: 14,
    color: colors.onSurfaceTertiary,
    marginTop: 2,
  },
  editButton: {
    marginTop: spacing.md,
    height: 44,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonText: {
    color: colors.brand,
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  gridSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  grid: {
    flex: 1,
  },
  gridContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    gap: GRID_GAP,
    paddingBottom: spacing.md,
  },
  gridRow: {
    gap: GRID_GAP,
  },
  gridLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 14,
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
