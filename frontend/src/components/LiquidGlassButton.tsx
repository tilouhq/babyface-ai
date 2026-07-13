// LiquidGlassButton — Apple-inspired "liquid glass" surface for every touchable
// in the app. Composed layers:
//   1. BlurView                — frosts anything showing through
//   2. Vertical color gradient — the glass body / tint
//   3. Top specular highlight  — glossy sheen (upper 55%)
//   4. Rim border              — thin translucent edge
//   5. Content                 — children (Text + icons)
// Wrapped in an Animated.View that shrinks slightly on press ("squish").

import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { radius } from "@/src/theme";

export type LiquidGlassVariant =
  | "primary"
  | "light"
  | "dark"
  | "blue"
  | "pink"
  | "success"
  | "ghost"
  | "error";

interface Tokens {
  tintTop: string;
  tintMid: string;
  tintBottom: string;
  border: string;
  blurTint: "light" | "dark" | "default";
  blurIntensity: number;
  shadowColor: string;
  shadowOpacity: number;
  gloss: readonly [string, string];
}

const VARIANTS: Record<LiquidGlassVariant, Tokens> = {
  primary: {
    tintTop: "rgba(174, 148, 224, 0.95)",
    tintMid: "rgba(152, 122, 214, 0.92)",
    tintBottom: "rgba(120, 91, 189, 0.95)",
    border: "rgba(255,255,255,0.45)",
    blurTint: "light",
    blurIntensity: 28,
    shadowColor: "#987ad6",
    shadowOpacity: 0.35,
    gloss: ["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"],
  },
  light: {
    tintTop: "rgba(255,255,255,0.92)",
    tintMid: "rgba(255,255,255,0.75)",
    tintBottom: "rgba(240,244,250,0.72)",
    border: "rgba(15,23,42,0.10)",
    blurTint: "light",
    blurIntensity: 40,
    shadowColor: "#0f172a",
    shadowOpacity: 0.10,
    gloss: ["rgba(255,255,255,0.75)", "rgba(255,255,255,0)"],
  },
  dark: {
    tintTop: "rgba(30, 41, 59, 0.90)",
    tintMid: "rgba(15, 23, 42, 0.92)",
    tintBottom: "rgba(2, 6, 23, 0.95)",
    border: "rgba(255,255,255,0.18)",
    blurTint: "dark",
    blurIntensity: 40,
    shadowColor: "#0f172a",
    shadowOpacity: 0.40,
    gloss: ["rgba(255,255,255,0.28)", "rgba(255,255,255,0)"],
  },
  blue: {
    tintTop: "rgba(96, 165, 250, 0.95)",
    tintMid: "rgba(59, 130, 246, 0.92)",
    tintBottom: "rgba(37, 99, 235, 0.95)",
    border: "rgba(255,255,255,0.45)",
    blurTint: "light",
    blurIntensity: 28,
    shadowColor: "#3b82f6",
    shadowOpacity: 0.35,
    gloss: ["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"],
  },
  pink: {
    tintTop: "rgba(251, 146, 200, 0.95)",
    tintMid: "rgba(244, 114, 182, 0.92)",
    tintBottom: "rgba(219, 82, 158, 0.95)",
    border: "rgba(255,255,255,0.45)",
    blurTint: "light",
    blurIntensity: 28,
    shadowColor: "#f472b6",
    shadowOpacity: 0.35,
    gloss: ["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"],
  },
  success: {
    tintTop: "rgba(74, 222, 128, 0.95)",
    tintMid: "rgba(34, 197, 94, 0.92)",
    tintBottom: "rgba(22, 163, 74, 0.95)",
    border: "rgba(255,255,255,0.45)",
    blurTint: "light",
    blurIntensity: 28,
    shadowColor: "#22c55e",
    shadowOpacity: 0.35,
    gloss: ["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"],
  },
  error: {
    tintTop: "rgba(252, 165, 165, 0.95)",
    tintMid: "rgba(239, 68, 68, 0.92)",
    tintBottom: "rgba(185, 28, 28, 0.95)",
    border: "rgba(255,255,255,0.45)",
    blurTint: "light",
    blurIntensity: 28,
    shadowColor: "#ef4444",
    shadowOpacity: 0.35,
    gloss: ["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"],
  },
  ghost: {
    tintTop: "rgba(255,255,255,0.68)",
    tintMid: "rgba(255,255,255,0.36)",
    tintBottom: "rgba(255,255,255,0.20)",
    border: "rgba(15,23,42,0.08)",
    blurTint: "light",
    blurIntensity: 20,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    gloss: ["rgba(255,255,255,0.6)", "rgba(255,255,255,0)"],
  },
};

export interface LiquidGlassButtonProps {
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  variant?: LiquidGlassVariant;
  height?: number;
  width?: number | "auto";
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  testID?: string;
  haptic?: boolean;
  borderRadius?: number;
}

export function LiquidGlassButton({
  onPress,
  onLongPress,
  disabled,
  variant = "primary",
  height = 56,
  width,
  fullWidth = false,
  style,
  contentStyle,
  children,
  testID,
  haptic = true,
  borderRadius,
}: LiquidGlassButtonProps) {
  const scale = useSharedValue(1);
  const v = VARIANTS[variant];
  const br = borderRadius ?? radius.pill;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const wrapperStyle = [
    styles.wrapper,
    {
      height,
      borderRadius: br,
      shadowColor: v.shadowColor,
      shadowOpacity: disabled ? 0 : v.shadowOpacity,
    },
    fullWidth && styles.fullWidth,
    typeof width === "number" && { width },
    animStyle,
    style,
  ];

  return (
    <Animated.View style={wrapperStyle}>
      <Pressable
        testID={testID}
        onPress={handlePress}
        onLongPress={onLongPress}
        disabled={disabled}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 20, stiffness: 320 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 240 });
        }}
        style={[styles.pressable, { borderRadius: br, opacity: disabled ? 0.5 : 1 }]}
      >
        <BlurView
          intensity={v.blurIntensity}
          tint={v.blurTint}
          style={[StyleSheet.absoluteFill, { borderRadius: br, overflow: "hidden" }]}
        />
        <LinearGradient
          colors={[v.tintTop, v.tintMid, v.tintBottom]}
          locations={[0, 0.55, 1]}
          style={[StyleSheet.absoluteFill, { borderRadius: br }]}
        />
        <LinearGradient
          colors={v.gloss}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            styles.gloss,
            {
              height: height * 0.55,
              borderTopLeftRadius: br,
              borderTopRightRadius: br,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[styles.rim, { borderRadius: br, borderColor: v.border }]}
        />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </Pressable>
    </Animated.View>
  );
}

export interface LiquidGlassIconButtonProps
  extends Omit<LiquidGlassButtonProps, "height" | "width" | "fullWidth"> {
  size?: number;
}

export function LiquidGlassIconButton({
  size = 44,
  variant = "ghost",
  style,
  ...rest
}: LiquidGlassIconButtonProps) {
  return (
    <LiquidGlassButton
      {...rest}
      variant={variant}
      height={size}
      width={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 8,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  pressable: {
    flex: 1,
    overflow: "hidden",
  },
  gloss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
  },
});
