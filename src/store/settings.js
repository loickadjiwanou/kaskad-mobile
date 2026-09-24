import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistStorage } from "./storage";

export const useSettingsStore = create(
    persist(
        (set) => ({
            themeMode: "system", // "system" | "light" | "dark" (bleu nuit) | "black" (noir)
            language: "system", // "system" | "fr" | "en"
            // Désactivées par défaut : l'utilisateur les active depuis Profil ou la fiche d'une app
            notificationsEnabled: false,
            // Android : dossier (SAF) choisi par l'utilisateur pour enregistrer les fichiers (Téléchargements)
            androidDownloadDirUri: null,
            setThemeMode: (themeMode) => set({ themeMode }),
            setLanguage: (language) => set({ language }),
            setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
            setAndroidDownloadDirUri: (androidDownloadDirUri) => set({ androidDownloadDirUri }),
        }),
        {
            name: "kaskad.settings",
            storage: persistStorage,
            version: 1,
            // v0 → v1 : les notifications passent à "désactivées par défaut"
            migrate: (state, version) => (version < 1 ? { ...state, notificationsEnabled: false, language: "system" } : state),
        },
    ),
);
