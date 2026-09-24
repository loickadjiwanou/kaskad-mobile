import { Tabs } from "expo-router";
import GlassTabBar, { TabBarProvider } from "@/components/GlassTabBar";
import { useI18n } from "@/i18n";
import { useActiveDownloadsCount, useUpdatesCount } from "@/lib/hooks";
import { useTheme } from "@/theme";

export default function TabsLayout() {
    const t = useTheme();
    const { t: tr } = useI18n();
    const updates = useUpdatesCount();
    const active = useActiveDownloadsCount();

    // Icône pleine quand l'onglet est actif, contour sinon
    const tab = (title, icon, { outline = true, label } = {}) => ({
        title,
        tabBarLabel: label ?? title,
        tabBarIconName: icon,
        tabBarIconNameInactive: outline ? `${icon}-outline` : icon,
    });

    return (
        <TabBarProvider>
            <Tabs
                tabBar={(props) => <GlassTabBar {...props} />}
                screenOptions={{
                    headerShown: false,
                    // Changement d'onglet : léger glissement + fondu
                    animation: "shift",
                    sceneStyle: { backgroundColor: t.background },
                }}
            >
                <Tabs.Screen name="index" options={tab(tr("tabs.home"), "home-variant")} />
                <Tabs.Screen name="search" options={tab(tr("tabs.search"), "magnify", { outline: false })} />
                <Tabs.Screen name="my-apps" options={{ ...tab(tr("tabs.myApps"), "view-grid"), tabBarBadge: updates || undefined }} />
                <Tabs.Screen
                    name="downloads"
                    options={{
                        ...tab(tr("tabs.downloads"), "download-circle", { label: tr("tabs.downloadsShort") }),
                        tabBarBadge: active || undefined,
                        tabBarBadgeStyle: { backgroundColor: t.primary },
                    }}
                />
                <Tabs.Screen name="profile" options={tab(tr("tabs.profile"), "account-circle")} />
            </Tabs>
        </TabBarProvider>
    );
}
