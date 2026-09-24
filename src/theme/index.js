import { Platform, useColorScheme } from "react-native";
import palette from "@assets/colors/palette";
import { useSettingsStore } from "@/store/settings";

const base = {
    primary: palette.primary.DEFAULT,
    primaryDark: palette.primary.dark,
    accent: palette.accent.DEFAULT,
    tertiary: palette.tertiary.DEFAULT,
    success: palette.semantic.success,
    warning: palette.semantic.warning,
    danger: palette.semantic.danger,
    info: palette.semantic.info,
    onPrimary: "#FFFFFF",
    gradient: palette.gradient.brand,
    gradientShort: palette.gradient.brandShort,
};

const light = {
    ...base,
    scheme: "light",
    isDark: false,
    background: palette.light.background,
    surface: palette.light.surface,
    surfaceAlt: palette.neutral[100],
    text: palette.light.textPrimary,
    textSecondary: palette.light.textSecondary,
    textMuted: palette.neutral[400],
    border: palette.light.border,
    primarySoft: "#E8F0FF",
    accentText: palette.accent.darker,
    tabBar: palette.light.background,
};

const dark = {
    ...base,
    scheme: "dark",
    isDark: true,
    primary: palette.primary.lighter,
    background: palette.dark.background,
    surface: palette.dark.surface,
    surfaceAlt: palette.neutral[700],
    text: palette.dark.textPrimary,
    textSecondary: palette.dark.textSecondary,
    textMuted: palette.neutral[500],
    border: palette.dark.border,
    primarySoft: "#1E2F55",
    accentText: palette.accent.light,
    tabBar: palette.neutral[950],
};

// Mode "Noir" : fond noir pur (écrans OLED), surfaces gris très sombre
const black = {
    ...dark,
    scheme: "black",
    background: "#000000",
    surface: "#0E0E10",
    surfaceAlt: "#1C1C1F",
    border: "#26262A",
    text: "#FAFAFA",
    textSecondary: "#A1A1AA",
    textMuted: "#71717A",
    primarySoft: "#0F1A33",
    tabBar: "#000000",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };
export const font = {
    h1: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
    h3: { fontSize: 17, fontWeight: "700" },
    body: { fontSize: 15, lineHeight: 22 },
    small: { fontSize: 13 },
    tiny: { fontSize: 11 },
    mono: {
        fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "ui-monospace, Menlo, Consolas, monospace" }),
        fontSize: 12,
    },
};

export function useTheme() {
    const system = useColorScheme();
    const mode = useSettingsStore((s) => s.themeMode);
    const scheme = mode === "system" ? (system ?? "light") : mode;
    return { light, dark, black }[scheme] ?? light;
}

export { palette };
