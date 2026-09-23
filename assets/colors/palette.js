// Palette de couleurs — Kaskad
// Primaire : Indigo/bleu-violet (identité de marque, logo, app client)
// Neutres : Slate (console admin, fonds, textes)
// Accent : Cyan (call-to-action, liens, éléments interactifs)

const palette = {
    primary: {
        lighter: "#818CF8",
        light: "#6366F1",
        DEFAULT: "#4F46E5",
        dark: "#4338CA",
        darker: "#3730A3",
    },
    accent: {
        lighter: "#67E8F9",
        light: "#22D3EE",
        DEFAULT: "#06B6D4",
        dark: "#0891B2",
        darker: "#0E7490",
    },
    neutral: {
        50: "#F8FAFC",
        100: "#F1F5F9",
        200: "#E2E8F0",
        300: "#CBD5E1",
        400: "#94A3B8",
        500: "#64748B",
        600: "#475569",
        700: "#334155",
        800: "#1E293B",
        900: "#0F172A",
        950: "#020617",
    },
    semantic: {
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
    },
    light: {
        background: "#FFFFFF",
        surface: "#F8FAFC",
        textPrimary: "#0F172A",
        textSecondary: "#475569",
        border: "#E2E8F0",
    },
    dark: {
        background: "#0F172A",
        surface: "#1E293B",
        textPrimary: "#F8FAFC",
        textSecondary: "#94A3B8",
        border: "#334155",
    },
    gradient: {
        brand: ["#4F46E5", "#06B6D4"],
    },
};

export default palette;