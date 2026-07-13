import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
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
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ResultCards from "@/src/components/ResultCards";
import { useApp } from "@/src/context/AppContext";
import { api, ApiError, Generation, dataUri } from "@/src/lib/api";
import { colors, genderColor, radius, shadow, spacing } from "@/src/theme";

type Step =
  | "man-info"
  | "man-photo"
  | "woman-info"
  | "woman-photo"
  | "generating"
  | "reveal"
  | "cards"
  | "error";

const LOADING_MESSAGES = [
  "Analyse des visages...",
  "Fusion des traits...",
  "Création de votre bébé...",
  "Derniers détails...",
];

export default function Generate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, gender, refreshUser, showToast } = useApp();

  const [step, setStep] = useState<Step>("man-info");
  const [manAge, setManAge] = useState("");
  const [manHeight, setManHeight] = useState("");
  const [manPhoto, setManPhoto] = useState<string | null>(null);
  const [womanAge, setWomanAge] = useState("");
  const [womanHeight, setWomanHeight] = useState("");
  const [womanPhoto, setWomanPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Generation | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [showPermissionSheet, setShowPermissionSheet] = useState(false);

  // Genre capturé à l'entrée dans la section (état de l'onglet au moment d'entrer)
  const genderRef = useRef(gender);
  const startedRef = useRef(false);

  const isMan = step === "man-info" || step === "man-photo";
  const currentPhoto = isMan ? manPhoto : womanPhoto;
  const setCurrentPhoto = isMan ? setManPhoto : setWomanPhoto;

  useEffect(() => {
    if (step !== "generating") return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step !== "generating" || startedRef.current || !user) return;
    startedRef.current = true;
    (async () => {
      try {
        const gen = await api.createGeneration({
          user_id: user.id,
          gender: genderRef.current,
          father_photo_base64: manPhoto!,
          father_age: parseInt(manAge, 10),
          father_height_cm: parseInt(manHeight, 10),
          mother_photo_base64: womanPhoto!,
          mother_age: parseInt(womanAge, 10),
          mother_height_cm: parseInt(womanHeight, 10),
        });
        await refreshUser();
        setResult(gen);
        // Transition subtile en fondu vers l'écran "révéler"
        setStep("reveal");
      } catch (e) {
        startedRef.current = false;
        if (e instanceof ApiError && e.status === 402) {
          showToast("Tu n'as plus de crédits");
          router.back();
        } else {
          setStep("error");
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, user]);

  const validateInfo = () => {
    const age = parseInt(isMan ? manAge : womanAge, 10);
    const height = parseInt(isMan ? manHeight : womanHeight, 10);
    if (!age || age < 16 || age > 90) {
      setError("Entre un âge valide (16 à 90 ans)");
      return false;
    }
    if (!height || height < 120 || height > 230) {
      setError("Entre une taille valide (120 à 230 cm)");
      return false;
    }
    return true;
  };

  const goNextFromInfo = () => {
    setError(null);
    if (!validateInfo()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(isMan ? "man-photo" : "woman-photo");
  };

  const goNextFromPhoto = () => {
    if (!currentPhoto) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isMan) {
      setStep("woman-info");
    } else {
      setStep("generating");
    }
  };

  const goBack = () => {
    setError(null);
    if (step === "man-info") router.back();
    else if (step === "man-photo") setStep("man-info");
    else if (step === "woman-info") setStep("man-photo");
    else if (step === "woman-photo") setStep("woman-info");
  };

  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
    base64: true,
  };

  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let perm = await ImagePicker.getCameraPermissionsAsync();
    if (!perm.granted) {
      if (!perm.canAskAgain) {
        setShowPermissionSheet(true);
        return;
      }
      perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        if (!perm.canAskAgain) setShowPermissionSheet(true);
        return;
      }
    }
    try {
      const res = await ImagePicker.launchCameraAsync(pickerOptions);
      if (!res.canceled && res.assets[0]?.base64) {
        setCurrentPhoto(res.assets[0].base64);
      }
    } catch {
      showToast("Impossible d'ouvrir la caméra");
    }
  };

  const uploadPhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (!res.canceled && res.assets[0]?.base64) {
        setCurrentPhoto(res.assets[0].base64);
      }
    } catch {
      showToast("Impossible d'ouvrir la galerie");
    }
  };

  const stepIndex =
    step === "man-info" ? 0 : step === "man-photo" ? 1 : step === "woman-info" ? 2 : 3;
  const showHeader = ["man-info", "man-photo", "woman-info", "woman-photo"].includes(step);
  const accent = isMan ? colors.blue : colors.pink;

  // ------- Écrans plein écran (generating / reveal / cards / error) -------

  if (step === "generating") {
    return (
      <Animated.View
        key="generating"
        entering={FadeIn.duration(450)}
        style={[styles.fullCenter, { paddingBottom: insets.bottom + spacing.xxl }]}
        testID="generation-loading-screen"
      >
        <View style={[styles.loadingCircle, { backgroundColor: colors.brandSoft }]}>
          <MaterialCommunityIcons name="baby-face" size={64} color={colors.brand} />
        </View>
        <Text style={styles.loadingTitle}>Génération en cours</Text>
        <Animated.Text key={loadingMsgIndex} entering={FadeIn.duration(400)} style={styles.loadingMsg}>
          {LOADING_MESSAGES[loadingMsgIndex]}
        </Animated.Text>
        <ActivityIndicator size="large" color={colors.brand} style={styles.loadingSpinner} />
      </Animated.View>
    );
  }

  if (step === "reveal") {
    return (
      <Animated.View
        key="reveal"
        entering={FadeIn.duration(500)}
        style={styles.fullCenter}
        testID="reveal-screen"
      >
        <Animated.View entering={ZoomIn.delay(150).springify()} style={styles.revealCheck}>
          <Ionicons name="checkmark" size={52} color={colors.surface} />
        </Animated.View>
        <Pressable
          testID="reveal-results-button"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setStep("cards");
          }}
          style={({ pressed }) => [styles.revealButton, pressed && styles.pressed]}
        >
          <Text style={styles.revealButtonText}>Révéler les résultats</Text>
        </Pressable>
      </Animated.View>
    );
  }

  if (step === "cards" && result) {
    return (
      <Animated.View key="cards" entering={FadeIn.duration(400)} style={styles.flex}>
        <ResultCards
          data={{
            father: {
              photo: result.father_photo_base64,
              age: result.father_age,
              height: result.father_height_cm,
            },
            mother: {
              photo: result.mother_photo_base64,
              age: result.mother_age,
              height: result.mother_height_cm,
            },
            baby: {
              photo: result.baby_photo_base64,
              predictedHeight: result.predicted_height_cm,
              gender: result.gender,
            },
          }}
          onClose={() => router.back()}
        />
      </Animated.View>
    );
  }

  if (step === "error") {
    return (
      <View style={styles.fullCenter} testID="generation-error-screen">
        <View style={styles.errorCircle}>
          <Ionicons name="alert" size={44} color={colors.error} />
        </View>
        <Text style={styles.loadingTitle}>Oups, la génération a échoué</Text>
        <Text style={styles.loadingMsg}>Réessaie dans quelques instants</Text>
        <Pressable
          testID="retry-generation-button"
          onPress={() => setStep("generating")}
          style={({ pressed }) => [styles.revealButton, pressed && styles.pressed]}
        >
          <Text style={styles.revealButtonText}>Réessayer</Text>
        </Pressable>
        <Pressable
          testID="cancel-generation-button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}
        >
          <Text style={styles.ghostButtonText}>Fermer</Text>
        </Pressable>
      </View>
    );
  }

  // ------- Étapes du formulaire -------

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      {showHeader && (
        <View style={styles.header}>
          <Pressable testID="generate-back-button" onPress={goBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
          </Pressable>
          <View style={styles.progressRow}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.progressDot, i <= stepIndex && { backgroundColor: accent }]} />
            ))}
          </View>
          <View style={styles.backButton} />
        </View>
      )}

      {(step === "man-info" || step === "woman-info") && (
        <>
          <KeyboardAwareScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            bottomOffset={120}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View key={step} entering={FadeIn.duration(350)} exiting={FadeOut.duration(150)}>
              <View style={[styles.personBadge, { backgroundColor: isMan ? colors.blueSoft : colors.pinkSoft }]}>
                <Ionicons name={isMan ? "man" : "woman"} size={30} color={accent} />
              </View>
              <Text style={styles.title}>{isMan ? "L'homme" : "La femme"}</Text>
              <Text style={styles.subtitle}>Renseigne son âge et sa taille</Text>

              <Text style={styles.inputLabel}>Âge</Text>
              <TextInput
                testID={isMan ? "man-age-input" : "woman-age-input"}
                style={styles.input}
                placeholder="Ex : 28"
                placeholderTextColor={colors.muted}
                value={isMan ? manAge : womanAge}
                onChangeText={(t) => (isMan ? setManAge : setWomanAge)(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                maxLength={2}
              />

              <Text style={styles.inputLabel}>Taille (cm)</Text>
              <TextInput
                testID={isMan ? "man-height-input" : "woman-height-input"}
                style={styles.input}
                placeholder="Ex : 180"
                placeholderTextColor={colors.muted}
                value={isMan ? manHeight : womanHeight}
                onChangeText={(t) => (isMan ? setManHeight : setWomanHeight)(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                maxLength={3}
              />

              {error && (
                <Text style={styles.errorText} testID="generate-error-text">
                  {error}
                </Text>
              )}
            </Animated.View>
          </KeyboardAwareScrollView>

          <KeyboardStickyView offset={{ closed: 0, opened: spacing.lg }}>
            <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + spacing.lg }]}>
              <Pressable
                testID="generate-next-button"
                onPress={goNextFromInfo}
                style={({ pressed }) => [styles.primaryButton, { backgroundColor: accent }, pressed && styles.pressed]}
              >
                <Text style={styles.primaryButtonText}>Continuer</Text>
              </Pressable>
            </View>
          </KeyboardStickyView>
        </>
      )}

      {(step === "man-photo" || step === "woman-photo") && (
        <Animated.View
          key={step}
          entering={FadeIn.duration(350)}
          exiting={FadeOut.duration(150)}
          style={[styles.flex, styles.photoStep, { paddingBottom: insets.bottom + spacing.lg }]}
        >
          <Text style={styles.title}>{isMan ? "Photo de l'homme" : "Photo de la femme"}</Text>
          <Text style={styles.subtitle}>Un visage bien visible, de face</Text>

          {currentPhoto ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: dataUri(currentPhoto) }} style={styles.preview} contentFit="cover" />
              <Pressable
                testID="retake-photo-button"
                onPress={() => setCurrentPhoto(null)}
                style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}
              >
                <Text style={styles.ghostButtonText}>Reprendre</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.photoOptions}>
              <Pressable
                testID="take-photo-button"
                onPress={takePhoto}
                style={({ pressed }) => [styles.photoOption, pressed && styles.pressed]}
              >
                <View style={[styles.photoOptionIcon, { backgroundColor: isMan ? colors.blueSoft : colors.pinkSoft }]}>
                  <Ionicons name="camera" size={30} color={accent} />
                </View>
                <Text style={styles.photoOptionText}>Prendre une photo</Text>
              </Pressable>
              <Pressable
                testID="upload-photo-button"
                onPress={uploadPhoto}
                style={({ pressed }) => [styles.photoOption, pressed && styles.pressed]}
              >
                <View style={[styles.photoOptionIcon, { backgroundColor: colors.brandSoft }]}>
                  <Ionicons name="images" size={30} color={colors.brand} />
                </View>
                <Text style={styles.photoOptionText}>Importer une photo</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.flexSpacer} />

          {currentPhoto && (
            <Pressable
              testID="photo-continue-button"
              onPress={goNextFromPhoto}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: accent, marginHorizontal: spacing.xl },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>{isMan ? "Continuer" : "Générer le bébé"}</Text>
            </Pressable>
          )}
        </Animated.View>
      )}

      <Modal
        visible={showPermissionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPermissionSheet(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowPermissionSheet(false)}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
            <View style={styles.sheetHandle} />
            <Ionicons name="camera-outline" size={40} color={colors.brand} />
            <Text style={styles.sheetTitle}>Accès à la caméra</Text>
            <Text style={styles.sheetText}>
              L'accès à la caméra a été refusé. Autorise-le dans les réglages pour prendre une photo,
              ou importe une photo depuis ta galerie.
            </Text>
            <Pressable
              testID="open-settings-button"
              onPress={() => {
                setShowPermissionSheet(false);
                Linking.openSettings();
              }}
              style={({ pressed }) => [styles.primaryButton, styles.sheetButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>Ouvrir les réglages</Text>
            </Pressable>
            <Pressable
              testID="permission-cancel-button"
              onPress={() => setShowPermissionSheet(false)}
              style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}
            >
              <Text style={styles.ghostButtonText}>Annuler</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  flexSpacer: {
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
  progressRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  progressDot: {
    width: 24,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  personBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.5,
    paddingHorizontal: 0,
  },
  subtitle: {
    fontSize: 15,
    color: colors.onSurfaceTertiary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
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
    fontSize: 18,
    fontWeight: "600",
    color: colors.onSurface,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: "600",
  },
  ctaWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
  },
  primaryButton: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  primaryButtonText: {
    color: colors.onBrand,
    fontSize: 17,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  photoStep: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  photoOptions: {
    gap: spacing.lg,
  },
  photoOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadow.soft,
  },
  photoOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  photoOptionText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.onSurface,
  },
  previewWrap: {
    alignItems: "center",
    gap: spacing.md,
  },
  preview: {
    width: 240,
    height: 240,
    borderRadius: radius.lg,
  },
  ghostButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  ghostButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.onSurfaceTertiary,
  },
  fullCenter: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  loadingCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.onSurface,
    textAlign: "center",
  },
  loadingMsg: {
    fontSize: 15,
    color: colors.onSurfaceTertiary,
    textAlign: "center",
  },
  loadingSpinner: {
    marginTop: spacing.md,
  },
  revealCheck: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadow.soft,
  },
  revealButton: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    minWidth: 240,
    ...shadow.soft,
  },
  revealButtonText: {
    color: colors.onBrand,
    fontSize: 17,
    fontWeight: "700",
  },
  errorCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#fdeceb",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    alignItems: "center",
    gap: spacing.md,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.onSurface,
  },
  sheetText: {
    fontSize: 14,
    color: colors.onSurfaceTertiary,
    textAlign: "center",
    lineHeight: 21,
  },
  sheetButton: {
    width: "100%",
  },
});
