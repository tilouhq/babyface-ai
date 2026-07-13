import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, User } from "@/src/lib/api";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { storage } from "@/src/utils/storage";

const USER_ID_KEY = "babyface_user_id";

type Gender = "boy" | "girl";

interface AppContextValue {
  ready: boolean;
  user: User | null;
  gender: Gender;
  toggleGender: () => void;
  createUser: (name: string, age: number, source: string) => Promise<void>;
  updateUser: (data: { name?: string; avatar_base64?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
  showToast: (message: string) => void;
  toastMessage: string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [gender, setGender] = useState<Gender>("boy");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const storedId = await storage.getItem<string | null>(USER_ID_KEY, null);
      if (storedId) {
        try {
          const u = await api.getUser(storedId);
          setUser(u);
        } catch {
          await storage.removeItem(USER_ID_KEY);
        }
      }
      setReady(true);
    })();
  }, []);

  const toggleGender = useCallback(() => {
    setGender((g) => (g === "boy" ? "girl" : "boy"));
  }, []);

  const createUser = useCallback(async (name: string, age: number, source: string) => {
    const u = await api.createUser({ name, age, referral_source: source });
    await storage.setItem(USER_ID_KEY, u.id);
    setUser(u);
  }, []);

  const updateUser = useCallback(
    async (data: { name?: string; avatar_base64?: string }) => {
      if (!user) return;
      const u = await api.updateUser(user.id, data);
      setUser(u);
    },
    [user],
  );

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const u = await api.getUser(user.id);
      setUser(u);
    } catch {
      // keep current state on transient errors
    }
  }, [user]);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(message);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2600);
  }, []);

  return (
    <AppContext.Provider
      value={{
        ready,
        user,
        gender,
        toggleGender,
        createUser,
        updateUser,
        refreshUser,
        showToast,
        toastMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function ToastHost() {
  const { toastMessage } = useApp();
  const insets = useSafeAreaInsets();
  if (!toastMessage) return null;
  return (
    <View pointerEvents="none" style={[styles.toastWrap, { top: insets.top + spacing.md }]}>
      <Animated.View
        entering={FadeInUp.duration(220)}
        exiting={FadeOutUp.duration(180)}
        style={styles.toast}
        testID="toast-message"
      >
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  toast: {
    backgroundColor: "#0f172a",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    maxWidth: "86%",
    ...shadow.card,
  },
  toastText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
