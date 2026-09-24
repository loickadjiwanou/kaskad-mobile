import { useEffect, useState } from "react";
import { useAuthStore } from "./auth";
import { useDownloadsStore } from "./downloads";
import { useLibraryStore } from "./library";
import { useSettingsStore } from "./settings";
import { useUpdatesStore } from "./updates";

const stores = [useAuthStore, useDownloadsStore, useLibraryStore, useSettingsStore, useUpdatesStore];

const allHydrated = () => stores.every((s) => s.persist.hasHydrated());

export function useStoresHydrated() {
    const [hydrated, setHydrated] = useState(allHydrated);
    useEffect(() => {
        if (hydrated) return;
        const unsubs = stores.map((s) => s.persist.onFinishHydration(() => allHydrated() && setHydrated(true)));
        if (allHydrated()) setHydrated(true);
        return () => unsubs.forEach((u) => u());
    }, [hydrated]);
    return hydrated;
}
