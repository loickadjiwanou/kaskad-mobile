import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistStorage } from "./storage";

/** Nom public du compte (avis) : nom choisi, sinon la partie de l'e-mail avant @. */
export const displayName = (user) => user?.name?.trim() || user?.email?.split("@")[0] || "";

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null, // { id, email, name, anonymous }
            accessToken: null,
            refreshToken: null,
            deviceId: null,
            // Jeton push enregistré sur le compte (retiré à la déconnexion)
            pushToken: null,
            setSession: ({ access_token, refresh_token, user }) => set({ user, accessToken: access_token, refreshToken: refresh_token }),
            setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
            setUser: (user) => set({ user }),
            setDeviceId: (deviceId) => set({ deviceId }),
            setPushToken: (pushToken) => set({ pushToken }),
            logout: () => set({ user: null, accessToken: null, refreshToken: null, pushToken: null }),
        }),
        { name: "kaskad.auth", storage: persistStorage },
    ),
);
