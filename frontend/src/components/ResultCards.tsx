import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/src/context/AppContext";
import { dataUri } from "@/src/lib/api";
import { colors, genderColor, genderSoft, radius, shadow, spacing } from "@/src/theme";

const { width: SW, height: SH } = Dimensions.get("window");
const CARD_W = Math.min(SW - 56, 340);
const CARD_H = Math.min(SH * 0.64, 560);

export interface CardData {
  father: { photo: string; age: number; height: number };
  mother: { photo: string; age: number; height: number };
  baby: { photo: string; predictedHeight: number; gender: "boy" | "girl" };
}

const stripPrefix = (b64: string) => (b64.startsWith("data:") ? b64.split(",", 2)[1] : b64);

function SwipeCard({
  index,
  topIndex,
  canSwipe,
  onSwiped,
  children,
  testID,
}: {
  index: number;
  topIndex: number;
  canSwipe: boolean;
  onSwiped: () => void;
  children: React.ReactNode;
  testID: string;
}) {
  const isTop = index === topIndex;
  const depth = useSharedValue(index - topIndex);
  const tx = useSharedValue(0);

  useEffect(() => {
    depth.value = withSpring(index - topIndex, { damping: 16, stiffness: 160 });
  }, [topIndex, index, depth]);

  const pan = Gesture.Pan()
    .enabled(isTop && canSwipe)
    .onChange((e) => {
      tx.value = Math.max(e.translationX, -30);
    })
    .onEnd(() => {
      if (tx.value > 110) {
        tx.value = withTiming(SW * 1.4, { duration: 300 }, (finished) => {
          if (finished) runOnJS(onSwiped)();
        });
      } else {
        tx.value = withSpring(0, { damping: 15 });
      }
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: depth.value * 18 },
      { scale: 1 - Math.max(depth.value, 0) * 0.06 },
      { rotate: `${tx.value / 20}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, animStyle]} testID={testID}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

function ConfettiPiece({ index }: { index: number }) {
  const ty = useSharedValue(-30);
  const opacity = useSharedValue(1);
  const rot = useSharedValue(0);
  const conf = useMemo(
    () => ({
      left: Math.random() * (CARD_W - 20) + 10,
      color: [colors.blue, colors.pink, colors.brand, colors.success, "#fbbf24"][index % 5],
      size: 7 + Math.random() * 6,
      duration: 1300 + Math.random() * 700,
    }),
    [index],
  );

  useEffect(() => {
    ty.value = withDelay(index * 60, withTiming(CARD_H + 40, { duration: conf.duration }));
    rot.value = withDelay(index * 60, withTiming(Math.random() > 0.5 ? 540 : -540, { duration: conf.duration + 300 }));
    opacity.value = withDelay(conf.duration - 200, withTiming(0, { duration: 400 }));
  }, [index, conf, ty, rot, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { rotate: `${rot.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        { left: conf.left, width: conf.size, height: conf.size, backgroundColor: conf.color },
        style,
      ]}
    />
  );
}

function ParentContent({
  label,
  photo,
  age,
  height,
  accent,
}: {
  label: string;
  photo: string;
  age: number;
  height: number;
  accent: string;
}) {
  return (
    <>
      <Image source={{ uri: dataUri(photo) }} style={styles.parentPhoto} contentFit="cover" />
      <View style={styles.cardInfo}>
        <Text style={[styles.cardLabel, { color: accent }]}>{label}</Text>
        <Text style={styles.cardStats}>
          {age} ans • {height} cm
        </Text>
      </View>
    </>
  );
}

