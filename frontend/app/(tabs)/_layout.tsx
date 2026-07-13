import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/src/context/AppContext";
import { colors, genderColor, spacing } from "@/src/theme";

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { gender, toggleGender } = useApp();
  const babyScale = useSharedValue(1);

  const babyAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: babyScale.value }],
  }));

  const activeGender = genderColor(gender);

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const isBaby = route.name === "index";

        const onPress = () => {
          if (isBaby && focused) {
            // Sélecteur de genre : taper l'onglet actif alterne bleu (garçon) / rose (fille)
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            toggleGender();
            babyScale.value = withSequence(
              withSpring(1.25, { damping: 10, stiffness: 300 }),
              withSpring(1, { damping: 12 }),
            );
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
          return (
            <Pressable
              key={route.key}
              testID="tab-babyface"
              onPress={onPress}
              style={styles.tabItem}
            >
              <Animated.View style={babyAnimStyle}>
                <MaterialCommunityIcons
                  name={focused ? "baby-face" : "baby-face-outline"}
                  size={30}
                  color={focused ? activeGender : colors.muted}
                />
              </Animated.View>
              <Text style={[styles.tabLabel, { color: focused ? activeGender : colors.muted }]}>
                BabyFace AI
              </Text>
            </Pressable>
          );
        }

        return (
          <Pressable key={route.key} testID="tab-profile" onPress={onPress} style={styles.tabItem}>
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={26}
              color={focused ? colors.brand : colors.muted}
            />
            <Text style={[styles.tabLabel, { color: focused ? colors.brand : colors.muted }]}>
              Profil
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.surface } }}
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
    minHeight: 52,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
});
