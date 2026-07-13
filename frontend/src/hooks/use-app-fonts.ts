// Loads all fonts needed by the app:
//   1. @expo/vector-icons families (Expo Go only — same behavior as before)
//   2. Instrument Serif — the app's global typeface
// Returns [loaded, error] so RootLayout can gate SplashScreen.

import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from "@expo-google-fonts/instrument-serif";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useFonts } from "expo-font";

const ICON_VECTOR_VERSION = "15.1.1";

const ICON_FAMILIES: Record<string, string> = {
  anticon: "AntDesign",
  entypo: "Entypo",
  evilicons: "EvilIcons",
  feather: "Feather",
  FontAwesome: "FontAwesome",
  Fontisto: "Fontisto",
  foundation: "Foundation",
  ionicons: "Ionicons",
  "material-community": "MaterialCommunityIcons",
  material: "MaterialIcons",
  octicons: "Octicons",
  "simple-line-icons": "SimpleLineIcons",
  zocial: "Zocial",
  "FontAwesome5Free-Regular": "FontAwesome5_Regular",
  "FontAwesome5Free-Solid": "FontAwesome5_Solid",
  "FontAwesome5Free-Brand": "FontAwesome5_Brands",
  "FontAwesome6Free-Regular": "FontAwesome6_Regular",
  "FontAwesome6Free-Solid": "FontAwesome6_Solid",
  "FontAwesome6Free-Brand": "FontAwesome6_Brands",
};

const cdnUrl = (file: string): string =>
  `https://cdn.jsdelivr.net/npm/@expo/vector-icons@${ICON_VECTOR_VERSION}/build/vendor/react-native-vector-icons/Fonts/${file}.ttf`;

const iconFontMap = (): Record<string, string> =>
  Object.fromEntries(
    Object.entries(ICON_FAMILIES).map(([key, file]) => [key, cdnUrl(file)]),
  );

export const APP_FONT_REGULAR = "InstrumentSerif_400Regular";
export const APP_FONT_ITALIC = "InstrumentSerif_400Regular_Italic";

export const useAppFonts = (): readonly [boolean, Error | null] => {
  const iconsMap =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
      ? iconFontMap()
      : {};

  return useFonts({
    ...iconsMap,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });
};