function BabyContent({
  data,
  isTop,
  onShare,
  onClose,
}: {
  data: CardData["baby"];
  isTop: boolean;
  onShare: () => void;
  onClose: () => void;
}) {
  const scale = useSharedValue(1);
  const [confettiOn, setConfettiOn] = useState(false);
  const accent = genderColor(data.gender);

  useEffect(() => {
    if (isTop) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scale.value = withSequence(
        withSpring(1.06, { damping: 7, stiffness: 220 }),
        withSpring(1, { damping: 12 }),
      );
      setConfettiOn(true);
    }
  }, [isTop, scale]);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.babyInner, bounceStyle]}>
      <Image source={{ uri: dataUri(data.photo) }} style={styles.babyPhoto} contentFit="cover" />
      <View style={styles.cardInfo}>
        <View style={styles.babyLabelRow}>
          <Text style={[styles.cardLabel, { color: accent }]}>Bébé</Text>
          <View style={[styles.babyGenderChip, { backgroundColor: genderSoft(data.gender) }]}>
            <Text style={[styles.babyGenderText, { color: accent }]}>
              {data.gender === "boy" ? "Garçon" : "Fille"}
            </Text>
          </View>
        </View>
        <Text style={styles.cardStats}>Taille adulte potentielle : {data.predictedHeight} cm</Text>
      </View>
      <View style={styles.babyButtons}>
        <Pressable
          testID="share-result-button"
          onPress={onShare}
          style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
        >
          <Ionicons name="share-outline" size={20} color={colors.onBrand} />
          <Text style={styles.shareButtonText}>Partager</Text>
        </Pressable>
        <Pressable
          testID="close-result-button"
          onPress={onClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <Text style={styles.closeButtonText}>Fermer</Text>
        </Pressable>
      </View>
      {confettiOn && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {Array.from({ length: 16 }).map((_, i) => (
            <ConfettiPiece key={i} index={i} />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

export default function ResultCards({ data, onClose }: { data: CardData; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { showToast } = useApp();
  const [topIndex, setTopIndex] = useState(0);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message = `Découvre notre futur bébé créé avec BabyFace AI ! Taille adulte potentielle : ${data.baby.predictedHeight} cm`;
    try {
      if (Platform.OS === "web") {
        await Share.share({ message });
        return;
      }
      const fileUri = FileSystem.cacheDirectory + "babyface-result.png";
      await FileSystem.writeAsStringAsync(fileUri, stripPrefix(data.baby.photo), {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: "image/png", dialogTitle: "Partager" });
      } else {
        await Share.share({ message });
      }
    } catch {
      showToast("Partage non disponible sur cet appareil");
    }
  };

  const cards = [
    {
      type: "father" as const,
      node: (
        <ParentContent
          label="Papa"
          photo={data.father.photo}
          age={data.father.age}
          height={data.father.height}
          accent={colors.blue}
        />
      ),
    },
    {
      type: "mother" as const,
      node: (
        <ParentContent
          label="Maman"
          photo={data.mother.photo}
          age={data.mother.age}
          height={data.mother.height}
          accent={colors.pink}
        />
      ),
    },
    {
      type: "baby" as const,
      node: (
        <BabyContent data={data.baby} isTop={topIndex === 2} onShare={handleShare} onClose={onClose} />
      ),
    },
  ];

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg }]}
      testID="result-cards-screen"
    >
      <View style={styles.topBar}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === topIndex && styles.dotActive]} />
          ))}
        </View>
        <Pressable testID="cards-exit-button" onPress={onClose} style={styles.exitButton}>
          <Ionicons name="close" size={24} color={colors.onSurfaceTertiary} />
        </Pressable>
      </View>

      <View style={styles.stackArea}>
        {[2, 1, 0].map((i) => {
          if (i < topIndex) return null;
          const card = cards[i];
          return (
            <SwipeCard
              key={i}
              index={i}
              topIndex={topIndex}
              canSwipe={i < 2}
              onSwiped={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTopIndex(i + 1);
              }}
              testID={`result-card-${card.type}`}
            >
              {card.node}
            </SwipeCard>
          );
        })}
      </View>

      <View style={styles.hintWrap}>
        {topIndex < 2 ? (
          <Text style={styles.swipeHint} testID="swipe-hint-text">
            Glisse la carte vers la droite
          </Text>
        ) : (
          <View style={styles.hintSpacer} />
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
  },
  dots: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceTertiary,
  },
  dotActive: {
    backgroundColor: colors.brand,
    width: 22,
  },
  exitButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  stackArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    position: "absolute",
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadow.card,
  },
  parentPhoto: {
    width: "100%",
    height: CARD_H - 104,
  },
  cardInfo: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  cardLabel: {
    fontSize: 20,
    fontWeight: "800",
  },
  cardStats: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.onSurfaceTertiary,
  },
  babyInner: {
    flex: 1,
  },
  babyPhoto: {
    width: "100%",
    height: CARD_H - 220,
  },
  babyLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  babyGenderChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },
  babyGenderText: {
    fontSize: 12,
    fontWeight: "800",
  },
  babyButtons: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    ...shadow.soft,
  },
  shareButtonText: {
    color: colors.onBrand,
    fontSize: 15,
    fontWeight: "700",
  },
  closeButton: {
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.onSurfaceTertiary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  confetti: {
    position: "absolute",
    top: 0,
    borderRadius: 2,
  },
  hintWrap: {
    alignItems: "center",
    minHeight: 24,
  },
  swipeHint: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  hintSpacer: {
    height: 18,
  },
});
