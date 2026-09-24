import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { useI18n } from "@/i18n";
import { font, spacing, useTheme } from "@/theme";
import Button from "./Button";
import Icon from "./Icon";

export function Loading() {
    const t = useTheme();
    return (
        <View style={styles.center}>
            <ActivityIndicator color={t.primary} size="large" />
        </View>
    );
}

export function EmptyState({ icon = "package-variant", title, message, action }) {
    const t = useTheme();
    return (
        <View style={styles.center}>
            <View style={[styles.iconWrap, { backgroundColor: t.primarySoft }]}>
                <Icon name={icon} size={34} color={t.primary} />
            </View>
            <Text style={[font.h3, { color: t.text, textAlign: "center" }]}>{title}</Text>
            {!!message && <Text style={[font.body, styles.msg, { color: t.textSecondary }]}>{message}</Text>}
            {action}
        </View>
    );
}

export function ErrorState({ error, onRetry }) {
    const { t } = useI18n();
    return (
        <EmptyState
            icon="wifi-off"
            title={t("states.errorTitle")}
            message={error?.message ?? t("states.errorMessage")}
            action={onRetry && <Button title={t("common.retry")} icon="refresh" onPress={onRetry} variant="secondary" />}
        />
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md, minHeight: 280 },
    iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
    msg: { textAlign: "center", maxWidth: 360 },
});
