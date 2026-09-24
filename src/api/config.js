// URL de l'API FastAPI (PARTIE 2). Sans URL, l'app tourne sur les données de démonstration.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/+$/, "");
export const API_PREFIX = "/api/v1";
export const USE_MOCK = !API_URL;
