import { useRef, useState } from "react";
import { sha256OfBlob } from "@/services/downloader";
import { useI18n } from "@/i18n";
import Button from "./Button";

/** Web / desktop : calcule le SHA-256 d'un fichier choisi localement (rien n'est envoyé). */
export default function FileHasher({ onHash }) {
    const { t } = useI18n();
    const input = useRef(null);
    const [busy, setBusy] = useState(false);
    const onChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBusy(true);
        try {
            onHash(await sha256OfBlob(file), file.name);
        } finally {
            setBusy(false);
            e.target.value = "";
        }
    };
    return (
        <>
            <input ref={input} type="file" style={{ display: "none" }} onChange={onChange} />
            <Button title={t("faq.fromFile")} icon="file-search-outline" size="sm" variant="secondary" loading={busy} onPress={() => input.current?.click()} />
        </>
    );
}
