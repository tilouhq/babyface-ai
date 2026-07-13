import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon3D, Icon3DVariant } from "@/src/components/Icon3D";
import { useApp } from "@/src/context/AppContext";
import { colors, genderColor, radius, spacing } from "@/src/theme";

function TabButton({
  focused,
  onPress,
  iconName,
  iconFamily,
  label,
  activeVariant,
  activeGlowColor,
  testID,
  extraScale,
}: {
  focused: boolean;
  onPress: () => void;
  iconName: string;
  iconFamily: "ionicons" | "material-community";
  label: string;
  activeVariant: Icon3DVariant;
  activeGlowColor: string;
  testID: string;
  extraScale?: number;
}) {
  // Continuous subtle pulse on the active tab — makes it feel "shining".
  const pulse = useSharedValue(0);
  const scale = useSharedValue(focused ? 1.08 : 1);

  useEffect(() => {
    if (focused) {
      pulse.value = 0;
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1400 }),
          withTiming(0, { duration: 1400 }),
        ),
        -1,
        false,
      );
      scale.value = withSequence(
        withSpring(1.16 + (extraScale ?? 0), { damping: 8, stiffness: 240 }),
        withSpring(1.08, { damping: 12 }),
      );
    } else {
      pulse.value = withTiming(0, { duration: 200 });
      scale.value = withSpring(1, { damping: 15 });
    }
  }, [focused, pulse, scale, extraScale]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: focused ? 0.35 + pulse.value * 0.35 : 0,
    transform: [{ scale: 0.9 + pulse.value * 0.25 }],
  }));

  const iconAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable testID={testID} onPress={onPress} style={styles.tabItem}>
      <View style={styles.iconStack}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            { backgroundColor: activeGlowColor },
            glowStyle,
          ]}
        />
        <Animated.View style={iconAnim}>
          <Icon3D
            family={iconFamily}
            name={iconName}
            size={30}
            variant={focused ? activeVariant : "muted"}
          />
        </Animated.View>
      </View>
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? colors.onSurface : colors.muted },
          focused && styles.tabLabelActive,
        ]}
      >
        {label}
      </Text>
      {focused && (
        <LinearGradient
          pointerEvents="none"
          colors={["transparent", activeGlowColor, "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.underline}
        />
      )}
    </Pressable>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { gender, toggleGender, t } = useApp();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const isBaby = route.name === "index";

        const onPress = () => {
          if (isBaby && focused) {
            // Tapping the active BabyFace tab toggles the gender.
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            toggleGender();
            return;
          }
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isBaby) {
          const gColor = genderColor(gender);
          return (
            <TabButton
              key={route.key}
              testID="tab-babyface"
              focused={focused}
              onPress={onPress}
              iconFamily="material-community"
              iconName={focused ? "baby-face" : "baby-face-outline"}
              label={t("tab_babyface")}
              activeVariant={gender === "boy" ? "blue" : "pink"}
              activeGlowColor={gColor}
              extraScale={0.04}
            />
          );
        }

        return (
          <TabButton
            key={route.key}
            testID="tab-profile"
            focused={focused}
            onPress={onPress}
            iconFamily="ionicons"
            iconName={focused ? "person" : "person-outline"}
            label={t("tab_profile")}
            activeVariant="brand"
            activeGlowColor={colors.brand}
          />
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.surface },
        animation: "shift",
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider ?? colors.border,
    paddingTop: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minHeight: 56,
    position: "relative",
  },
  iconStack: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glow: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: 23,
    top: -3,
    left: -3,
    // The blur is faked via low opacity + soft native shadow.
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  tabLabelActive: {
    fontWeight: "800",
  },
  underline: {
    position: "absolute",
    bottom: 2,
    left: "25%",
    right: "25%",
    height: 2,
    borderRadius: radius.pill,
  },
});
