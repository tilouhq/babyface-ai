export const colors = {
  surface: "#ffffff",
  onSurface: "#111827",
  surfaceSecondary: "#f8fafc",
  onSurfaceSecondary: "#334155",
  surfaceTertiary: "#f1f5f9",
  onSurfaceTertiary: "#475569",
  brand: "#987ad6",
  onBrand: "#ffffff",
  brandSoft: "#f1ecfa",
  blue: "#3b82f6",
  blueSoft: "#e8f1fe",
  pink: "#f472b6",
  pinkSoft: "#fdeaf4",
  success: "#22c55e",
  successSoft: "#e9f9ef",
  error: "#ef4444",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  divider: "#f1f5f9",
  muted: "#94a3b8",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  soft: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const genderColor = (g: "boy" | "girl") =>
  g === "boy" ? colors.blue : colors.pink;

export const genderSoft = (g: "boy" | "girl") =>
  g === "boy" ? colors.blueSoft : colors.pinkSoft;
