import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { Inter_800ExtraBold } from "@expo-google-fonts/inter/800ExtraBold";

// Police de l'app : Inter (uniquement les graisses utilisées, pour limiter la taille du bundle)
export const FONT_ASSETS = { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold };

const FAMILY_BY_WEIGHT = {
    400: "Inter_400Regular",
    500: "Inter_500Medium",
    600: "Inter_600SemiBold",
    700: "Inter_700Bold",
    800: "Inter_800ExtraBold",
    900: "Inter_800ExtraBold",
};

/** Famille Inter correspondant à un fontWeight ("bold", "600", 700…). */
export function fontFamilyFor(weight) {
    if (weight === "bold") return FAMILY_BY_WEIGHT[700];
    const w = Number(weight) || 400;
    return FAMILY_BY_WEIGHT[Math.min(900, Math.max(400, Math.round(w / 100) * 100))];
}

// Polices de React Navigation (libellés des onglets, en-têtes)
export const navigationFonts = {
    regular: { fontFamily: FAMILY_BY_WEIGHT[400], fontWeight: "400" },
    medium: { fontFamily: FAMILY_BY_WEIGHT[500], fontWeight: "500" },
    bold: { fontFamily: FAMILY_BY_WEIGHT[700], fontWeight: "700" },
    heavy: { fontFamily: FAMILY_BY_WEIGHT[800], fontWeight: "800" },
};
