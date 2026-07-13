// Icon3D — wraps @expo/vector-icons families with a gradient fill (via MaskedView)
// and a subtle offset shadow ghost, giving every icon a soft 3D look.
// Fallback: pass `color=` to render a flat monochrome icon with textShadow depth.

import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import * as React from "react";
import { StyleProp, StyleSheet, TextStyle, View, ViewStyle } from "react-native";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export type Icon3DVariant =
  | "brand"
  | "dark"
  | "light"
  | "muted"
  | "blue"
  | "pink"
  | "success"
  | "error"
  | "warning"
  | "onBrand";

interface VariantTokens {
  top: string;
  bottom: string;
  shadow: string;
  highlight: string;
}

const VARIANTS: Record<Icon3DVariant, VariantTokens> = {
  brand:   { top: "#b39ce5", bottom: "#6c46b8", shadow: "rgba(76, 54, 130, 0.35)", highlight: "rgba(255,255,255,0.35)" },
  dark:    { top: "#3f4a63", bottom: "#0b1220", shadow: "rgba(0,0,0,0.35)",         highlight: "rgba(255,255,255,0.30)" },
  light:   { top: "#ffffff", bottom: "#cbd5e1", shadow: "rgba(15,23,42,0.20)",      highlight: "rgba(255,255,255,0.55)" },
  muted:   { top: "#94a3b8", bottom: "#475569", shadow: "rgba(15,23,42,0.20)",      highlight: "rgba(255,255,255,0.35)" },
  blue:    { top: "#7cb1fc", bottom: "#1e40af", shadow: "rgba(37,99,235,0.35)",     highlight: "rgba(255,255,255,0.35)" },
  pink:    { top: "#fda4c6", bottom: "#b91362", shadow: "rgba(219,39,119,0.35)",    highlight: "rgba(255,255,255,0.35)" },
  success: { top: "#86efac", bottom: "#15803d", shadow: "rgba(22,163,74,0.35)",     highlight: "rgba(255,255,255,0.35)" },
  error:   { top: "#fca5a5", bottom: "#b91c1c", shadow: "rgba(220,38,38,0.35)",     highlight: "rgba(255,255,255,0.35)" },
  warning: { top: "#fcd34d", bottom: "#a16207", shadow: "rgba(217,119,6,0.35)",     highlight: "rgba(255,255,255,0.35)" },
  onBrand: { top: "#ffffff", bottom: "#e9e1f7", shadow: "rgba(76,54,130,0.30)",     highlight: "rgba(255,255,255,0.55)" },
};

export type IconFamily = "ionicons" | "material-community";

export interface Icon3DProps {
  name: string;
  size?: number;
  family?: IconFamily;
  variant?: Icon3DVariant;
  color?: string; // flat-color fallback (still gets a subtle text-shadow for depth)
  style?: StyleProp<ViewStyle>;
}

function pickComponent(family: IconFamily) {
  return family === "material-community" ? MaterialCommunityIcons : Ionicons;
}

export function Icon3D({
  name,
  size = 24,
  family = "ionicons",
  variant = "brand",
  color,
  style,
}: Icon3DProps) {
  const IconComp = pickComponent(family) as any;

  if (color) {
    // Flat-color mode: just a text-shadow to add a bit of depth without a gradient.
    return (
      <IconComp
        name={name}
        size={size}
        color={color}
        style={[styles.flatShadow as TextStyle, style]}
      />
    );
  }

  const v = VARIANTS[variant];

  return (
    <View style={[{ width: size, height: size }, style]}>
      {/* Offset shadow ghost — gives the icon a soft drop shadow within its bounding box. */}
      <View pointerEvents="none" style={styles.ghostWrap}>
        <IconComp name={name} size={size} color={v.shadow} />
      </View>
      {/* Real icon: mask + gradient fill + top-left specular. */}
      <MaskedView
        style={{ width: size, height: size }}
        maskElement={
          <View style={styles.maskCenter}>
            <IconComp name={name} size={size} color="black" />
          </View>
        }
      >
        <LinearGradient
          colors={[v.top, v.bottom]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ width: size, height: size }}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[v.highlight, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  ghostWrap: {
    position: "absolute",
    top: 1.5,
    left: 0.5,
  },
  maskCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  flatShadow: {
    textShadowColor: "rgba(15,23,42,0.22)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
});
