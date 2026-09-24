import { useEffect } from "react";
import { AppState, Image, Platform, StyleSheet, View } from "react-native";
import { router, Stack, withLayoutContext } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import * as SystemUI from "expo-system-ui";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { CardStyleInterpolators, createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import DialogHost from "@/components/DialogHost";
import ToastHost from "@/components/ToastHost";
import { useStoresHydrated } from "@/store/hydration";
import { useUpdatesStore } from "@/store/updates";
import { getDeviceId, registerPushToken, startLibrarySync } from "@/services/account";
import { addNotificationOpenListener } from "@/services/notifications";
import { checkForUpdates } from "@/services/updates";
import { detectPlatform } from "@/lib/platform";
import { useTheme } from "@/theme";
import { FONT_ASSETS, navigationFonts } from "@/theme/fonts";

const CHECK_INTERVAL_MS = 15 * 60 * 1000;

function isStale() {
    const last = useUpdatesStore.getState().lastCheckedAt;
    return !last || Date.now() - new Date(last).getTime() > CHECK_INTERVAL_MS;
}

function useAppLifecycle(ready) {
    useEffect(() => {
        if (!ready) return;
        getDeviceId();
        const stopSync = startLibrarySync();
        const check = () => checkForUpdates().catch(() => {});
        check();
        registerPushToken().catch(() => {});

        const stopOpen = addNotificationOpenListener((data) => data?.url && router.push(data.url));
        const sub = AppState.addEventListener("change", (state) => state === "active" && isStale() && check());
        // Desktop : pas de push natif, on vérifie périodiquement les nouvelles versions
        const interval = detectPlatform().isDesktop ? setInterval(check, CHECK_INTERVAL_MS) : null;

        return () => {
            stopSync();
            stopOpen();
            sub.remove();
            if (interval) clearInterval(interval);
        };
    }, [ready]);
}

// iOS : pile native (transitions système + retour par geste plein écran).
// Android / web : pile animée en JS. La pile native Android détache l'écran précédent et le
// redessine au retour, ce qui laissait voir un écran blanc ; ici les deux écrans restent affichés
// pendant tout le glissement.
const USE_NATIVE_STACK = Platform.OS === "ios";
const JsStack = withLayoutContext(createStackNavigator().Navigator);
const AppStack = USE_NATIVE_STACK ? Stack : JsStack;

const nativeOptions = (t) => ({
    headerShown: false,
    contentStyle: { backgroundColor: t.background },
    fullScreenGestureEnabled: true,
});

const jsOptions = (t) => ({
    headerShown: false,
    // Glissement latéral façon iOS, avec l'écran précédent légèrement décalé et assombri
    ...TransitionPresets.SlideFromRightIOS,
    // Web : sans "float", la carte passe en mode page (défilement du document) et l'écran ne défile plus
    headerMode: "float",
    gestureEnabled: Platform.OS !== "web",
    cardStyle: { backgroundColor: t.background },
    cardOverlayEnabled: true,
    detachPreviousScreen: false,
});

// Visionneuse d'images : écran transparent par-dessus la fiche, apparition en fondu
const galleryOptions = USE_NATIVE_STACK
    ? { presentation: "transparentModal", animation: "fade", contentStyle: { backgroundColor: "transparent" }, gestureEnabled: false }
    : {
          presentation: "transparentModal",
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
          cardStyle: { backgroundColor: "transparent" },
          cardOverlayEnabled: false,
          gestureEnabled: false,
      };

const stackOptions = (t) => (USE_NATIVE_STACK ? nativeOptions(t) : jsOptions(t));

// La connexion s'ouvre comme une feuille montant depuis le bas
const modalOptions = USE_NATIVE_STACK
    ? { presentation: "modal", fullScreenGestureEnabled: false }
    : { ...TransitionPresets.ModalSlideFromBottomIOS, gestureDirection: "vertical" };

export default function RootLayout() {
    const hydrated = useStoresHydrated();
    const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
    // En cas d'échec de chargement de la police, l'app démarre quand même avec la police système
    const ready = hydrated && (fontsLoaded || !!fontError);
    const t = useTheme();
    useAppLifecycle(hydrated);

    // iOS : portrait uniquement. Android (tablettes) et desktop suivent l'orientation / la taille de fenêtre.
    useEffect(() => {
        if (Platform.OS === "ios") ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    }, []);

    // Web / Electron : aucune barre de défilement visible (le défilement reste actif)
    useEffect(() => {
        if (Platform.OS !== "web" || document.getElementById("kaskad-hide-scrollbars")) return;
        const style = document.createElement("style");
        style.id = "kaskad-hide-scrollbars";
        style.textContent = "* { scrollbar-width: none; } *::-webkit-scrollbar { display: none; width: 0; height: 0; }";
        document.head.appendChild(style);
    }, []);

    // Fond de la fenêtre native = fond du thème (jamais de blanc visible derrière les écrans)
    useEffect(() => {
        SystemUI.setBackgroundColorAsync(t.background).catch(() => {});
    }, [t.background]);

    const navTheme = t.isDark ? DarkTheme : DefaultTheme;
    const theme = {
        ...navTheme,
        fonts: navigationFonts,
        colors: { ...navTheme.colors, primary: t.primary, background: t.background, card: t.tabBar, text: t.text, border: t.border },
    };

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: t.background }}>
            <SafeAreaProvider>
                <ThemeProvider value={theme}>
                    <StatusBar style={t.isDark ? "light" : "dark"} />
                    {ready ? (
                        <AppStack screenOptions={stackOptions(t)}>
                            <AppStack.Screen name="(tabs)" />
                            <AppStack.Screen name="app/[id]" />
                            <AppStack.Screen name="category/[id]" />
                            <AppStack.Screen name="favorites" />
                            <AppStack.Screen name="faq" />
                            <AppStack.Screen name="auth" options={modalOptions} />
                            <AppStack.Screen name="gallery" options={galleryOptions} />
                        </AppStack>
                    ) : (
                        <View style={[styles.splash, { backgroundColor: t.background }]}>
                            <Image source={require("@assets/icons/kaskad_transparent.png")} style={styles.logo} resizeMode="contain" />
                        </View>
                    )}
                    {/* Alertes et toasts maison, au-dessus de tous les écrans */}
                    {ready && <ToastHost />}
                    {ready && <DialogHost />}
                </ThemeProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    splash: { flex: 1, alignItems: "center", justifyContent: "center" },
    logo: { width: 120, height: 120 },
});
