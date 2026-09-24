import { useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import { api } from "@/api";
import { ACTIVE_STATUSES, useDownloadsStore } from "@/store/downloads";
import { useUpdatesStore } from "@/store/updates";

export const WIDE_BREAKPOINT = 900;

export function useIsWide() {
    return useWindowDimensions().width >= WIDE_BREAKPOINT;
}

let categoriesCache = null;
let categoriesPromise = null;

/** Catégories (définies côté admin), mises en cache pour la session. */
export function useCategories() {
    const [categories, setCategories] = useState(categoriesCache ?? []);
    useEffect(() => {
        if (categoriesCache) return;
        categoriesPromise ??= api.getCategories().then((c) => (categoriesCache = c));
        categoriesPromise.then(setCategories).catch(() => {
            categoriesPromise = null;
        });
    }, []);
    return categories;
}

/** Téléchargement le plus récent d'une version (pour l'afficher sur la fiche). */
export function useDownloadForVersion(versionId) {
    return useDownloadsStore((s) => s.items.find((it) => it.versionId === versionId) ?? null);
}

export function useActiveDownloadsCount() {
    return useDownloadsStore((s) => s.items.filter((it) => ACTIVE_STATUSES.includes(it.status)).length);
}

export function useUpdatesCount() {
    return useUpdatesStore((s) => Object.keys(s.available).length);
}

/**
 * Nombre de colonnes pour les listes selon la largeur disponible
 * (téléphone : 1, tablette / fenêtre moyenne : 2, grand écran : 3, très grand : 4).
 */
export function columnsFor(width, { max = 4 } = {}) {
    const cols = width >= 1600 ? 4 : width >= 1150 ? 3 : width >= 700 ? 2 : 1;
    return Math.min(cols, max);
}

export function useColumns(options) {
    return columnsFor(useWindowDimensions().width, options);
}
