import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, TextInput } from "@/components/Text";
import { useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import Card from "@/components/Card";
import FileHasher from "@/components/FileHasher";
import Icon from "@/components/Icon";
import IconButton from "@/components/IconButton";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import SectionHeader from "@/components/SectionHeader";
import { useI18n } from "@/i18n";
import { toast } from "@/lib/dialog";
import { normalizeHash } from "@/lib/format";
import { detectPlatform } from "@/lib/platform";
import { font, radius, spacing, useTheme } from "@/theme";

function CommandBlock({ label, code }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    return (
        <View style={{ gap: 4 }}>
            <Text style={[font.small, { color: t.textSecondary, fontWeight: "600" }]}>{label}</Text>
            <View style={[styles.code, { backgroundColor: t.surfaceAlt }]}>
                <Text style={[font.mono, { color: t.text, flex: 1 }]} selectable>
                    {code}
                </Text>
                <IconButton
                    name="content-copy"
                    size={16}
                    color={t.primary}
                    onPress={async () => {
                        await Clipboard.setStringAsync(code);
                        toast(tr("faq.commandCopied"), { type: "success" });
                    }}
                    label={tr("faq.copyCommand")}
                />
            </View>
        </View>
    );
}

function Section({ section, open, onToggle, highlighted }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    return (
        <Card padded={false} style={highlighted && { borderColor: t.primary }}>
            <Pressable onPress={onToggle} style={styles.sectionHead} accessibilityRole="button" accessibilityState={{ expanded: open }}>
                <View style={[styles.sectionIcon, { backgroundColor: t.primarySoft }]}>
                    <Icon name={section.icon} size={20} color={t.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[font.h3, { color: t.text }]}>{section.title}</Text>
                    {highlighted && <Text style={[font.tiny, { color: t.primary, fontWeight: "700" }]}>{tr("faq.forDevice")}</Text>}
                </View>
                <Icon name={open ? "chevron-up" : "chevron-down"} size={22} color={t.textSecondary} />
            </Pressable>
            {open && (
                <View style={styles.sectionBody}>
                    <Text style={[font.body, { color: t.text }]}>{section.intro}</Text>
                    {section.steps?.map((s, i) => (
                        <View key={i} style={styles.step}>
                            <View style={[styles.stepNum, { backgroundColor: t.primary }]}>
                                <Text style={styles.stepNumText}>{i + 1}</Text>
                            </View>
                            <Text style={[font.body, { color: t.text, flex: 1 }]}>{s}</Text>
                        </View>
                    ))}
                    {section.commands?.map((c) => (
                        <CommandBlock key={c.label} {...c} />
                    ))}
                    {section.tips?.map((tip, i) => (
                        <View key={i} style={styles.tip}>
                            <Icon name="lightbulb-on-outline" size={16} color={t.warning} />
                            <Text style={[font.small, { color: t.textSecondary, flex: 1 }]}>{tip}</Text>
                        </View>
                    ))}
                </View>
            )}
        </Card>
    );
}

function HashField({ label, value, onChangeText }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    return (
        <View style={{ gap: 4 }}>
            <Text style={[font.small, { color: t.textSecondary, fontWeight: "600" }]}>{label}</Text>
            <View style={[styles.hashInput, { borderColor: t.border, backgroundColor: t.background }]}>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={tr("faq.hashPlaceholder")}
                    placeholderTextColor={t.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[font.mono, { color: t.text, flex: 1, paddingVertical: 10, outlineStyle: "none" }]}
                />
                <IconButton
                    name="content-paste"
                    size={18}
                    color={t.primary}
                    onPress={async () => onChangeText(await Clipboard.getStringAsync())}
                    label={tr("common.paste")}
                />
            </View>
        </View>
    );
}

/** Outil de comparaison de deux empreintes (spec : vérification d'intégrité par comparaison du hash). */
function HashComparator() {
    const t = useTheme();
    const { t: tr } = useI18n();
    const [expected, setExpected] = useState("");
    const [actual, setActual] = useState("");
    const [fileName, setFileName] = useState(null);
    const a = normalizeHash(expected);
    const b = normalizeHash(actual);
    const ready = a.length > 0 && b.length > 0;
    const valid = a.length === 64 && b.length === 64;
    const match = ready && a === b;

    return (
        <Card style={{ gap: spacing.md }}>
            <HashField label={tr("faq.expected")} value={expected} onChangeText={setExpected} />
            <HashField
                label={fileName ? tr("faq.actualFile", { name: fileName }) : tr("faq.actual")}
                value={actual}
                onChangeText={(v) => {
                    setActual(v);
                    setFileName(null);
                }}
            />
            <FileHasher
                onHash={(hash, name) => {
                    setActual(hash);
                    setFileName(name);
                }}
            />
            {ready && (
                <View style={[styles.result, { backgroundColor: match ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)" }]}>
                    <Icon name={match ? "shield-check" : "shield-alert"} size={22} color={match ? t.success : t.danger} />
                    <Text style={[font.body, { color: match ? t.success : t.danger, fontWeight: "700", flex: 1 }]}>
                        {tr(match ? "faq.match" : valid ? "faq.mismatch" : "faq.invalid")}
                    </Text>
                </View>
            )}
        </Card>
    );
}

export default function Faq() {
    const { t: tr } = useI18n();
    const { section } = useLocalSearchParams();
    const { target } = detectPlatform();
    const [open, setOpen] = useState(() => ({ [section ?? target ?? "general"]: true }));

    // La section de la plateforme du terminal est affichée juste après la présentation générale
    const ordered = [...tr("faq.sections")].sort((x, y) => (y.platform === target) - (x.platform === target) || 0);
    const general = ordered.find((s) => s.id === "general");
    const rest = ordered.filter((s) => s.id !== "general");

    return (
        <Screen>
            <ScreenHeader back title={tr("faq.title")} subtitle={tr("faq.subtitle")} />
            <View style={styles.list}>
                {[general, ...rest].map((s) => (
                    <Section
                        key={s.id}
                        section={s}
                        open={!!open[s.id]}
                        highlighted={s.platform && s.platform === target}
                        onToggle={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))}
                    />
                ))}
            </View>
            <SectionHeader title={tr("faq.compareTitle")} />
            <View style={styles.list}>
                <HashComparator />
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    list: { paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.sm },
    sectionHead: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
    sectionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    sectionBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
    step: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
    stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 1 },
    stepNumText: { color: "#fff", fontWeight: "800", fontSize: 12 },
    tip: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
    code: { flexDirection: "row", alignItems: "center", borderRadius: radius.md, paddingLeft: spacing.md, paddingVertical: 4 },
    hashInput: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radius.md, paddingLeft: spacing.md },
    result: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
});
