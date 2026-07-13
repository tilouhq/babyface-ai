import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import ResultCards from "@/src/components/ResultCards";
import { api, Generation } from "@/src/lib/api";
import { colors, radius, spacing } from "@/src/theme";

export default function GenerationDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [gen, setGen] = useState<Generation | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .getGeneration(id)
      .then(setGen)
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <View style={styles.center} testID="generation-detail-error">
        <Text style={styles.errorText}>Impossible de charger cette génération</Text>
        <Pressable
          testID="detail-back-button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  if (!gen) {
    return (
      <View style={styles.center} testID="generation-detail-loading">
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <ResultCards
      data={{
        father: {
          photo: gen.father_photo_base64,
          age: gen.father_age,
          height: gen.father_height_cm,
        },
        mother: {
          photo: gen.mother_photo_base64,
          age: gen.mother_age,
          height: gen.mother_height_cm,
        },
        baby: {
          photo: gen.baby_photo_base64,
          predictedHeight: gen.predicted_height_cm,
          gender: gen.gender,
        },
      }}
      onClose={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontSize: 15,
    color: colors.onSurfaceTertiary,
    fontWeight: "600",
    textAlign: "center",
  },
  backButton: {
    height: 48,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: colors.onBrand,
    fontSize: 15,
    fontWeight: "700",
  },
});
