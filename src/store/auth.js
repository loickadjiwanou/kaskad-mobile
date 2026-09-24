import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistStorage } from "./storage";

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null, // { id, email, anonymous }
            accessToken: null,
            refreshToken: null,
            deviceId: null,
            setSession: ({ access_token, refresh_token, user }) =>
                set({ user, accessToken: access_token, refreshToken: refresh_token }),
            setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
            setDeviceId: (deviceId) => set({ deviceId }),
            logout: () => set({ user: null, accessToken: null, refreshToken: null }),
        }),
        { name: "kaskad.auth", storage: persistStorage },
    ),
);
