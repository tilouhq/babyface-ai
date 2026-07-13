import { Image } from "expo-image";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Platform,
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

import { Icon3D } from "@/src/components/Icon3D";
import {
  LiquidGlassButton,
  LiquidGlassIconButton,
} from "@/src/components/LiquidGlassButton";
import { useApp } from "@/src/context/AppContext";
import { dataUri } from "@/src/lib/api";
import { colors, genderColor, genderSoft, radius, shadow, spacing } from "@/src/theme";

const { width: SW, height: SH } = Dimensions.get("window");
// Card sized so the baby's face has real space (not cropped): a bit wider,
// enough headroom below for label + stat + two buttons.
const CARD_W = Math.min(SW - 48, 360);
const CARD_H = Math.min(SH * 0.78, 660);
// The photo area is a square equal to the card's inner width — photos coming
// out of the picker (aspect [1,1]) and Gemini's head-and-shoulders framing
// both fit perfectly with contentFit="cover" without cropping the face.
const PHOTO_SIZE = CARD_W;

export interface CardData {
  father: { photo: string; age: number; height: number };
  mother: { photo: string; age: number; height: number };
  baby: { photo: string; predictedHeight: number; gender: "boy" | "girl" };
}

const stripPrefix = (b64: string) =>
  b64.startsWith("data:") ? b64.split(",", 2)[1] : b64;

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
      { translateY: depth.value * 16 },
      { scale: 1 - Math.max(depth.value, 0) * 0.05 },
      { rotate: `${tx.value / 22}deg` },
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
    rot.value = withDelay(
      index * 60,
      withTiming(Math.random() > 0.5 ? 540 : -540, { duration: conf.duration + 300 }),
    );
    opacity.value = withDelay(
      conf.duration - 200,
      withTiming(0, { duration: 400 }),
    );
  }, [index, conf, ty, rot, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { rotate: `${rot.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: conf.left,
          width: conf.size,
          height: conf.size,
          backgroundColor: conf.color,
        },
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
  statLabel,
}: {
  label: string;
  photo: string;
  age: number;
  height: number;
  accent: string;
  statLabel: string;
}) {
  return (
    <>
      <Image source={{ uri: dataUri(photo) }} style={styles.photoBox} contentFit="cover" />
      <View style={styles.cardInfo}>
        <Text style={[styles.cardLabel, { color: accent }]}>{label}</Text>
        <Text style={styles.cardStats}>{statLabel}</Text>
      </View>
    </>
  );
}

function BabyContent({
  data,
  isTop,
  onShare,
  onClose,
  labelBaby,
  labelBoy,
  labelGirl,
  labelShare,
  labelClose,
  labelPredicted,
}: {
  data: CardData["baby"];
  isTop: boolean;
  onShare: () => void;
  onClose: () => void;
  labelBaby: string;
  labelBoy: string;
  labelGirl: string;
  labelShare: string;
  labelClose: string;
  labelPredicted: string;
}) {
  const scale = useSharedValue(1);
  const [confettiOn, setConfettiOn] = useState(false);
  const accent = genderColor(data.gender);
  const shareVariant: "blue" | "pink" = data.gender === "boy" ? "blue" : "pink";

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
      {/* Baby photo: square, contentFit="cover" — no cropping of the face. */}
      <Image
        source={{ uri: dataUri(data.photo) }}
        style={styles.photoBox}
        contentFit="cover"
      />
      <View style={styles.cardInfo}>
        <View style={styles.babyLabelRow}>
          <Text style={[styles.cardLabel, { color: accent }]}>{labelBaby}</Text>
          <View style={[styles.babyGenderChip, { backgroundColor: genderSoft(data.gender) }]}>
            <Text style={[styles.babyGenderText, { color: accent }]}>
              {data.gender === "boy" ? labelBoy : labelGirl}
            </Text>
          </View>
        </View>
        <Text style={styles.cardStats}>{labelPredicted}</Text>
      </View>
      <View style={styles.babyButtons}>
        <LiquidGlassButton
          testID="share-result-button"
          variant={shareVariant}
          height={50}
          fullWidth
          onPress={onShare}
        >
          <Icon3D family="ionicons" name="share-outline" size={20} color={colors.onBrand} />
          <Text style={styles.shareButtonText}>{labelShare}</Text>
        </LiquidGlassButton>
        <LiquidGlassButton
          testID="close-result-button"
          variant="ghost"
          height={42}
          fullWidth
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>{labelClose}</Text>
        </LiquidGlassButton>
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

export default function ResultCards({
  data,
  onClose,
}: {
  data: CardData;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { showToast, t } = useApp();
  const [topIndex, setTopIndex] = useState(0);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message = t("cards_share_msg", { h: data.baby.predictedHeight });
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
        await Sharing.shareAsync(fileUri, {
          mimeType: "image/png",
          dialogTitle: t("cards_share"),
        });
      } else {
        await Share.share({ message });
      }
    } catch {
      showToast(t("cards_share_err"));
    }
  };

  const cards = [
    {
      type: "father" as const,
      node: (
        <ParentContent
          label={t("cards_papa")}
          photo={data.father.photo}
          age={data.father.age}
          height={data.father.height}
          accent={colors.blue}
          statLabel={t("cards_stats", { age: data.father.age, height: data.father.height })}
        />
      ),
    },
    {
      type: "mother" as const,
      node: (
        <ParentContent
          label={t("cards_maman")}
          photo={data.mother.photo}
          age={data.mother.age}
          height={data.mother.height}
          accent={colors.pink}
          statLabel={t("cards_stats", { age: data.mother.age, height: data.mother.height })}
        />
      ),
    },
    {
      type: "baby" as const,
      node: (
        <BabyContent
          data={data.baby}
          isTop={topIndex === 2}
          onShare={handleShare}
          onClose={onClose}
          labelBaby={t("cards_baby")}
          labelBoy={t("gender_boy")}
          labelGirl={t("gender_girl")}
          labelShare={t("cards_share")}
          labelClose={t("common_close")}
          labelPredicted={t("cards_predicted", { h: data.baby.predictedHeight })}
        />
      ),
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.lg,
        },
      ]}
      testID="result-cards-screen"
    >
      <View style={styles.topBar}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === topIndex && styles.dotActive]} />
          ))}
        </View>
        <LiquidGlassIconButton
          testID="cards-exit-button"
          variant="ghost"
          size={44}
          onPress={onClose}
        >
          <Icon3D family="ionicons" name="close" size={20} variant="dark" />
        </LiquidGlassIconButton>
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
            {t("cards_swipe")}
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
  photoBox: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    backgroundColor: colors.surfaceTertiary,
  },
  cardInfo: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  cardLabel: {
    fontSize: 22,
    fontWeight: "800",
  },
  cardStats: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onSurfaceTertiary,
  },
  babyInner: { flex: 1 },
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
    fontSize: 13,
    fontWeight: "800",
  },
  babyButtons: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  shareButtonText: {
    color: colors.onBrand,
    fontSize: 16,
    fontWeight: "700",
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.onSurfaceTertiary,
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
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
  },
  hintSpacer: { height: 18 },
});
