import { useCallback } from "react";
import { getLocales } from "expo-localization";
import { useSettingsStore } from "@/store/settings";
import en from "./en";
import fr from "./fr";

const dictionaries = { fr, en };

export const LANGUAGES = ["system", "fr", "en"];
export const LANGUAGE_NAMES = { fr: "Français", en: "English" };

export function resolveLanguage(pref) {
    if (pref === "fr" || pref === "en") return pref;
    const code = getLocales()[0]?.languageCode;
    return code === "fr" ? "fr" : "en";
}

export function getLanguage() {
    return resolveLanguage(useSettingsStore.getState().language);
}

export function localeOf(lang) {
    return lang === "fr" ? "fr-FR" : "en-US";
}

const lookup = (dict, key) => key.split(".").reduce((node, k) => node?.[k], dict);

function pluralSuffix(lang, count) {
    if (lang === "fr") return count < 2 ? "one" : "other";
    return count === 1 ? "one" : "other";
}

export function translate(lang, key, params) {
    let value;
    if (typeof params?.count === "number") {
        const pluralKey = `${key}_${pluralSuffix(lang, params.count)}`;
        value = lookup(dictionaries[lang], pluralKey) ?? lookup(dictionaries.fr, pluralKey);
    }
    value ??= lookup(dictionaries[lang], key) ?? lookup(dictionaries.fr, key) ?? key;
    if (typeof value === "string" && params) value = value.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] ?? "");
    return value;
}

/** Traduction hors composants (services, notifications). */
export const t = (key, params) => translate(getLanguage(), key, params);

/** Hook : re-rend le composant quand la langue change. */
export function useI18n() {
    const pref = useSettingsStore((s) => s.language);
    const lang = resolveLanguage(pref);
    const tr = useCallback((key, params) => translate(lang, key, params), [lang]);
    return { t: tr, lang };
}
