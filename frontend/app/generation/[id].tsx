import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { LiquidGlassButton } from "@/src/components/LiquidGlassButton";
import ResultCards from "@/src/components/ResultCards";
import { api, Generation } from "@/src/lib/api";
import { colors, spacing } from "@/src/theme";

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
        <LiquidGlassButton
          testID="detail-back-button"
          variant="primary"
          height={50}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </LiquidGlassButton>
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
    fontSize: 16,
    color: colors.onSurfaceTertiary,
    fontWeight: "600",
    textAlign: "center",
  },
  backButtonText: {
    color: colors.onBrand,
    fontSize: 16,
    fontWeight: "700",
  },
});
